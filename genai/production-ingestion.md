# ⚙️ Production Ingestion — A Complete Guide

> **Production ingestion** is the discipline of reliably processing documents into a vector database at scale — without blocking users, losing data, or leaving the system in an inconsistent state.

---

## Table of Contents

1. [Why Ingestion Should Never Block a Web Request](#1-why-ingestion-should-never-block-a-web-request)
2. [Queue-Based Ingestion Architecture](#2-queue-based-ingestion-architecture)
3. [Background Workers for Document Processing](#3-background-workers-for-document-processing)
4. [Handling Failures and Retrying Jobs Safely](#4-handling-failures-and-retrying-jobs-safely)
5. [Tracking Ingestion Progress](#5-tracking-ingestion-progress)

---

## 1. Why Ingestion Should Never Block a Web Request

### The Naive Approach (And Why It Breaks)

A tempting first implementation looks like this:

```python
# ❌ BAD: Synchronous ingestion inside a web request

@app.post("/upload")
async def upload_document(file: UploadFile):
    # Step 1: Parse the PDF (2-30 seconds)
    text = parse_pdf(file)
    
    # Step 2: Chunk the text (0.5-2 seconds)
    chunks = recursive_chunk(text, chunk_size=512)
    
    # Step 3: Generate embeddings via API (3-60 seconds)
    embeddings = openai.embeddings.create(input=chunks, model="text-embedding-3-small")
    
    # Step 4: Store in vector DB (1-5 seconds)
    qdrant.upsert(collection_name="docs", points=build_points(chunks, embeddings))
    
    # Total: 7-97 seconds... the user is staring at a spinner
    return {"status": "done"}
```

This works for a demo. In production, it's a disaster.

### What Goes Wrong

```
User uploads a 200-page PDF
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    THE WALL OF PROBLEMS                          │
│                                                                  │
│  ⏱️ TIMEOUT                                                     │
│  Web servers (Nginx, ALB) have 30-60 second timeouts.           │
│  A large PDF takes 90+ seconds to process.                      │
│  → Request times out. User sees an error. Work is lost.         │
│                                                                  │
│  🔒 THREAD STARVATION                                           │
│  Each upload consumes a server thread for minutes.              │
│  10 concurrent uploads = all threads consumed.                  │
│  → Other users can't even load the homepage.                    │
│                                                                  │
│  💸 API RATE LIMITS                                              │
│  OpenAI embedding API has rate limits.                          │
│  Burst of uploads → rate limit hit mid-request.                 │
│  → Request fails. No retry. Data partially ingested.            │
│                                                                  │
│  💥 PARTIAL FAILURE                                              │
│  What if embedding succeeds but vector DB write fails?          │
│  → Chunks 1-50 stored, 51-100 lost. Inconsistent state.        │
│                                                                  │
│  📈 NO BACKPRESSURE                                              │
│  100 users upload simultaneously.                               │
│  Server tries to process all 100 at once.                       │
│  → Memory spikes, OOM kill, server crash.                       │
│                                                                  │
│  🔍 NO VISIBILITY                                                │
│  User has no idea what's happening.                             │
│  "Is it processing? Did it fail? Should I re-upload?"           │
│  → Bad UX. Duplicate uploads. Support tickets.                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Correct Approach: Accept, Acknowledge, Process Later

```python
# ✅ GOOD: Asynchronous ingestion

@app.post("/upload")
async def upload_document(file: UploadFile):
    # Step 1: Save the raw file (fast — milliseconds)
    file_path = save_to_storage(file)
    
    # Step 2: Create a job record (fast — milliseconds)
    job_id = db.create_job(
        file_path=file_path,
        status="queued",
        created_at=datetime.now()
    )
    
    # Step 3: Enqueue for background processing (fast — milliseconds)
    queue.enqueue("process_document", job_id=job_id)
    
    # Step 4: Return immediately with job ID (total: <100ms)
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Document accepted. Processing will begin shortly.",
        "status_url": f"/jobs/{job_id}/status"
    }
```

```
Timeline comparison:

SYNCHRONOUS (❌):
  User ──── Upload ────────────── [======= 90 seconds of waiting =======] ──── Done
                                  Server thread BLOCKED the entire time

ASYNCHRONOUS (✅):
  User ──── Upload ── Response in 100ms ✅
                          │
  Background ─────────── [======= Processing =======] ── Done
                          User can continue working
                          Server handles other requests
```

### The Golden Rule

> **A web request should do exactly three things:**
> 1. **Validate** the input.
> 2. **Persist** the raw data.
> 3. **Enqueue** the work.
>
> Everything else happens in the background.

### Response Time Budgets

| Operation | Target | Reality |
|-----------|--------|---------|
| File upload + save | < 500ms | Depends on file size |
| Create DB record | < 50ms | Database write |
| Enqueue job | < 50ms | Message broker publish |
| **Total API response** | **< 1 second** | **Always achievable** |
| Background processing | 10s – 10min | Doesn't affect user |

---

## 2. Queue-Based Ingestion Architecture

### The Big Picture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │     │   API Server │     │  Message      │     │  Background  │
│              │────▶│              │────▶│  Queue        │────▶│  Workers     │
│  Upload UI   │     │  /upload     │     │              │     │              │
│  Status UI   │     │  /jobs/:id   │     │  (Redis /    │     │  Parse       │
│              │     │              │     │   RabbitMQ / │     │  Chunk       │
└──────────────┘     └──────┬───────┘     │   SQS)       │     │  Embed       │
                            │             └──────────────┘     │  Store       │
                            │                                   └──────┬───────┘
                            │                                          │
                     ┌──────┴───────┐                           ┌──────┴───────┐
                     │  Database    │                           │  Vector DB   │
                     │  (Postgres)  │                           │  (Qdrant)    │
                     │              │                           │              │
                     │  Jobs table  │                           │  Embeddings  │
                     │  Status      │                           │  Payloads    │
                     │  Progress    │                           │              │
                     └──────────────┘                           └──────────────┘
```

### Component Responsibilities

| Component | Responsibility | Scaling Strategy |
|-----------|---------------|-----------------|
| **API Server** | Accept uploads, create jobs, enqueue work | Horizontal (more instances) |
| **Object Storage** | Store raw files durably (S3, GCS, MinIO) | Managed, virtually unlimited |
| **Message Queue** | Buffer work, decouple producers from consumers | Managed (SQS) or clustered (Redis) |
| **Database** | Track job metadata, status, progress | Single primary + read replicas |
| **Workers** | Process documents (CPU/GPU-intensive work) | Horizontal (more workers) |
| **Vector DB** | Store and search embeddings | Horizontal (sharding) |

### Choosing a Message Queue

| Queue | Best For | Persistence | Ordering | Complexity |
|-------|----------|-------------|----------|------------|
| **Redis + BullMQ** | Small-medium scale, simple setup | Optional (RDB/AOF) | Per-queue FIFO | ⭐ Low |
| **RabbitMQ** | Complex routing, multiple consumers | Yes (disk-backed) | Per-queue FIFO | ⭐⭐ Medium |
| **AWS SQS** | Serverless, fully managed | Yes | Best-effort (FIFO available) | ⭐ Low |
| **Apache Kafka** | High throughput, event streaming | Yes (log-based) | Per-partition | ⭐⭐⭐ High |
| **Celery** | Python-native, feature-rich | Via broker (Redis/RabbitMQ) | Per-queue | ⭐⭐ Medium |

### Architecture with Redis + BullMQ (Node.js)

```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│                 ┌─────────┐                                   │
│  Upload ──────▶ │  API    │──▶ BullMQ Queue ──▶ Worker 1      │
│                 │  Server │        (Redis)  ──▶ Worker 2      │
│  Poll status ──▶│         │                 ──▶ Worker 3      │
│                 └────┬────┘                                   │
│                      │                          │ │ │         │
│                      ▼                          ▼ ▼ ▼         │
│                  PostgreSQL               Qdrant / Pinecone   │
│                  (job status)             (vectors)           │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Architecture with Celery (Python)

```
┌───────────────────────────────────────────────────────────────┐
│                                                                │
│                 ┌──────────┐                                  │
│  Upload ──────▶ │  FastAPI │──▶ Celery Task ──▶ Worker 1      │
│                 │  Server  │   (Redis broker)──▶ Worker 2     │
│  Poll status ──▶│          │                 ──▶ Worker 3     │
│                 └────┬─────┘                                  │
│                      │                          │ │ │         │
│                      ▼                          ▼ ▼ ▼         │
│                  PostgreSQL               Qdrant / Pinecone   │
│                  (job status)             (vectors)           │
│                                                                │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow: Step by Step

```
1. USER uploads "annual_report.pdf"
        │
        ▼
2. API SERVER:
   a. Validates file (type, size, auth)
   b. Saves file to S3:  s3://uploads/abc123/annual_report.pdf
   c. Creates job record in PostgreSQL:
      ┌──────────────────────────────────────────────────┐
      │ id: "job_7f3a"                                   │
      │ file_path: "s3://uploads/abc123/annual_report.pdf│
      │ status: "queued"                                 │
      │ created_at: "2025-01-15T10:30:00Z"               │
      │ total_chunks: null (unknown yet)                 │
      │ processed_chunks: 0                              │
      │ error: null                                      │
      └──────────────────────────────────────────────────┘
   d. Publishes message to queue:
      {"job_id": "job_7f3a", "action": "process_document"}
   e. Returns: {"job_id": "job_7f3a", "status": "queued"}
        │
        ▼
3. MESSAGE QUEUE holds the job until a worker picks it up
        │
        ▼
4. WORKER picks up the job and processes it:
   a. Downloads file from S3
   b. Parses PDF → extracts text
   c. Chunks text → 150 chunks
   d. Updates DB: status="processing", total_chunks=150
   e. Generates embeddings (batched)
   f. Stores in Qdrant
   g. Updates DB: status="completed", processed_chunks=150
        │
        ▼
5. USER polls GET /jobs/job_7f3a/status
   → {"status": "completed", "progress": 100, "chunks": 150}
```

### Database Schema for Jobs

```sql
CREATE TABLE ingestion_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    
    -- File info
    file_name       VARCHAR(500) NOT NULL,
    file_path       VARCHAR(1000) NOT NULL,      -- S3/GCS path
    file_size_bytes BIGINT,
    file_type       VARCHAR(50),                 -- "pdf", "md", "html"
    
    -- Processing status
    status          VARCHAR(50) NOT NULL DEFAULT 'queued',
        -- queued → processing → completed
        --                     → failed
        --                     → cancelled
    
    -- Progress tracking
    total_chunks       INTEGER,
    processed_chunks   INTEGER DEFAULT 0,
    total_steps        INTEGER DEFAULT 4,        -- parse, chunk, embed, store
    current_step       INTEGER DEFAULT 0,
    current_step_name  VARCHAR(100),
    
    -- Error handling
    error_message   TEXT,
    error_code      VARCHAR(100),
    retry_count     INTEGER DEFAULT 0,
    max_retries     INTEGER DEFAULT 3,
    
    -- Timing
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    
    -- Result
    collection_name VARCHAR(200),                -- Qdrant collection
    point_ids       UUID[],                      -- IDs stored in Qdrant
    
    -- Indexes
    CONSTRAINT valid_status CHECK (
        status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')
    )
);

CREATE INDEX idx_jobs_user_id ON ingestion_jobs(user_id);
CREATE INDEX idx_jobs_status ON ingestion_jobs(status);
CREATE INDEX idx_jobs_created_at ON ingestion_jobs(created_at);
```

---

## 3. Background Workers for Document Processing

### What Is a Background Worker?

A background worker is a **long-running process** that pulls jobs from a queue and executes them independently of the web server. Workers are separate processes (often separate containers/machines) that can be scaled horizontally.

```
Web Server (handles HTTP)          Workers (process documents)
┌─────────────────────┐            ┌─────────────────────┐
│  Process 1 (web)    │            │  Process 1 (worker)  │
│  Process 2 (web)    │            │  Process 2 (worker)  │
│  Process 3 (web)    │            │  Process 3 (worker)  │
│  Process 4 (web)    │            │  Process 4 (worker)  │
└─────────┬───────────┘            └─────────┬───────────┘
          │                                   │
          └──────────┐    ┌───────────────────┘
                     ▼    ▼
              ┌──────────────┐
              │    Redis     │
              │   (Queue)    │
              └──────────────┘
              
Scale independently:
  - High traffic, few uploads? → Scale web, keep 2 workers
  - Bulk import? → Keep web, scale to 20 workers
```

### Implementation with Celery (Python)

#### Project Structure

```
ingestion/
├── app.py              # FastAPI web server
├── tasks.py            # Celery task definitions
├── worker.py           # Celery worker configuration
├── pipeline/
│   ├── __init__.py
│   ├── parser.py       # Document parsing
│   ├── chunker.py      # Text chunking
│   ├── embedder.py     # Embedding generation
│   └── store.py        # Vector DB storage
├── models.py           # Database models
└── config.py           # Configuration
```

#### Worker Configuration

```python
# worker.py
from celery import Celery

celery_app = Celery(
    "ingestion",
    broker="redis://localhost:6379/0",         # Job queue
    backend="redis://localhost:6379/1",         # Result storage
)

celery_app.conf.update(
    # Concurrency
    worker_concurrency=4,                      # 4 tasks in parallel per worker
    worker_prefetch_multiplier=1,              # Fetch 1 task at a time (for long tasks)
    
    # Serialization
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    
    # Time limits
    task_soft_time_limit=300,                  # Soft limit: 5 minutes (raises exception)
    task_time_limit=600,                       # Hard limit: 10 minutes (kills task)
    
    # Retry
    task_acks_late=True,                       # Acknowledge AFTER completion (not before)
    task_reject_on_worker_lost=True,           # Re-queue if worker crashes
    
    # Rate limiting
    task_default_rate_limit="10/m",            # Max 10 tasks per minute (API rate limits)
    
    # Result expiration
    result_expires=86400,                      # Results expire after 24 hours
)
```

#### Task Definitions

```python
# tasks.py
from worker import celery_app
from pipeline.parser import parse_document
from pipeline.chunker import chunk_text
from pipeline.embedder import embed_chunks
from pipeline.store import store_in_qdrant
from models import update_job_status, update_job_progress
import logging

logger = logging.getLogger(__name__)

@celery_app.task(
    bind=True,                         # Access self for retries
    max_retries=3,
    default_retry_delay=60,            # Wait 60 seconds between retries
    acks_late=True,                    # ACK after completion
    track_started=True,                # Track "started" state
)
def process_document(self, job_id: str):
    """Main ingestion task — processes a document end-to-end."""
    
    try:
        # ── Step 1: Parse ──────────────────────────────────
        update_job_status(job_id, "processing", step=1, step_name="Parsing document")
        
        job = get_job(job_id)
        file_path = download_from_storage(job.file_path)
        text, metadata = parse_document(file_path)
        
        logger.info(f"[{job_id}] Parsed: {len(text)} characters")
        
        # ── Step 2: Chunk ──────────────────────────────────
        update_job_status(job_id, "processing", step=2, step_name="Chunking text")
        
        chunks = chunk_text(text, chunk_size=512, overlap=50)
        update_job_progress(job_id, total_chunks=len(chunks), processed_chunks=0)
        
        logger.info(f"[{job_id}] Created {len(chunks)} chunks")
        
        # ── Step 3: Embed ──────────────────────────────────
        update_job_status(job_id, "processing", step=3, step_name="Generating embeddings")
        
        embeddings = []
        batch_size = 100
        
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            batch_embeddings = embed_chunks(batch)
            embeddings.extend(batch_embeddings)
            
            # Update progress
            update_job_progress(job_id, processed_chunks=len(embeddings))
            
            logger.info(f"[{job_id}] Embedded {len(embeddings)}/{len(chunks)}")
        
        # ── Step 4: Store ──────────────────────────────────
        update_job_status(job_id, "processing", step=4, step_name="Storing in vector DB")
        
        point_ids = store_in_qdrant(
            collection_name=job.collection_name,
            chunks=chunks,
            embeddings=embeddings,
            metadata={
                "source": job.file_name,
                "job_id": job_id,
                "user_id": str(job.user_id),
            }
        )
        
        # ── Done ───────────────────────────────────────────
        update_job_status(
            job_id, "completed",
            step=4, step_name="Complete",
            point_ids=point_ids
        )
        
        logger.info(f"[{job_id}] ✅ Completed: {len(point_ids)} points stored")
        
    except RateLimitError as exc:
        # API rate limit — retry with exponential backoff
        logger.warning(f"[{job_id}] Rate limited, retrying...")
        raise self.retry(exc=exc, countdown=120 * (self.request.retries + 1))
        
    except (ConnectionError, TimeoutError) as exc:
        # Transient errors — retry
        logger.warning(f"[{job_id}] Transient error: {exc}, retrying...")
        raise self.retry(exc=exc, countdown=60)
        
    except Exception as exc:
        # Permanent failure
        logger.error(f"[{job_id}] ❌ Failed: {exc}", exc_info=True)
        update_job_status(job_id, "failed", error_message=str(exc))
        raise  # Let Celery handle it
    
    finally:
        # Cleanup temporary files
        cleanup_temp_files(job_id)
```

#### API Endpoints

```python
# app.py
from fastapi import FastAPI, UploadFile, HTTPException
from tasks import process_document
import uuid

app = FastAPI()

@app.post("/upload")
async def upload(file: UploadFile, user_id: str):
    """Accept a document and queue it for processing."""
    
    # Validate
    if file.size > 100 * 1024 * 1024:  # 100MB limit
        raise HTTPException(400, "File too large (max 100MB)")
    
    allowed_types = {".pdf", ".md", ".html", ".txt", ".docx"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_types:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    
    # Save to object storage
    job_id = str(uuid.uuid4())
    file_path = f"s3://ingestion-uploads/{user_id}/{job_id}/{file.filename}"
    await save_to_s3(file, file_path)
    
    # Create job record
    create_job(
        id=job_id,
        user_id=user_id,
        file_name=file.filename,
        file_path=file_path,
        file_size_bytes=file.size,
        file_type=ext,
        status="queued"
    )
    
    # Enqueue
    process_document.delay(job_id)
    
    return {
        "job_id": job_id,
        "status": "queued",
        "status_url": f"/jobs/{job_id}"
    }

@app.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get current status of an ingestion job."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    
    return {
        "job_id": job.id,
        "status": job.status,
        "file_name": job.file_name,
        "progress": {
            "current_step": job.current_step,
            "total_steps": job.total_steps,
            "step_name": job.current_step_name,
            "chunks_processed": job.processed_chunks,
            "chunks_total": job.total_chunks,
            "percentage": calculate_percentage(job)
        },
        "timing": {
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            "elapsed_seconds": calculate_elapsed(job)
        },
        "error": job.error_message if job.status == "failed" else None
    }
```

#### Running the Workers

```bash
# Start 1 worker with 4 concurrent task slots
celery -A worker.celery_app worker \
    --loglevel=info \
    --concurrency=4 \
    --queues=ingestion

# Start a dedicated worker for large files
celery -A worker.celery_app worker \
    --loglevel=info \
    --concurrency=1 \
    --queues=ingestion_heavy \
    --max-memory-per-child=2000000  # Restart worker if > 2GB RAM

# Monitor with Flower (web dashboard)
celery -A worker.celery_app flower --port=5555
```

### Implementation with BullMQ (Node.js / TypeScript)

```typescript
// queue.ts
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

const connection = new Redis({ host: "localhost", port: 6379 });

// ── Define the Queue ──────────────────────────────────────
export const ingestionQueue = new Queue("ingestion", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 30_000 },
    removeOnComplete: { age: 86400 },  // Keep completed jobs for 24h
    removeOnFail: { age: 604800 },     // Keep failed jobs for 7 days
  },
});

// ── Define the Worker ─────────────────────────────────────
const worker = new Worker(
  "ingestion",
  async (job: Job) => {
    const { jobId, filePath, userId } = job.data;

    // Step 1: Parse
    await job.updateProgress({ step: 1, stepName: "Parsing", percentage: 0 });
    const text = await parseDocument(filePath);

    // Step 2: Chunk
    await job.updateProgress({ step: 2, stepName: "Chunking", percentage: 25 });
    const chunks = chunkText(text);

    // Step 3: Embed
    for (let i = 0; i < chunks.length; i += 100) {
      const batch = chunks.slice(i, i + 100);
      const embeddings = await embedChunks(batch);
      await storeEmbeddings(embeddings);

      const pct = 25 + Math.round((i / chunks.length) * 50);
      await job.updateProgress({
        step: 3, stepName: "Embedding", percentage: pct,
        chunksProcessed: Math.min(i + 100, chunks.length),
        chunksTotal: chunks.length,
      });
    }

    // Step 4: Finalize
    await job.updateProgress({ step: 4, stepName: "Complete", percentage: 100 });
    await updateJobStatus(jobId, "completed");

    return { chunksStored: chunks.length };
  },
  {
    connection,
    concurrency: 4,        // Process 4 jobs in parallel
    limiter: {
      max: 10,             // Max 10 jobs
      duration: 60_000,    // Per 60 seconds (rate limiting)
    },
  }
);

// ── Event Handlers ────────────────────────────────────────
worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed: ${err.message}`);
});

worker.on("progress", (job, progress) => {
  console.log(`📊 Job ${job.id}: ${JSON.stringify(progress)}`);
});
```

### Worker Scaling Strategies

```
                        Load
                         ▲
                         │
  Scale workers ─────────┤         ┌──────────────────┐
  based on               │         │  Auto-scaling     │
  queue depth             │    ●────│  Rules:           │
                         │   /     │                    │
                    ●───●   /      │  queue > 100       │
                   /       /       │    → add 2 workers │
              ●───●       /        │                    │
             /           /         │  queue > 500       │
        ●───●           /          │    → add 10 workers│
       /               /           │                    │
  ●───●               /            │  queue = 0 for 10m │
                     /             │    → scale to 1    │
  ──────────────────────▶ Time     └──────────────────┘
```

| Strategy | When | How |
|----------|------|-----|
| **Fixed workers** | Predictable, steady load | Deploy N worker containers |
| **Queue-depth scaling** | Variable load | Auto-scale based on pending jobs |
| **Time-based scaling** | Known busy periods | Scale up at 9 AM, down at 6 PM |
| **Serverless** | Sporadic, bursty load | AWS Lambda / Cloud Functions per job |

---

## 4. Handling Failures and Retrying Jobs Safely

### Types of Failures

```
┌─────────────────────────────────────────────────────────────────┐
│                     FAILURE TAXONOMY                             │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │  TRANSIENT (Retry will likely succeed)       │                │
│  │                                              │                │
│  │  • API rate limit (429)                      │                │
│  │  • Network timeout                           │                │
│  │  • Database connection pool exhausted        │                │
│  │  • Vector DB temporarily unavailable         │                │
│  │  • Out of memory (if due to spike)           │                │
│  │                                              │                │
│  │  Strategy: RETRY with backoff                │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │  PERMANENT (Retry will NOT help)             │                │
│  │                                              │                │
│  │  • Corrupted/unreadable PDF                  │                │
│  │  • Unsupported file format                   │                │
│  │  • Invalid API key                           │                │
│  │  • File exceeds hard size limit              │                │
│  │  • Schema validation error                   │                │
│  │                                              │                │
│  │  Strategy: FAIL immediately, alert user      │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │  PARTIAL (Some work succeeded)               │                │
│  │                                              │                │
│  │  • Embedded 80/100 chunks, then API error    │                │
│  │  • Stored 50 points, then DB went down       │                │
│  │  • Parsed OK, but chunking hit edge case     │                │
│  │                                              │                │
│  │  Strategy: RESUME from checkpoint, or        │                │
│  │            ROLLBACK and retry from scratch    │                │
│  └─────────────────────────────────────────────┘                │
│                                                                  │
│  ┌─────────────────────────────────────────────┐                │
│  │  POISON PILL (Crashes the worker)            │                │
│  │                                              │                │
│  │  • Infinite loop in parser                   │                │
│  │  • Segfault in native library                │                │
│  │  • OOM kill                                  │                │
│  │                                              │                │
│  │  Strategy: TIME LIMIT + dead letter queue    │                │
│  └─────────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

### Retry Strategy: Exponential Backoff with Jitter

```
Attempt 1: Failed → Wait 30 seconds
Attempt 2: Failed → Wait 60 seconds + random(0-15s)
Attempt 3: Failed → Wait 120 seconds + random(0-30s)
Attempt 4: Failed → Move to Dead Letter Queue
```

```python
import random

def calculate_retry_delay(attempt: int, base_delay: int = 30) -> int:
    """Exponential backoff with jitter."""
    exponential = base_delay * (2 ** attempt)        # 30, 60, 120, 240...
    jitter = random.uniform(0, exponential * 0.25)   # 0-25% jitter
    max_delay = 600                                   # Cap at 10 minutes
    return min(exponential + jitter, max_delay)
```

**Why jitter?** Without jitter, if 100 workers all fail at the same time (e.g., API outage), they all retry at exactly the same time, causing a "thundering herd" that crashes the API again.

```
Without jitter (BAD):                 With jitter (GOOD):
  ─────●──────────●──────────●──       ──●───────●─────────●────
  ─────●──────────●──────────●──       ────●──────────●──────●──
  ─────●──────────●──────────●──       ──────●─────●──────────●─
  ─────●──────────●──────────●──       ───●──────────●─────●────
       ▲          ▲          ▲              Spread out = healthier
    All retry   All retry  All retry
    at once!    at once!   at once!
```

### Classifying Errors for Retry Decisions

```python
class RetryableError(Exception):
    """Errors that should be retried."""
    pass

class PermanentError(Exception):
    """Errors that should NOT be retried."""
    pass

def classify_and_handle(exc: Exception, self, job_id: str):
    """Decide whether to retry or fail permanently."""
    
    # ── Retryable errors ──────────────────────────────
    retryable = (
        ConnectionError,
        TimeoutError,
        RateLimitError,
        ServiceUnavailableError,
    )
    
    if isinstance(exc, retryable):
        if self.request.retries < self.max_retries:
            delay = calculate_retry_delay(self.request.retries)
            update_job_status(job_id, "retrying",
                error_message=f"Retry {self.request.retries + 1}/{self.max_retries}: {exc}",
                retry_count=self.request.retries + 1
            )
            raise self.retry(exc=exc, countdown=delay)
        else:
            # Exhausted retries
            update_job_status(job_id, "failed",
                error_message=f"Failed after {self.max_retries} retries: {exc}"
            )
            send_to_dead_letter_queue(job_id)
    
    # ── Permanent errors ──────────────────────────────
    permanent = (
        FileCorruptedError,
        UnsupportedFormatError,
        AuthenticationError,
        ValidationError,
    )
    
    if isinstance(exc, permanent):
        update_job_status(job_id, "failed",
            error_message=f"Permanent failure: {exc}",
            error_code=type(exc).__name__
        )
        # Do NOT retry
        return
    
    # ── Unknown errors ────────────────────────────────
    # Treat as retryable (be optimistic) but log for investigation
    logger.error(f"Unknown error type: {type(exc)}", exc_info=True)
    if self.request.retries < self.max_retries:
        raise self.retry(exc=exc, countdown=120)
    else:
        update_job_status(job_id, "failed", error_message=str(exc))
        send_to_dead_letter_queue(job_id)
```

### Idempotency: Safe to Retry

A job is **idempotent** if running it multiple times produces the same result as running it once. This is critical for safe retries.

```
NON-IDEMPOTENT (❌ DANGEROUS):
  Run 1: Insert 100 chunks → DB has 100 chunks
  Run 2: Insert 100 chunks → DB has 200 chunks (DUPLICATES!)
  Run 3: Insert 100 chunks → DB has 300 chunks (WORSE!)

IDEMPOTENT (✅ SAFE):
  Run 1: Upsert 100 chunks with deterministic IDs → DB has 100 chunks
  Run 2: Upsert 100 chunks with deterministic IDs → DB has 100 chunks (same!)
  Run 3: Upsert 100 chunks with deterministic IDs → DB has 100 chunks (safe!)
```

#### Making Ingestion Idempotent

```python
import hashlib

def generate_deterministic_id(job_id: str, chunk_index: int) -> str:
    """Generate a deterministic, reproducible point ID.
    
    Same job + same chunk index = same ID = safe to retry.
    """
    raw = f"{job_id}:chunk:{chunk_index}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]

def idempotent_store(job_id: str, chunks: list, embeddings: list):
    """Store chunks idempotently — safe to retry."""
    
    # Generate deterministic IDs
    points = [
        PointStruct(
            id=generate_deterministic_id(job_id, i),
            vector=embedding,
            payload={
                "text": chunk,
                "job_id": job_id,
                "chunk_index": i
            }
        )
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
    ]
    
    # Upsert (insert or update) — NOT insert
    # If the point already exists, it gets overwritten (not duplicated)
    qdrant.upsert(
        collection_name="knowledge_base",
        points=points
    )
```

### Rollback on Failure

If a job fails partway through, you need to clean up partial results:

```python
def rollback_job(job_id: str):
    """Remove all data produced by a failed job."""
    
    # Delete all points belonging to this job from Qdrant
    qdrant.delete(
        collection_name="knowledge_base",
        points_selector=FilterSelector(
            filter=Filter(
                must=[
                    FieldCondition(
                        key="job_id",
                        match=MatchValue(value=job_id)
                    )
                ]
            )
        )
    )
    
    # Clean up temporary files
    cleanup_temp_files(job_id)
    
    logger.info(f"[{job_id}] Rolled back successfully")
```

### Dead Letter Queue (DLQ)

Jobs that fail all retries go to a **Dead Letter Queue** for manual investigation:

```python
# Celery DLQ pattern
@celery_app.task(bind=True, max_retries=3)
def process_document(self, job_id: str):
    try:
        do_work(job_id)
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            # Send to DLQ
            dead_letter_queue.send_task(
                "handle_dead_letter",
                args=[{
                    "original_job_id": job_id,
                    "error": str(exc),
                    "traceback": traceback.format_exc(),
                    "retries_exhausted": self.request.retries,
                    "failed_at": datetime.now().isoformat()
                }]
            )
            update_job_status(job_id, "dead_lettered")
            return
        raise self.retry(exc=exc)
```

### Failure Handling Checklist

| Scenario | Strategy |
|----------|----------|
| API rate limit (429) | Retry with exponential backoff, respect `Retry-After` header |
| Network timeout | Retry up to 3 times with increasing delay |
| Corrupted file | Fail permanently, notify user |
| Worker crashes mid-job | `acks_late=True` re-queues automatically |
| Vector DB down | Retry with backoff, alert ops if prolonged |
| OOM kill | Restart worker, reduce concurrency or chunk size |
| All retries exhausted | Dead letter queue + alert + manual review |
| Partial completion | Rollback (delete partial data) then retry cleanly |

---

## 5. Tracking Ingestion Progress

### Why Tracking Matters

Without progress tracking:
```
User: *uploads document*
System: "Processing..."
User: *waits 10 seconds* "Is it working?"
User: *waits 30 seconds* "Did it crash?"
User: *waits 60 seconds* "I'll just re-upload..."
User: *uploads again* → Now you have duplicates and double the load
```

With progress tracking:
```
User: *uploads document*
System: "Queued (position #3)"
System: "Parsing document... (Step 1/4)"
System: "Generating embeddings... 67/150 chunks (Step 3/4)"
System: "✅ Complete! 150 chunks indexed in 45 seconds."
User: "Nice." → Trust, no duplicate uploads
```

### Progress Model

```python
from dataclasses import dataclass
from enum import Enum

class JobStatus(str, Enum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    RETRYING = "retrying"

@dataclass
class JobProgress:
    job_id: str
    status: JobStatus
    
    # Step-level progress
    current_step: int           # 1-4
    total_steps: int            # 4
    step_name: str              # "Generating embeddings"
    
    # Chunk-level progress
    chunks_processed: int       # 67
    chunks_total: int | None    # 150 (None if unknown yet)
    
    # Timing
    created_at: datetime
    started_at: datetime | None
    completed_at: datetime | None
    estimated_remaining_seconds: float | None
    
    # Error (if failed)
    error_message: str | None
    retry_count: int
    
    @property
    def percentage(self) -> float:
        """Overall percentage completion."""
        if self.status == JobStatus.COMPLETED:
            return 100.0
        if self.status == JobStatus.QUEUED:
            return 0.0
        if not self.chunks_total or self.chunks_total == 0:
            # Fall back to step-based progress
            return (self.current_step / self.total_steps) * 100
        
        # Weighted: steps have different durations
        step_weights = {1: 0.15, 2: 0.05, 3: 0.60, 4: 0.20}  # Embedding is 60%
        
        completed_weight = sum(
            step_weights.get(s, 0) for s in range(1, self.current_step)
        )
        
        current_weight = step_weights.get(self.current_step, 0)
        if self.current_step == 3 and self.chunks_total:
            # Embedding step — use chunk progress
            chunk_fraction = self.chunks_processed / self.chunks_total
            completed_weight += current_weight * chunk_fraction
        
        return min(completed_weight * 100, 99.9)  # Never show 100% until truly done
```

### API Design for Progress Polling

```python
# REST API — Client polls periodically

@app.get("/jobs/{job_id}")
async def get_status(job_id: str):
    job = await get_job(job_id)
    if not job:
        raise HTTPException(404)
    
    progress = calculate_progress(job)
    
    return {
        "job_id": job.id,
        "status": job.status,
        "file_name": job.file_name,
        "progress": {
            "percentage": progress.percentage,
            "current_step": {
                "number": progress.current_step,
                "name": progress.step_name,
                "of_total": progress.total_steps
            },
            "chunks": {
                "processed": progress.chunks_processed,
                "total": progress.chunks_total
            }
        },
        "timing": {
            "created_at": job.created_at.isoformat(),
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "elapsed_seconds": (datetime.now() - job.started_at).total_seconds() if job.started_at else 0,
            "estimated_remaining_seconds": progress.estimated_remaining_seconds
        },
        "error": {
            "message": job.error_message,
            "retry_count": job.retry_count,
            "max_retries": job.max_retries
        } if job.status in ("failed", "retrying") else None
    }

# List all jobs for a user
@app.get("/jobs")
async def list_jobs(user_id: str, status: str = None, limit: int = 20):
    jobs = await get_user_jobs(user_id, status=status, limit=limit)
    return {
        "jobs": [format_job_summary(j) for j in jobs],
        "counts": {
            "queued": await count_jobs(user_id, "queued"),
            "processing": await count_jobs(user_id, "processing"),
            "completed": await count_jobs(user_id, "completed"),
            "failed": await count_jobs(user_id, "failed"),
        }
    }
```

### Real-Time Updates with Server-Sent Events (SSE)

Polling works but wastes requests. SSE pushes updates to the client in real-time:

```python
# Server: SSE endpoint
from fastapi.responses import StreamingResponse
import asyncio

@app.get("/jobs/{job_id}/stream")
async def stream_status(job_id: str):
    """Stream job progress via Server-Sent Events."""
    
    async def event_generator():
        while True:
            job = await get_job(job_id)
            if not job:
                yield f"event: error\ndata: Job not found\n\n"
                return
            
            progress = calculate_progress(job)
            data = json.dumps({
                "status": job.status,
                "percentage": progress.percentage,
                "step": progress.step_name,
                "chunks_processed": progress.chunks_processed,
                "chunks_total": progress.chunks_total,
            })
            
            yield f"event: progress\ndata: {data}\n\n"
            
            if job.status in ("completed", "failed", "cancelled"):
                yield f"event: done\ndata: {data}\n\n"
                return
            
            await asyncio.sleep(2)  # Push updates every 2 seconds
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive"
        }
    )
```

```javascript
// Client: Listen for SSE events
const eventSource = new EventSource(`/jobs/${jobId}/stream`);

eventSource.addEventListener("progress", (event) => {
  const data = JSON.parse(event.data);
  
  // Update UI
  progressBar.style.width = `${data.percentage}%`;
  statusText.textContent = data.step;
  chunkText.textContent = `${data.chunks_processed}/${data.chunks_total} chunks`;
});

eventSource.addEventListener("done", (event) => {
  const data = JSON.parse(event.data);
  
  if (data.status === "completed") {
    showSuccess("Document indexed successfully!");
  } else if (data.status === "failed") {
    showError("Ingestion failed. Please try again.");
  }
  
  eventSource.close();
});

eventSource.onerror = () => {
  // Fall back to polling if SSE disconnects
  eventSource.close();
  startPolling(jobId);
};
```

### Real-Time Updates with WebSockets

For bidirectional communication (e.g., cancel a job from the frontend):

```python
# Server: WebSocket endpoint
from fastapi import WebSocket

@app.websocket("/ws/jobs/{job_id}")
async def websocket_status(websocket: WebSocket, job_id: str):
    await websocket.accept()
    
    try:
        while True:
            # Check for client messages (e.g., cancel request)
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(), timeout=2.0
                )
                if message == "cancel":
                    await cancel_job(job_id)
                    await websocket.send_json({"status": "cancelled"})
                    return
            except asyncio.TimeoutError:
                pass
            
            # Push progress update
            job = await get_job(job_id)
            progress = calculate_progress(job)
            
            await websocket.send_json({
                "status": job.status,
                "percentage": progress.percentage,
                "step": progress.step_name,
                "chunks_processed": progress.chunks_processed,
                "chunks_total": progress.chunks_total,
            })
            
            if job.status in ("completed", "failed", "cancelled"):
                return
                
    except Exception:
        pass
    finally:
        await websocket.close()
```

### Estimated Time Remaining

```python
def estimate_remaining_time(job) -> float | None:
    """Estimate remaining seconds based on processing speed."""
    
    if not job.started_at or not job.chunks_total or job.processed_chunks == 0:
        return None
    
    elapsed = (datetime.now() - job.started_at).total_seconds()
    rate = job.processed_chunks / elapsed  # chunks per second
    
    if rate == 0:
        return None
    
    remaining_chunks = job.chunks_total - job.processed_chunks
    estimated_remaining = remaining_chunks / rate
    
    # Add buffer for the storage step (Step 4)
    if job.current_step <= 3:
        storage_estimate = job.chunks_total * 0.01  # ~10ms per chunk
        estimated_remaining += storage_estimate
    
    return round(estimated_remaining, 1)
```

### Progress Dashboard (Monitoring)

For operators monitoring the system at scale:

```python
@app.get("/admin/ingestion/dashboard")
async def admin_dashboard():
    """System-wide ingestion health metrics."""
    
    now = datetime.now()
    hour_ago = now - timedelta(hours=1)
    day_ago = now - timedelta(days=1)
    
    return {
        "queue": {
            "pending_jobs": await count_jobs_by_status("queued"),
            "processing_jobs": await count_jobs_by_status("processing"),
            "estimated_drain_time_minutes": await estimate_queue_drain_time(),
        },
        "last_hour": {
            "completed": await count_jobs_since(hour_ago, "completed"),
            "failed": await count_jobs_since(hour_ago, "failed"),
            "avg_processing_seconds": await avg_processing_time(hour_ago),
            "total_chunks_indexed": await total_chunks_since(hour_ago),
        },
        "last_24h": {
            "completed": await count_jobs_since(day_ago, "completed"),
            "failed": await count_jobs_since(day_ago, "failed"),
            "failure_rate_percent": await failure_rate(day_ago),
            "avg_processing_seconds": await avg_processing_time(day_ago),
        },
        "workers": {
            "active": await get_active_worker_count(),
            "idle": await get_idle_worker_count(),
            "utilization_percent": await get_worker_utilization(),
        },
        "recent_failures": await get_recent_failures(limit=10),
        "slowest_jobs": await get_slowest_jobs(limit=5),
    }
```

### Choosing a Progress Delivery Method

| Method | Complexity | Latency | Best For |
|--------|-----------|---------|----------|
| **Polling** (GET every N seconds) | ⭐ Low | 🟡 1-5s | Simple apps, few concurrent users |
| **SSE** (server push) | ⭐⭐ Medium | 🟢 <1s | Progress bars, one-way updates |
| **WebSocket** (bidirectional) | ⭐⭐⭐ High | 🟢 <1s | Interactive (cancel, pause), chat-like UI |
| **Webhook** (callback URL) | ⭐⭐ Medium | 🟡 Varies | B2B integrations, server-to-server |

---

## 🏁 Quick Reference — Production Ingestion Checklist

| Concern | Solution |
|---------|----------|
| **Don't block requests** | Accept → Persist → Enqueue → Respond immediately |
| **Queue architecture** | Redis + Celery/BullMQ for most cases; SQS/Kafka at scale |
| **Worker design** | Separate processes, horizontally scalable, rate-limited |
| **Transient failures** | Exponential backoff with jitter, max 3 retries |
| **Permanent failures** | Fail immediately, notify user, don't retry |
| **Poison pills** | Time limits, worker memory limits, dead letter queue |
| **Idempotency** | Deterministic IDs, upsert (not insert), safe to re-run |
| **Partial failure** | Rollback partial data, retry from scratch |
| **Progress tracking** | Step-level + chunk-level, SSE for real-time UI |
| **Monitoring** | Queue depth, failure rate, processing time, worker utilization |

---

## 📚 Further Reading

- [Celery Documentation](https://docs.celeryq.dev/)
- [BullMQ Documentation](https://docs.bullmq.io/)
- [AWS SQS Best Practices](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-best-practices.html)
- [Designing Data-Intensive Applications (Kleppmann)](https://dataintensive.net/) — Ch. 11: Stream Processing
- [The Twelve-Factor App — Concurrency](https://12factor.net/concurrency)
- [Idempotency Patterns (Stripe Engineering)](https://stripe.com/blog/idempotency)

---

> *"The fastest web request is the one that doesn't do the work — it just promises the work will be done."*
