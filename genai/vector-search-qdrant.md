# 🔍 Vector Search with Qdrant — A Complete Guide

> **Qdrant** (pronounced "quadrant") is a high-performance, open-source vector database built in Rust, purpose-built for similarity search over dense vector embeddings with rich metadata filtering.

---

## Table of Contents

1. [What a Vector Database Is Under the Hood](#1-what-a-vector-database-is-under-the-hood)
2. [Running Qdrant Locally with Docker](#2-running-qdrant-locally-with-docker)
3. [Storing and Querying Embeddings](#3-storing-and-querying-embeddings)
4. [Vector Similarity Search](#4-vector-similarity-search)
5. [Metadata Filtering for Scoped Results](#5-metadata-filtering-for-scoped-results)
6. [Reranking for Better Retrieval Quality](#6-reranking-for-better-retrieval-quality)

---

## 1. What a Vector Database Is Under the Hood

### The Core Idea

A vector database is a specialized database designed to **store, index, and search** high-dimensional vectors (arrays of floating-point numbers). These vectors are numerical representations of data — text, images, audio — produced by embedding models.

```
Traditional Database:                    Vector Database:
┌──────────────────────────┐            ┌──────────────────────────────────┐
│ id │ name    │ city      │            │ id │ vector              │ meta  │
├────┼─────────┼───────────┤            ├────┼─────────────────────┼───────┤
│ 1  │ Alice   │ Mumbai    │            │ 1  │ [0.12, -0.34, ...]  │ {...} │
│ 2  │ Bob     │ Delhi     │            │ 2  │ [0.56, 0.78, ...]   │ {...} │
│ 3  │ Charlie │ Bangalore │            │ 3  │ [-0.11, 0.45, ...]  │ {...} │
└────┴─────────┴───────────┘            └────┴─────────────────────┴───────┘
                                        
Query: WHERE city = "Mumbai"             Query: Find vectors closest to
Result: Exact row match                         [0.13, -0.33, ...]
                                         Result: Approximate nearest neighbors
```

### Why Not Just Use a Regular Database?

| Operation | Traditional DB (PostgreSQL) | Vector DB (Qdrant) |
|-----------|---------------------------|---------------------|
| Exact match | ✅ Built for this | 🟡 Supports via filters |
| Full-text search | ✅ With indexes | 🟡 Basic support |
| **Semantic similarity** | ❌ Not possible | ✅ **Built for this** |
| "Find similar items" | ❌ Manual distance calc | ✅ Sub-millisecond |
| Scale to billions of vectors | ❌ Very slow | ✅ Optimized indexes |

### Anatomy of a Vector Database

```
┌─────────────────────────────────────────────────────────────────┐
│                        VECTOR DATABASE                          │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    STORAGE LAYER                           │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐    │  │
│  │  │ Vectors  │  │   Payloads   │  │  Point IDs       │    │  │
│  │  │ (floats) │  │  (metadata)  │  │  (identifiers)   │    │  │
│  │  └──────────┘  └──────────────┘  └──────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    INDEX LAYER                              │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              ANN Index (HNSW)                        │ │  │
│  │  │                                                      │ │  │
│  │  │  Hierarchical graph structure for fast approximate   │ │  │
│  │  │  nearest neighbor search                             │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                            │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │           Payload Index (for filtering)              │ │  │
│  │  │                                                      │ │  │
│  │  │  Keyword index, numeric range index, geo index       │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    QUERY ENGINE                            │  │
│  │                                                            │  │
│  │  Query Vector ──▶ ANN Search ──▶ Filter ──▶ Score ──▶ Top-K│  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### The HNSW Index — Heart of the Search

Qdrant uses **HNSW (Hierarchical Navigable Small World)** graphs as its primary indexing algorithm. Understanding it demystifies how vector search achieves sub-millisecond latency over millions of vectors.

#### The Problem: Brute Force Is Too Slow

```
Brute force nearest neighbor:
  - Compare query vector against EVERY vector in the database
  - 1 million vectors × 768 dimensions = 768 million float comparisons
  - Too slow for real-time applications (seconds per query)

Solution: Approximate Nearest Neighbors (ANN)
  - Trade a tiny bit of accuracy for massive speed gains
  - Find the "approximately" closest vectors in milliseconds
  - Accuracy is typically 95-99% compared to brute force
```

#### How HNSW Works (Intuition)

Think of it like an airport system:

```
Layer 3 (Top):     ✈️ International hubs (few, far apart)
                   NYC ─────────── London ─────────── Tokyo
                    
Layer 2:           🚌 Regional hubs (more, closer)
                   NYC ── Chicago ── London ── Paris ── Tokyo ── Seoul
                    
Layer 1:           🚗 Local stops (many, very close)
                   NYC─Boston─Chicago─Detroit─London─Paris─Berlin─Tokyo─Seoul─Osaka
                   
Layer 0 (Bottom):  🚶 Every single location (ALL vectors)
                   All data points connected to nearby neighbors
```

**Search process:**
1. Start at the top layer (few nodes, large jumps).
2. Greedily move toward the query vector.
3. Drop down one layer (more nodes, smaller jumps).
4. Repeat until you reach the bottom layer.
5. The final neighbors at the bottom are your approximate nearest neighbors.

#### HNSW Parameters in Qdrant

| Parameter | What It Controls | Default | Trade-off |
|-----------|-----------------|---------|-----------|
| `m` | Max connections per node per layer | 16 | Higher = better recall, more RAM |
| `ef_construct` | Search depth during index building | 100 | Higher = better index quality, slower build |
| `ef` | Search depth during query | 128 | Higher = better recall, slower query |

```
                    Accuracy
                       ▲
                       │        ● ef=512 (very accurate, slower)
                       │      ● ef=256
                       │    ● ef=128 (default, good balance)
                       │  ● ef=64
                       │● ef=16 (fast, less accurate)
                       └──────────────────────▶ Speed
```

### Quantization — Reducing Memory Usage

Qdrant supports vector quantization to reduce memory usage and increase speed:

| Method | Description | Memory Savings | Quality Impact |
|--------|-------------|----------------|----------------|
| **Scalar Quantization** | Converts float32 → uint8 | ~4× reduction | Minimal |
| **Product Quantization (PQ)** | Compresses vector segments | ~16–64× reduction | Moderate |
| **Binary Quantization** | Converts to 1-bit per dimension | ~32× reduction | Significant (best for high-dim models) |

### How Qdrant Specifically Works

```
Qdrant Architecture:
                                                
┌─────────────────────────────────────────────┐
│                  QDRANT                      │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │           Collections                 │   │
│  │  ┌────────────┐  ┌────────────┐      │   │
│  │  │ Collection │  │ Collection │ ...  │   │
│  │  │ "articles" │  │ "products" │      │   │
│  │  └─────┬──────┘  └────────────┘      │   │
│  └────────┼─────────────────────────────┘   │
│           │                                  │
│  ┌────────┼─────────────────────────────┐   │
│  │        ▼        Segments              │   │
│  │  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Segment  │  │ Segment  │  ...     │   │
│  │  │  (shard) │  │  (shard) │          │   │
│  │  └────┬─────┘  └──────────┘          │   │
│  └───────┼──────────────────────────────┘   │
│          │                                   │
│    ┌─────┴──────────────────────┐            │
│    │  • HNSW Index (vectors)    │            │
│    │  • Payload Index (metadata)│            │
│    │  • ID Mapper               │            │
│    │  • Write-Ahead Log (WAL)   │            │
│    └────────────────────────────┘            │
└─────────────────────────────────────────────┘
```

**Key Qdrant concepts:**

| Concept | Equivalent In | Description |
|---------|--------------|-------------|
| **Collection** | Database table | A group of points with the same vector dimensions |
| **Point** | Database row | A vector + payload (metadata) + unique ID |
| **Payload** | JSON column | Arbitrary JSON metadata attached to each point |
| **Segment** | Partition/Shard | Internal storage unit for a collection |

---

## 2. Running Qdrant Locally with Docker

### Prerequisites

- Docker installed ([Get Docker](https://docs.docker.com/get-docker/))
- Python 3.8+ with `pip`

### Option 1: Quick Start with Docker

```bash
# Pull and run Qdrant
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  qdrant/qdrant
```

| Port | Protocol | Purpose |
|------|----------|---------|
| 6333 | HTTP | REST API |
| 6334 | gRPC | High-performance binary protocol |

**Verify it's running:**

```bash
# Health check
curl http://localhost:6333/healthz

# Get cluster info
curl http://localhost:6333/cluster
```

### Option 2: Docker Compose (Recommended for Projects)

Create a `docker-compose.yml`:

```yaml
version: "3.8"

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: qdrant
    ports:
      - "6333:6333"   # REST API
      - "6334:6334"   # gRPC
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage
      - QDRANT__LOG_LEVEL=INFO
    restart: unless-stopped

volumes:
  qdrant_data:
    driver: local
```

```bash
# Start
docker compose up -d

# View logs
docker compose logs -f qdrant

# Stop
docker compose down

# Stop and delete data
docker compose down -v
```

### Option 3: Run Without Docker (In-Memory Python)

For quick prototyping without Docker:

```bash
pip install qdrant-client
```

```python
from qdrant_client import QdrantClient

# In-memory (ephemeral — data lost on exit)
client = QdrantClient(":memory:")

# On-disk (persistent — no Docker needed)
client = QdrantClient(path="./qdrant_local_storage")
```

### Install the Python Client

```bash
pip install qdrant-client
```

### Connecting to Qdrant

```python
from qdrant_client import QdrantClient

# Connect to Docker instance
client = QdrantClient(host="localhost", port=6333)

# Or via URL
client = QdrantClient(url="http://localhost:6333")

# Verify connection
print(client.get_collections())
```

### Qdrant Dashboard

Qdrant ships with a **built-in web UI** — access it at:

```
http://localhost:6333/dashboard
```

The dashboard lets you:
- Browse collections and points.
- Run queries visually.
- View cluster status.
- Inspect payload schemas.

### Production Configuration

For production, create a `config.yaml`:

```yaml
storage:
  storage_path: /qdrant/storage
  optimizers:
    default_segment_number: 4      # Parallelism
    max_segment_size_kb: 200000    # 200MB per segment
    memmap_threshold_kb: 50000     # Use mmap for large segments
    indexing_threshold_kb: 20000   # Build HNSW after this size

service:
  max_request_size_mb: 32          # Max upload size
  grpc_port: 6334
  enable_tls: false

log_level: INFO
```

```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage:z \
  -v $(pwd)/config.yaml:/qdrant/config/config.yaml:z \
  qdrant/qdrant
```

---

## 3. Storing and Querying Embeddings

### Step 1: Create a Collection

A collection defines the vector space — all vectors in a collection must have the same dimensionality and distance metric.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    OptimizersConfigDiff, HnswConfigDiff
)

client = QdrantClient(host="localhost", port=6333)

# Create a collection
client.create_collection(
    collection_name="knowledge_base",
    vectors_config=VectorParams(
        size=1536,              # Must match your embedding model's dimensions
        distance=Distance.COSINE # Similarity metric
    ),
    # Optional: tune HNSW for your workload
    hnsw_config=HnswConfigDiff(
        m=16,                   # Connections per layer
        ef_construct=100,       # Build-time search depth
    ),
    # Optional: tune optimizers
    optimizers_config=OptimizersConfigDiff(
        indexing_threshold=20000,  # Build index after 20K points
    ),
)
```

### Step 2: Generate Embeddings

```python
from openai import OpenAI

openai_client = OpenAI()

def get_embedding(text: str, model: str = "text-embedding-3-small") -> list[float]:
    """Get embedding for a single text."""
    response = openai_client.embeddings.create(
        input=text,
        model=model
    )
    return response.data[0].embedding

def get_embeddings_batch(texts: list[str], model: str = "text-embedding-3-small") -> list[list[float]]:
    """Get embeddings for multiple texts in one API call."""
    response = openai_client.embeddings.create(
        input=texts,
        model=model
    )
    return [item.embedding for item in response.data]
```

### Step 3: Insert Points (Upsert)

#### Single Point

```python
from qdrant_client.models import PointStruct

# Upsert a single point
client.upsert(
    collection_name="knowledge_base",
    points=[
        PointStruct(
            id=1,                                        # Unique ID (int or UUID)
            vector=get_embedding("Python is a high-level programming language"),
            payload={                                    # Metadata (any JSON)
                "text": "Python is a high-level programming language",
                "source": "python_docs.pdf",
                "page": 1,
                "category": "programming",
                "language": "en",
                "date_indexed": "2025-01-15"
            }
        )
    ]
)
```

#### Batch Insert (Recommended for Large Datasets)

```python
import uuid

def index_documents(documents: list[dict], batch_size: int = 100):
    """Index documents in batches for efficiency."""
    
    for i in range(0, len(documents), batch_size):
        batch = documents[i:i + batch_size]
        
        # Get embeddings for the batch
        texts = [doc["text"] for doc in batch]
        embeddings = get_embeddings_batch(texts)
        
        # Create points
        points = [
            PointStruct(
                id=str(uuid.uuid4()),  # UUID as string
                vector=embedding,
                payload={
                    "text": doc["text"],
                    "source": doc["source"],
                    "page": doc.get("page", 0),
                    "category": doc.get("category", "general"),
                    "date_indexed": doc.get("date", ""),
                    "chunk_index": doc.get("chunk_index", 0)
                }
            )
            for doc, embedding in zip(batch, embeddings)
        ]
        
        # Upsert batch
        client.upsert(
            collection_name="knowledge_base",
            points=points
        )
        
        print(f"Indexed {min(i + batch_size, len(documents))}/{len(documents)}")

# Usage
documents = [
    {"text": "Python was created by Guido van Rossum in 1991.", 
     "source": "history.md", "category": "history"},
    {"text": "Python supports multiple programming paradigms.",
     "source": "features.md", "category": "features"},
    {"text": "NumPy is the fundamental package for scientific computing.",
     "source": "libraries.md", "category": "libraries"},
    # ... thousands more
]

index_documents(documents)
```

### Step 4: Query (Search)

```python
def search(query: str, top_k: int = 5) -> list[dict]:
    """Search for the most similar documents."""
    
    # Embed the query
    query_vector = get_embedding(query)
    
    # Search
    results = client.query_points(
        collection_name="knowledge_base",
        query=query_vector,
        limit=top_k,
        with_payload=True,      # Include metadata in results
        score_threshold=0.7     # Minimum similarity score
    )
    
    return [
        {
            "id": point.id,
            "score": point.score,
            "text": point.payload["text"],
            "source": point.payload["source"],
            "category": point.payload.get("category", "")
        }
        for point in results.points
    ]

# Usage
results = search("Who created the Python language?")
for r in results:
    print(f"Score: {r['score']:.4f} | {r['text'][:80]}...")
```

### Step 5: Collection Management

```python
# List all collections
collections = client.get_collections()
print(collections)

# Get collection info
info = client.get_collection("knowledge_base")
print(f"Points: {info.points_count}")
print(f"Vectors: {info.vectors_count}")
print(f"Status: {info.status}")

# Delete a collection
client.delete_collection("knowledge_base")

# Delete specific points
client.delete(
    collection_name="knowledge_base",
    points_selector=[1, 2, 3]  # Delete by IDs
)

# Count points
count = client.count(
    collection_name="knowledge_base",
    exact=True
)
print(f"Total points: {count.count}")
```

### Complete Working Example

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from openai import OpenAI
import uuid

# ── Setup ───────────────────────────────────────────────
qdrant = QdrantClient(host="localhost", port=6333)
openai_client = OpenAI()

COLLECTION = "demo"
EMBED_MODEL = "text-embedding-3-small"
DIMENSIONS = 1536

# ── Create Collection ────────────────────────────────────
qdrant.recreate_collection(
    collection_name=COLLECTION,
    vectors_config=VectorParams(size=DIMENSIONS, distance=Distance.COSINE),
)

# ── Sample Data ──────────────────────────────────────────
docs = [
    "The Eiffel Tower is 330 meters tall and located in Paris, France.",
    "Mount Everest is the tallest mountain in the world at 8,849 meters.",
    "The Great Wall of China stretches over 13,000 miles.",
    "The Amazon River is the largest river by discharge volume.",
    "The Sahara Desert is the largest hot desert in the world.",
    "Tokyo is the most populous metropolitan area in the world.",
    "The Pacific Ocean is the largest and deepest ocean on Earth.",
    "The human brain contains approximately 86 billion neurons.",
]

# ── Embed & Store ────────────────────────────────────────
response = openai_client.embeddings.create(input=docs, model=EMBED_MODEL)
embeddings = [item.embedding for item in response.data]

points = [
    PointStruct(
        id=str(uuid.uuid4()),
        vector=emb,
        payload={"text": text, "index": i}
    )
    for i, (text, emb) in enumerate(zip(docs, embeddings))
]

qdrant.upsert(collection_name=COLLECTION, points=points)
print(f"✅ Stored {len(points)} points")

# ── Search ───────────────────────────────────────────────
query = "What is the tallest structure in Europe?"
q_emb = openai_client.embeddings.create(input=query, model=EMBED_MODEL).data[0].embedding

results = qdrant.query_points(
    collection_name=COLLECTION,
    query=q_emb,
    limit=3,
    with_payload=True,
)

print(f"\n🔍 Query: '{query}'\n")
for point in results.points:
    print(f"  [{point.score:.4f}] {point.payload['text']}")
```

---

## 4. Vector Similarity Search

### Distance Metrics

The distance metric determines **how similarity between vectors is measured**. Choose it when creating a collection — it cannot be changed later.

#### Cosine Similarity

```
                    ┌─── Vector A
                    │  θ
                    │ /
                    │/
                    └─── Vector B
                    
Cosine Similarity = cos(θ) = (A · B) / (||A|| × ||B||)

Range: [-1, 1]
  1  = Identical direction (most similar)
  0  = Perpendicular (unrelated)
 -1  = Opposite direction (most dissimilar)
```

**Best for**: Text embeddings (most common choice).

#### Euclidean Distance (L2)

```
                    ● Vector A
                   /|
                  / |
          dist   /  |
                /   |
               /    |
              ● Vector B
              
Euclidean Distance = √(Σ(Aᵢ - Bᵢ)²)

Range: [0, ∞)
  0  = Identical vectors (most similar)
  ∞  = Infinitely far apart (most dissimilar)
```

**Best for**: When magnitude matters (e.g., image feature vectors).

#### Dot Product

```
Dot Product = Σ(Aᵢ × Bᵢ)

Range: (-∞, ∞)
  Higher = More similar
  
Note: Equivalent to cosine similarity when vectors are normalized.
```

**Best for**: Pre-normalized vectors, Maximum Inner Product Search (MIPS).

### Choosing the Right Metric

| Metric | Use When | Common With |
|--------|----------|-------------|
| **Cosine** | Vectors may have different magnitudes; you care about direction only | OpenAI, Cohere, most text embeddings |
| **Euclidean** | Magnitude matters; spatial distance is meaningful | Image embeddings, face recognition |
| **Dot Product** | Vectors are already normalized; need maximum speed | Sentence-Transformers (when normalized) |

```python
from qdrant_client.models import Distance

# Choose when creating collection
client.create_collection(
    collection_name="text_collection",
    vectors_config=VectorParams(
        size=1536,
        distance=Distance.COSINE      # Options: COSINE, EUCLID, DOT
    )
)
```

### Exact vs. Approximate Search

| Feature | Exact (Brute Force) | Approximate (HNSW) |
|---------|--------------------|--------------------|
| Accuracy | 100% | ~95–99% |
| Speed (1M vectors) | ~500ms | ~1–5ms |
| When to use | Small datasets (<10K) | Large datasets (10K+) |
| Index needed | No | Yes |

```python
# Exact search (brute force) — useful for small collections or validation
results = client.query_points(
    collection_name="knowledge_base",
    query=query_vector,
    limit=5,
    search_params=SearchParams(
        exact=True  # Force brute-force scan
    )
)

# Approximate search with tuned HNSW
results = client.query_points(
    collection_name="knowledge_base",
    query=query_vector,
    limit=5,
    search_params=SearchParams(
        hnsw_ef=256,    # Higher = more accurate, slower
        exact=False     # Use HNSW index (default)
    )
)
```

### Tuning Search Quality vs. Speed

```python
from qdrant_client.models import SearchParams

# Fast but less accurate (real-time autocomplete)
fast_params = SearchParams(hnsw_ef=64)

# Balanced (default, good for most RAG)
balanced_params = SearchParams(hnsw_ef=128)

# High accuracy (critical applications)
accurate_params = SearchParams(hnsw_ef=512)

# Use in search
results = client.query_points(
    collection_name="knowledge_base",
    query=query_vector,
    limit=10,
    search_params=accurate_params
)
```

### Multi-Vector Search (Named Vectors)

Qdrant supports storing **multiple vectors per point** — useful when you want to search by different aspects:

```python
from qdrant_client.models import VectorParams, NamedVector

# Create collection with multiple named vectors
client.create_collection(
    collection_name="products",
    vectors_config={
        "title": VectorParams(size=1536, distance=Distance.COSINE),
        "description": VectorParams(size=1536, distance=Distance.COSINE),
        "image": VectorParams(size=512, distance=Distance.COSINE),
    }
)

# Insert with multiple vectors
client.upsert(
    collection_name="products",
    points=[
        PointStruct(
            id=1,
            vector={
                "title": embed("Red Nike Sneakers"),
                "description": embed("Comfortable running shoes with air cushioning..."),
                "image": image_embed("sneakers.jpg"),
            },
            payload={"name": "Red Nike Sneakers", "price": 120}
        )
    ]
)

# Search by a specific vector
results = client.query_points(
    collection_name="products",
    query=NamedVector(name="description", vector=embed("comfortable running shoes")),
    limit=5
)
```

---

## 5. Metadata Filtering for Scoped Results

### What Is Filtering?

Filtering lets you **narrow your search to a subset** of vectors based on their payload (metadata) fields. This combines the power of vector similarity with traditional database-style filtering.

```
Without filtering:
  Query: "machine learning tutorials"
  Results: ALL similar docs across entire database
  
With filtering:
  Query: "machine learning tutorials"
  Filter: category = "tutorials" AND language = "en" AND date > "2024-01-01"
  Results: Only matching docs within the filtered subset
```

### How Qdrant Applies Filters

```
┌───────────────────────────────────────┐
│           All Points (1M)             │
│                                       │
│   ┌───────────────────────────┐       │
│   │  After Metadata Filter    │       │
│   │     (50K points)          │       │
│   │                           │       │
│   │   ┌─────────────────┐    │       │
│   │   │ After Vector     │    │       │
│   │   │ Similarity (Top 5)│    │       │
│   │   │  ● ● ● ● ●      │    │       │
│   │   └─────────────────┘    │       │
│   └───────────────────────────┘       │
└───────────────────────────────────────┘
```

> [!IMPORTANT]
> Qdrant performs filtering **during** the HNSW search, not after. This means filtered searches are efficient even when the filter reduces the dataset dramatically.

### Creating Payload Indexes

For large datasets, create indexes on frequently-filtered fields for better performance:

```python
from qdrant_client.models import PayloadSchemaType

# Index a keyword field (exact match)
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="category",
    field_schema=PayloadSchemaType.KEYWORD
)

# Index a numeric field (range queries)
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="page",
    field_schema=PayloadSchemaType.INTEGER
)

# Index a float field
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="score",
    field_schema=PayloadSchemaType.FLOAT
)

# Index a text field (full-text search)
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="text",
    field_schema=PayloadSchemaType.TEXT
)

# Index a boolean field
client.create_payload_index(
    collection_name="knowledge_base",
    field_name="is_verified",
    field_schema=PayloadSchemaType.BOOL
)
```

### Filter Types and Syntax

#### Match (Exact Value)

```python
from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny

# Single value match
filter = Filter(
    must=[
        FieldCondition(
            key="category",
            match=MatchValue(value="programming")
        )
    ]
)

# Match any of multiple values (OR within field)
filter = Filter(
    must=[
        FieldCondition(
            key="category",
            match=MatchAny(any=["programming", "tutorials", "guides"])
        )
    ]
)
```

#### Range (Numeric Comparisons)

```python
from qdrant_client.models import Range

# Page number between 10 and 50
filter = Filter(
    must=[
        FieldCondition(
            key="page",
            range=Range(gte=10, lte=50)
        )
    ]
)

# Documents from 2024 onwards
filter = Filter(
    must=[
        FieldCondition(
            key="year",
            range=Range(gte=2024)
        )
    ]
)
```

#### Combining Filters (AND, OR, NOT)

```python
# AND: All conditions must be true
filter = Filter(
    must=[
        FieldCondition(key="category", match=MatchValue(value="programming")),
        FieldCondition(key="language", match=MatchValue(value="en")),
        FieldCondition(key="year", range=Range(gte=2024)),
    ]
)

# OR: At least one condition must be true
filter = Filter(
    should=[
        FieldCondition(key="category", match=MatchValue(value="programming")),
        FieldCondition(key="category", match=MatchValue(value="tutorials")),
    ]
)

# NOT: Exclude matching points
filter = Filter(
    must_not=[
        FieldCondition(key="category", match=MatchValue(value="deprecated")),
        FieldCondition(key="is_draft", match=MatchValue(value=True)),
    ]
)

# Complex: Combine AND + OR + NOT
filter = Filter(
    must=[
        FieldCondition(key="language", match=MatchValue(value="en")),
    ],
    should=[
        FieldCondition(key="category", match=MatchValue(value="tutorials")),
        FieldCondition(key="category", match=MatchValue(value="guides")),
    ],
    must_not=[
        FieldCondition(key="status", match=MatchValue(value="archived")),
    ]
)
```

#### Nested Object Filtering

```python
# Payload: {"author": {"name": "Alice", "role": "admin"}}
filter = Filter(
    must=[
        FieldCondition(
            key="author.name",
            match=MatchValue(value="Alice")
        ),
        FieldCondition(
            key="author.role",
            match=MatchValue(value="admin")
        )
    ]
)
```

#### Check If Field Exists

```python
from qdrant_client.models import IsNullCondition, IsEmptyCondition

# Has a specific field
filter = Filter(
    must_not=[
        IsNullCondition(is_null={"key": "email"})
    ]
)

# Field is NOT empty
filter = Filter(
    must_not=[
        IsEmptyCondition(is_empty={"key": "tags"})
    ]
)
```

#### Full-Text Search Filter

```python
from qdrant_client.models import MatchText

# Requires a text index on the field
filter = Filter(
    must=[
        FieldCondition(
            key="text",
            match=MatchText(text="machine learning")
        )
    ]
)
```

### Using Filters in Search

```python
# Full search with filtering
results = client.query_points(
    collection_name="knowledge_base",
    query=query_vector,
    query_filter=Filter(
        must=[
            FieldCondition(key="category", match=MatchValue(value="tutorials")),
            FieldCondition(key="language", match=MatchValue(value="en")),
        ],
        must_not=[
            FieldCondition(key="status", match=MatchValue(value="archived")),
        ]
    ),
    limit=10,
    with_payload=True,
    score_threshold=0.7
)
```

### Real-World Filtering Patterns

| Use Case | Filter Strategy |
|----------|----------------|
| **Multi-tenant SaaS** | `must: [tenant_id = "abc123"]` — Isolate each customer's data |
| **Permission-based access** | `must: [access_level ∈ user_permissions]` |
| **Time-scoped search** | `must: [date >= "2024-01-01"]` — Only recent documents |
| **Category browsing** | `must: [category = "selected"]` — Scope to a section |
| **Language filter** | `must: [language = "en"]` — Monolingual results |
| **Source priority** | `should: [source = "official_docs"]` — Prefer authoritative sources |
| **Exclude drafts** | `must_not: [status = "draft"]` — Only published content |

### Complete Filtered Search Example

```python
def rag_search(
    query: str,
    category: str = None,
    language: str = "en",
    min_date: str = None,
    exclude_sources: list[str] = None,
    top_k: int = 5
) -> list[dict]:
    """Production-ready filtered search for RAG."""
    
    # Build filter dynamically
    must_conditions = [
        FieldCondition(key="language", match=MatchValue(value=language))
    ]
    must_not_conditions = []
    
    if category:
        must_conditions.append(
            FieldCondition(key="category", match=MatchValue(value=category))
        )
    
    if min_date:
        must_conditions.append(
            FieldCondition(key="date_indexed", range=Range(gte=min_date))
        )
    
    if exclude_sources:
        for source in exclude_sources:
            must_not_conditions.append(
                FieldCondition(key="source", match=MatchValue(value=source))
            )
    
    query_filter = Filter(
        must=must_conditions,
        must_not=must_not_conditions if must_not_conditions else None
    )
    
    # Embed and search
    query_vector = get_embedding(query)
    
    results = client.query_points(
        collection_name="knowledge_base",
        query=query_vector,
        query_filter=query_filter,
        limit=top_k,
        with_payload=True,
        score_threshold=0.65
    )
    
    return [
        {
            "text": point.payload["text"],
            "source": point.payload["source"],
            "score": point.score,
            "category": point.payload.get("category"),
        }
        for point in results.points
    ]

# Usage
results = rag_search(
    query="How to handle errors in async Python?",
    category="tutorials",
    language="en",
    min_date="2024-06-01",
    exclude_sources=["outdated_guide.md"],
    top_k=5
)
```

---

## 6. Reranking for Better Retrieval Quality

### The Problem: Why Vector Search Alone Isn't Enough

Vector similarity search uses **bi-encoders** — the query and documents are embedded independently, then compared by distance. This is fast but imprecise:

```
Bi-Encoder (used in vector search):
  
  Query: "Python error handling"  ──▶ Encoder ──▶ [0.2, 0.5, ...]
  Doc 1: "Try/except in Python"   ──▶ Encoder ──▶ [0.3, 0.4, ...]  ← Encoded separately
  Doc 2: "Python is a language"   ──▶ Encoder ──▶ [0.25, 0.45, ...]
  
  Compare by cosine distance → Ranked list
  
  Problem: Doc 2 matches "Python" well but isn't about error handling.
           The encoder can't see query + doc together to judge relevance.
```

### The Solution: Cross-Encoder Reranking

A **cross-encoder** processes the query and document **together** as a single input, enabling deep cross-attention between them:

```
Cross-Encoder (used in reranking):
  
  Input: "[CLS] Python error handling [SEP] Try/except in Python [SEP]"
         ──▶ Full Transformer ──▶ Relevance Score: 0.95
  
  Input: "[CLS] Python error handling [SEP] Python is a language [SEP]"
         ──▶ Full Transformer ──▶ Relevance Score: 0.23
  
  Much more accurate! But too slow to run on all documents.
```

### The Two-Stage Pipeline

```
                     Stage 1: Retrieval              Stage 2: Reranking
                     (Fast, Approximate)             (Slow, Accurate)
                     
User Query ──▶ Bi-Encoder ──▶ Top 20-50 docs ──▶ Cross-Encoder ──▶ Top 5 docs ──▶ LLM
               (vector DB)    (candidates)         (reranker)       (final)
               ~5ms           ~100ms                                               
```

| Stage | Model Type | Speed | Accuracy | Scope |
|-------|-----------|-------|----------|-------|
| **Retrieval** | Bi-encoder | ⚡ ~5ms over millions | 🟡 Good | All docs |
| **Reranking** | Cross-encoder | 🐢 ~100ms over 20-50 | 🟢 Excellent | Candidates only |

### Reranking with sentence-transformers

```bash
pip install sentence-transformers
```

```python
from sentence_transformers import CrossEncoder

# Load a cross-encoder reranking model
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2")

def rerank(query: str, documents: list[dict], top_n: int = 5) -> list[dict]:
    """Rerank retrieved documents using a cross-encoder."""
    
    # Create query-document pairs
    pairs = [(query, doc["text"]) for doc in documents]
    
    # Score all pairs
    scores = reranker.predict(pairs)
    
    # Attach scores to documents
    for doc, score in zip(documents, scores):
        doc["rerank_score"] = float(score)
    
    # Sort by rerank score (descending) and return top-N
    reranked = sorted(documents, key=lambda x: x["rerank_score"], reverse=True)
    return reranked[:top_n]
```

### Reranking with Cohere

```bash
pip install cohere
```

```python
import cohere

co = cohere.Client("your-api-key")

def rerank_cohere(query: str, documents: list[dict], top_n: int = 5) -> list[dict]:
    """Rerank using Cohere's rerank API."""
    
    results = co.rerank(
        query=query,
        documents=[doc["text"] for doc in documents],
        model="rerank-v3.5",
        top_n=top_n,
        return_documents=True
    )
    
    reranked = []
    for r in results.results:
        doc = documents[r.index].copy()
        doc["rerank_score"] = r.relevance_score
        reranked.append(doc)
    
    return reranked
```

### Reranking with Voyage AI

```python
import voyageai

vo = voyageai.Client()

def rerank_voyage(query: str, documents: list[dict], top_n: int = 5) -> list[dict]:
    """Rerank using Voyage AI's reranker."""
    
    result = vo.rerank(
        query=query,
        documents=[doc["text"] for doc in documents],
        model="rerank-2",
        top_k=top_n
    )
    
    reranked = []
    for r in result.results:
        doc = documents[r.index].copy()
        doc["rerank_score"] = r.relevance_score
        reranked.append(doc)
    
    return reranked
```

### Popular Reranking Models

| Model | Provider | Type | Relative Quality | Relative Speed | Cost |
|-------|----------|------|---------|-------|------|
| **rerank-v3.5** | Cohere | API | 🟢 Excellent | ⚡ Fast | Paid |
| **rerank-2** | Voyage AI | API | 🟢 Excellent | ⚡ Fast | Paid |
| **ms-marco-MiniLM-L-12-v2** | Sentence-Transformers | Local | 🟢 Very Good | ⚡⚡ Fast | Free |
| **bge-reranker-v2-m3** | BAAI | Local | 🟢 Excellent | 🐢 Medium | Free |
| **jina-reranker-v2** | Jina AI | API/Local | 🟢 Very Good | ⚡ Fast | Free/Paid |
| **mxbai-rerank-large** | Mixedbread | Local | 🟢 Very Good | 🐢 Medium | Free |

### Complete RAG Pipeline with Reranking

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
from sentence_transformers import CrossEncoder
from openai import OpenAI

# Setup
qdrant = QdrantClient(host="localhost", port=6333)
openai_client = OpenAI()
reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-12-v2")

def rag_pipeline(
    query: str,
    collection: str = "knowledge_base",
    retrieve_k: int = 20,
    rerank_top_n: int = 5,
    category: str = None
) -> dict:
    """Full RAG pipeline: Retrieve → Rerank → Generate."""
    
    # ── Step 1: Embed Query ──────────────────────────────
    query_vector = openai_client.embeddings.create(
        input=query, model="text-embedding-3-small"
    ).data[0].embedding
    
    # ── Step 2: Retrieve Candidates ──────────────────────
    query_filter = None
    if category:
        query_filter = Filter(
            must=[FieldCondition(key="category", match=MatchValue(value=category))]
        )
    
    candidates = qdrant.query_points(
        collection_name=collection,
        query=query_vector,
        query_filter=query_filter,
        limit=retrieve_k,
        with_payload=True
    )
    
    if not candidates.points:
        return {"answer": "No relevant documents found.", "sources": []}
    
    # ── Step 3: Rerank ───────────────────────────────────
    docs = [
        {
            "id": point.id,
            "text": point.payload["text"],
            "source": point.payload.get("source", ""),
            "page": point.payload.get("page", 0),
            "vector_score": point.score
        }
        for point in candidates.points
    ]
    
    pairs = [(query, doc["text"]) for doc in docs]
    rerank_scores = reranker.predict(pairs)
    
    for doc, score in zip(docs, rerank_scores):
        doc["rerank_score"] = float(score)
    
    top_docs = sorted(docs, key=lambda x: x["rerank_score"], reverse=True)[:rerank_top_n]
    
    # ── Step 4: Generate Answer ──────────────────────────
    context = "\n\n---\n\n".join([
        f"[Source: {d['source']}, Page {d['page']}]\n{d['text']}"
        for d in top_docs
    ])
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": (
                    "Answer the user's question based ONLY on the provided context. "
                    "Cite sources using [Source: filename, Page X]. "
                    "If the context is insufficient, say so."
                )
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}"
            }
        ]
    )
    
    answer = response.choices[0].message.content
    
    # ── Step 5: Return Results ───────────────────────────
    return {
        "answer": answer,
        "sources": [
            {
                "source": d["source"],
                "page": d["page"],
                "vector_score": round(d["vector_score"], 4),
                "rerank_score": round(d["rerank_score"], 4),
                "snippet": d["text"][:150] + "..."
            }
            for d in top_docs
        ],
        "retrieval_stats": {
            "candidates_retrieved": len(docs),
            "after_reranking": len(top_docs),
            "filter_applied": category
        }
    }

# ── Usage ────────────────────────────────────────────────
result = rag_pipeline(
    query="How do I handle connection timeouts in Python?",
    category="tutorials",
    retrieve_k=20,
    rerank_top_n=5
)

print(f"Answer: {result['answer']}\n")
print("Sources:")
for s in result["sources"]:
    print(f"  • {s['source']} (p.{s['page']}) "
          f"— vector: {s['vector_score']}, rerank: {s['rerank_score']}")
```

### Before vs. After Reranking

```
Query: "How to handle database connection timeouts in Python?"

BEFORE reranking (vector similarity only):
  #1 [0.89] "Python is widely used for database applications..."     ← Topically close but generic
  #2 [0.87] "Connection pooling in Python with SQLAlchemy..."        ← Related but not about timeouts
  #3 [0.85] "Handling timeouts in HTTP requests with Python..."      ← Wrong type of timeout
  #4 [0.84] "Database connection timeout: set connect_timeout=10..." ← ✅ Exact answer!
  #5 [0.83] "Python database drivers comparison..."                  ← Not relevant

AFTER reranking (cross-encoder):
  #1 [0.97] "Database connection timeout: set connect_timeout=10..." ← ✅ Promoted to #1
  #2 [0.82] "Handling timeouts in HTTP requests with Python..."      ← Somewhat relevant
  #3 [0.71] "Connection pooling in Python with SQLAlchemy..."        ← Background info
  #4 [0.23] "Python is widely used for database applications..."     ← Demoted (too generic)
  #5 [0.12] "Python database drivers comparison..."                  ← Demoted (not relevant)
```

### When to Use (and Skip) Reranking

| ✅ Use Reranking When | ❌ Skip Reranking When |
|----------------------|----------------------|
| RAG / question answering | Simple nearest-neighbor lookup |
| Precision is critical (legal, medical) | Latency budget is < 10ms |
| Queries are complex or nuanced | Dataset is very small (< 1K points) |
| Vector search returns many "close" scores | Cost is a primary concern |
| Multi-hop or complex reasoning tasks | Results are already highly relevant |

---

## 🏁 Quick Reference

| Concept | Key Takeaway |
|---------|-------------|
| **Vector DB internals** | HNSW graph index enables sub-ms search over millions of vectors |
| **Distance metric** | Use Cosine for text, Euclidean for images, Dot Product for normalized vectors |
| **Qdrant setup** | `docker run -p 6333:6333 qdrant/qdrant` → Dashboard at `:6333/dashboard` |
| **Store data** | `client.upsert()` with `PointStruct(id, vector, payload)` |
| **Search** | `client.query_points()` with `query_filter` for scoped results |
| **Filtering** | `must` (AND), `should` (OR), `must_not` (NOT) on payload fields |
| **Reranking** | Retrieve top-20 → Cross-encoder rerank → Use top-5 for generation |

---

## 📚 Further Reading

- [Qdrant Official Documentation](https://qdrant.tech/documentation/)
- [Qdrant Python Client API Reference](https://python-client.qdrant.tech/)
- [HNSW Algorithm Paper (Malkov & Yashunin, 2018)](https://arxiv.org/abs/1603.09320)
- [Sentence-Transformers Cross-Encoders](https://www.sbert.net/docs/cross_encoder/usage/usage.html)
- [Cohere Rerank Documentation](https://docs.cohere.com/docs/rerank)
- [Understanding Vector Databases (Pinecone)](https://www.pinecone.io/learn/vector-database/)

---

> *"A vector database doesn't just store data — it understands the meaning behind it."*
