[🏠 Home](../../../../README.md) | [⬅️ AWS Services Guide](../../../../aws/aws-services-guide.md)

# ☁️ AWS Services — Real Use Cases, Examples & Interview Questions

> A comprehensive interview-prep guide covering **SNS, SQS, Lambda, Step Functions, API Gateway, ALB, S3, EKS, ECS, KMS, Secrets Manager, and Parameter Store** with production scenarios, code snippets, and top interview questions.

---

## 📋 Quick Reference

| Service | Category | One-Liner |
|:--------|:---------|:----------|
| **SNS** | Messaging | Pub/Sub push notifications to multiple subscribers |
| **SQS** | Messaging | Fully managed message queue for decoupling |
| **Lambda** | Compute | Serverless functions, pay-per-execution |
| **Step Functions** | Orchestration | Visual workflow engine for multi-step processes |
| **API Gateway** | Networking | Managed REST/WebSocket API front door |
| **ALB** | Networking | Layer-7 load balancer with path/host routing |
| **S3** | Storage | Unlimited object storage, 11 nines durability |
| **EKS** | Compute | Managed Kubernetes |
| **ECS** | Compute | Managed Docker container orchestration |
| **KMS** | Security | Managed encryption key service |
| **Secrets Manager** | Security | Rotate & manage secrets (DB creds, API keys) |
| **Parameter Store** | Config | Hierarchical config & secrets storage |

---

## 1️⃣ Amazon SNS (Simple Notification Service)

### What It Is

> Fully managed **pub/sub** messaging service. Publishers send messages to a **Topic**; all subscribers receive a copy.

```text
  Publisher ───▶ SNS Topic ───▶ SQS Queue (subscriber 1)
                      ├───────▶ Lambda (subscriber 2)
                      ├───────▶ HTTP Endpoint (subscriber 3)
                      └───────▶ Email / SMS (subscriber 4)
```

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **Order Fan-Out** | Order service publishes to `order-events` topic → Email SQS, Inventory SQS, Analytics SQS each get a copy |
| 2 | **CloudWatch Alarms** | CPU > 80% → SNS → PagerDuty HTTP + Ops email |
| 3 | **S3 Event Notifications** | New file uploaded → SNS → triggers multiple downstream Lambdas |
| 4 | **Cross-Region Replication** | SNS topic in us-east-1 fans out to SQS queues in eu-west-1 |

### Code Example — Publish to SNS (Java SDK v2)

```java
SnsClient sns = SnsClient.builder().region(Region.US_EAST_1).build();

PublishRequest request = PublishRequest.builder()
    .topicArn("arn:aws:sns:us-east-1:123456789:order-events")
    .message("{\"orderId\":\"ORD-123\",\"status\":\"PLACED\"}")
    .messageAttributes(Map.of(
        "eventType", MessageAttributeValue.builder()
            .dataType("String").stringValue("ORDER_PLACED").build()
    ))
    .build();

sns.publish(request);
```

### SNS — Message Filtering

```text
  SNS Topic: order-events
       │
       ├── Filter: {"eventType": ["ORDER_PLACED"]}  ──▶ SQS: new-orders
       ├── Filter: {"eventType": ["ORDER_CANCELLED"]} ──▶ SQS: cancellations
       └── No filter (receives ALL) ──────────────────▶ SQS: audit-log
```

> 💡 **Filtering at the subscription level** avoids unnecessary processing — consumers only get what they care about.

### 🎯 Interview Questions — SNS

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **SNS vs SQS?** | SNS = push (fan-out, 1-to-many), SQS = pull (queue, 1-to-1). Often combined: SNS → SQS fan-out pattern |
| 2 | **SNS vs EventBridge?** | EventBridge has richer filtering (content-based), schema registry, 30+ AWS sources. SNS is simpler pub/sub with higher throughput |
| 3 | **How to guarantee ordering?** | Use **SNS FIFO** + **SQS FIFO** with `MessageGroupId`. Standard SNS is best-effort ordering |
| 4 | **What if a subscriber is down?** | SNS retries (HTTP: 3 tries). For durability, always fan out to SQS (messages persist up to 14 days) |
| 5 | **What is message filtering?** | Subscription filter policies let subscribers receive only matching messages, reducing cost & processing |
| 6 | **Max message size?** | 256 KB. For larger payloads, use **S3 + reference pattern** (store payload in S3, send S3 URL in message) |

---

## 2️⃣ Amazon SQS (Simple Queue Service)

### What It Is

> Fully managed **message queue**. Producers send messages; consumers **poll** and process them. Provides **decoupling, buffering, and load leveling**.

```text
  Producer A ──┐              ┌── Consumer 1 (polls)
  Producer B ──┼──▶ SQS Queue ├── Consumer 2 (polls)
  Producer C ──┘              └── Consumer 3 (polls)
               (each message delivered to ONLY ONE consumer)
```

### Standard vs FIFO

| Feature | Standard | FIFO |
|---------|----------|------|
| **Throughput** | Unlimited | 300 msg/s (3,000 with batching) |
| **Ordering** | Best-effort | Strict FIFO per MessageGroupId |
| **Delivery** | At-least-once (possible duplicates) | Exactly-once (dedup window: 5 min) |
| **Use Case** | High-throughput tasks | Financial txns, order processing |
| **Queue Name** | Any | Must end with `.fifo` |

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **Order Processing** | API → SQS → Worker Lambda processes orders. If worker crashes, message returns to queue after visibility timeout |
| 2 | **Image Thumbnail Generation** | S3 upload event → SQS → Lambda resizes image. SQS buffers during traffic spikes |
| 3 | **Email Sending** | App enqueues email jobs → Workers pull & send via SES. DLQ catches failures after 3 retries |
| 4 | **Microservice Decoupling** | Payment service → SQS → Notification service. If Notification service is down, messages wait safely |

### Key Concepts

```text
  Visibility Timeout (default 30s)
  ─────────────────────────────────
  1. Consumer polls message         → message becomes INVISIBLE
  2. Consumer processes it          → consumer DELETES message ✅
  3. If consumer crashes/times out  → message becomes VISIBLE again 🔄
                                      (retried by another consumer)

  Dead Letter Queue (DLQ)
  ──────────────────────
  After N failed attempts (maxReceiveCount), message moves to DLQ
  Main Queue ──(fail x3)──▶ DLQ (for investigation/replay)
```

### Code Example — SQS Consumer (Spring Boot)

```java
@SqsListener("order-processing-queue")
public void handleMessage(@Payload OrderEvent event,
                          @Header("MessageId") String msgId) {
    log.info("Processing order: {} (msgId={})", event.getOrderId(), msgId);
    orderService.processOrder(event);
    // Message auto-acknowledged on success
    // On exception → message returns to queue after visibility timeout
}
```

### 🎯 Interview Questions — SQS

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **What is visibility timeout?** | Time a message is invisible after being read. If not deleted within this time, it reappears for retry. Default: 30s, max: 12 hours |
| 2 | **How does DLQ work?** | After `maxReceiveCount` failed processing attempts, message auto-moves to DLQ. Use DLQ redrive to replay |
| 3 | **Long polling vs short polling?** | Long polling (`WaitTimeSeconds=20`) waits for messages → reduces empty responses & cost. Short polling returns immediately |
| 4 | **How to scale consumers?** | Use SQS as Lambda event source (auto-scales). Or ECS/EC2 with auto-scaling based on `ApproximateNumberOfMessagesVisible` |
| 5 | **SQS + Lambda — how many invocations?** | Lambda polls SQS, batches 1-10 messages per invocation. Scales up to 1,000 concurrent executions |
| 6 | **FIFO deduplication?** | Content-based (SHA-256 hash of body) or `MessageDeduplicationId`. Dedup window = 5 minutes |
| 7 | **Max retention?** | 1 min to 14 days (default 4 days). Max message size: 256 KB |

---

## 3️⃣ AWS Lambda

### What It Is

> **Serverless compute** — upload your code, AWS runs it in response to events. No servers to manage. Pay only for execution time (per ms).

```text
  TRIGGERS             LAMBDA FUNCTION              DESTINATIONS
  ────────             ───────────────              ────────────
  API Gateway ──┐                           ┌──▶ DynamoDB
  S3 Event     ─┤     ┌──────────────┐     ├──▶ S3
  SQS Message  ─┼────▶│  Your Code   │─────├──▶ SQS / SNS
  CloudWatch   ─┤     │  (handler)   │     ├──▶ Step Functions
  EventBridge  ─┘     └──────────────┘     └──▶ RDS Proxy → RDS
```

### Real Use Cases

| # | Use Case | Architecture |
|---|----------|-------------|
| 1 | **REST API** | API Gateway → Lambda → DynamoDB. Each endpoint = 1 Lambda or single Lambda with routing |
| 2 | **Real-Time File Processing** | S3 putObject event → Lambda → resize/transcode/validate → store result |
| 3 | **Cron Jobs** | EventBridge rule (rate: 1 hour) → Lambda → cleanup stale records, send reports |
| 4 | **Stream Processing** | Kinesis/DynamoDB Streams → Lambda → aggregate, transform, forward |
| 5 | **ChatBot Backend** | API Gateway WebSocket → Lambda → Bedrock/OpenAI → respond |

### Cold Start Deep Dive

```text
  COLD START (first invocation or after idle)
  ────────────────────────────────────────────
  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ Download │→ │  Init    │→ │  Init    │→ │  Handle  │
  │  Code    │  │ Runtime  │  │ Your Code│  │ Request  │
  └──────────┘  └──────────┘  └──────────┘  └──────────┘
  ◄──── Cold Start Penalty ────►◄── Billed ──►

  WARM START (reused container)
  ─────────────────────────────
  ┌──────────┐
  │  Handle  │  ← Container already initialized!
  │ Request  │
  └──────────┘

  Mitigation:
  • Provisioned Concurrency (pre-warm N instances)
  • SnapStart (Java — snapshot after init, restore on invoke)
  • Keep function size small, minimize dependencies
```

### Lambda Limits

| Aspect | Limit |
|--------|-------|
| **Memory** | 128 MB – 10 GB |
| **Timeout** | Max 15 minutes |
| **Package** | 50 MB (zip), 250 MB (unzipped), 10 GB (container image) |
| **Concurrency** | 1,000 default (soft limit, can increase) |
| **/tmp storage** | 512 MB – 10 GB |
| **Env vars** | 4 KB total |

### 🎯 Interview Questions — Lambda

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **What is a cold start? How to reduce it?** | First invocation needs container init. Mitigate with Provisioned Concurrency, SnapStart (Java), smaller packages, choose lighter runtimes (Node/Python) |
| 2 | **Lambda vs ECS/Fargate?** | Lambda: event-driven, short tasks (<15min), auto-scale to zero. ECS: long-running, predictable load, >15min tasks, more control |
| 3 | **How does Lambda scale?** | Adds concurrent executions per event. Burst: 3,000 (us-east-1), then 500/min. Throttled beyond account concurrency limit |
| 4 | **Lambda Layers?** | Shared code/dependencies packaged separately. Up to 5 layers per function. Great for common libs |
| 5 | **How to connect Lambda to RDS?** | Use **RDS Proxy** to pool connections. Direct connections cause connection exhaustion at scale |
| 6 | **Lambda Destinations vs DLQ?** | Destinations route async success/failure to SQS/SNS/Lambda/EventBridge. DLQ only captures failures. Destinations are preferred |
| 7 | **Idempotency in Lambda?** | SQS/SNS may deliver duplicates. Use idempotency key (e.g., `messageId`) + DynamoDB conditional write to prevent double processing |

---

## 4️⃣ AWS Step Functions (State Machines)

### What It Is

> **Serverless workflow orchestration** — coordinate multiple AWS services into visual, auditable workflows with built-in error handling and retry.

```text
  ┌─────────┐
  │  START  │
  └────┬────┘
       ▼
  ┌──────────┐   Yes   ┌──────────────┐
  │ Validate │────────▶│ Process Order│──┐
  │  Input   │         └──────────────┘  │
  └────┬─────┘                           │   ┌──────────────────┐
       │ No                              ├──▶│  Parallel:       │
       ▼                                 │   │  • Update Stock  │
  ┌──────────┐                           │   │  • Send Email    │
  │   FAIL   │                           │   │  • Log Analytics │
  └──────────┘                           │   └────────┬─────────┘
                                         │            ▼
                                         │       ┌─────────┐
                                         └──────▶│   END   │
                                                 └─────────┘
```

### Standard vs Express Workflows

| Feature | Standard | Express |
|---------|----------|---------|
| **Duration** | Up to 1 year | Up to 5 minutes |
| **Execution** | Exactly-once | At-least-once (async) / At-most-once (sync) |
| **Pricing** | Per state transition ($0.025/1000) | Per execution + duration |
| **History** | Full (90 days) | CloudWatch Logs |
| **Use Case** | Long-running: order processing, ETL | High-volume: IoT, streaming transforms |

### Real Use Cases

| # | Use Case | Architecture |
|---|----------|-------------|
| 1 | **E-Commerce Order Flow** | Validate → Payment → Inventory → Ship → Notify. Choice states for error paths |
| 2 | **ETL Pipeline** | Start Glue Job → Wait → Check Status → Success/Retry. Built-in retry with exponential backoff |
| 3 | **Human Approval Workflow** | Submit request → Wait for callback → Approve/Reject → Process |
| 4 | **Video Processing** | Upload → Extract metadata → Parallel (transcode 720p + 1080p + 4K) → Merge results → Notify |
| 5 | **ML Pipeline** | Preprocess data → Train model → Evaluate → Choice (accuracy > 95%?) → Deploy or retrain |

### State Types

| State | Purpose | Example |
|-------|---------|---------|
| **Task** | Invoke Lambda, ECS, SNS, etc. | `InvokeLambda: processPayment` |
| **Choice** | If/else branching | `if status == "approved"` |
| **Parallel** | Concurrent branches | Notify + Update DB + Log |
| **Map** | Loop over array items | Process each line item in order |
| **Wait** | Pause (seconds/timestamp) | Wait 24 hours for approval |
| **Pass** | Transform/inject data | Add default values |
| **Succeed / Fail** | Terminal states | End workflow |

### 🎯 Interview Questions — Step Functions

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **Why Step Functions over chaining Lambdas?** | Built-in retry, error handling, timeouts, visual debugging, state management. Chained Lambdas lose state on failure |
| 2 | **Standard vs Express?** | Standard: long-running (≤1 year), exactly-once, audit trail. Express: short (≤5 min), high-volume, cheaper |
| 3 | **How to handle errors?** | `Retry` (with backoff) and `Catch` (fallback state) at each Task. Can match specific error codes |
| 4 | **What is the callback pattern?** | Task sends a token → pauses → external system calls `SendTaskSuccess(token)` → workflow resumes. Used for human approval |
| 5 | **Map state vs Parallel state?** | Map: iterate over dynamic array (e.g., order items). Parallel: fixed number of concurrent branches |

---

## 5️⃣ Amazon API Gateway

### What It Is

> Managed service to create, publish, and secure **REST, HTTP, and WebSocket APIs** at any scale. Acts as the "front door" for your backend.

```text
  Client (Mobile/Web/IoT)
       │
       ▼
  ┌──────────────────────────────────────────────────┐
  │              API GATEWAY                          │
  │  ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
  │  │ Auth       │ │ Throttle │ │ Request       │  │
  │  │ (Cognito/  │ │ & Rate   │ │ Validation &  │  │
  │  │  IAM/JWT)  │ │ Limiting │ │ Transform     │  │
  │  └────────────┘ └──────────┘ └───────────────┘  │
  └──────────────────────────────────────────────────┘
       │               │               │
       ▼               ▼               ▼
    Lambda          ECS/ALB       AWS Services
                                  (S3, DynamoDB,
                                   Step Functions)
```

### REST API vs HTTP API

| Feature | REST API | HTTP API |
|---------|----------|----------|
| **Cost** | $3.50 / million | $1.00 / million (70% cheaper) |
| **Latency** | Higher | Lower |
| **Auth** | IAM, Cognito, Lambda authorizer | IAM, Cognito, JWT |
| **Features** | Caching, WAF, request validation, API keys | Simpler, JWT native |
| **Use Case** | Enterprise APIs needing full features | Modern microservices, simple APIs |

### Real Use Cases

| # | Use Case | Architecture |
|---|----------|-------------|
| 1 | **Serverless REST API** | API Gateway REST → Lambda → DynamoDB. Cognito for auth |
| 2 | **WebSocket Chat** | API Gateway WebSocket → Lambda (connect/disconnect/message) → DynamoDB (connections table) |
| 3 | **API Proxy to ECS** | API Gateway HTTP → VPC Link → ALB → ECS Fargate |
| 4 | **Direct S3 Access** | API Gateway → S3 integration (no Lambda needed for simple GET/PUT) |
| 5 | **Multi-Stage Deployment** | dev/staging/prod stages with stage variables pointing to different Lambda aliases |

### 🎯 Interview Questions — API Gateway

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **REST API vs HTTP API?** | HTTP API: cheaper (70%), lower latency, JWT-native. REST API: more features (caching, WAF, request validation, API keys) |
| 2 | **How to handle auth?** | Cognito User Pool authorizer, IAM auth (SigV4), Lambda authorizer (custom logic), JWT authorizer (HTTP API) |
| 3 | **Throttling?** | Default: 10,000 req/s, 5,000 burst. Per-stage and per-method throttling. Returns `429 Too Many Requests` |
| 4 | **How to reduce Lambda cold starts via API GW?** | Use Provisioned Concurrency. API Gateway caching also reduces Lambda invocations |
| 5 | **What are stages?** | Deployment snapshots (dev/staging/prod). Stage variables can point to different Lambda aliases or backends |
| 6 | **WebSocket API use cases?** | Real-time chat, live dashboards, IoT telemetry, multiplayer games |

---

## 6️⃣ Application Load Balancer (ALB)

### What It Is

> **Layer 7 (HTTP/HTTPS) load balancer** — routes traffic based on URL path, hostname, headers, or query strings. Part of Elastic Load Balancing (ELB) family.

```text
  Internet
     │
     ▼
  ┌─────────────────────────────────────────────────────────┐
  │                     ALB                                  │
  │                                                          │
  │  Rules:                                                  │
  │  ┌─────────────────────────────────────────────────────┐ │
  │  │ IF path = /api/*     → Target Group: ECS-API       │ │
  │  │ IF path = /images/*  → Target Group: S3 (redirect) │ │
  │  │ IF host = admin.*    → Target Group: ECS-Admin     │ │
  │  │ DEFAULT              → Target Group: ECS-Web       │ │
  │  └─────────────────────────────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘
       │              │              │
       ▼              ▼              ▼
    ECS-API       ECS-Admin       ECS-Web
  (Target Grp)  (Target Grp)   (Target Grp)
```

### ALB vs NLB vs CLB

| Feature | ALB (Layer 7) | NLB (Layer 4) | CLB (Legacy) |
|---------|---------------|---------------|--------------|
| **Protocol** | HTTP/HTTPS, gRPC | TCP, UDP, TLS | HTTP, TCP |
| **Routing** | Path, host, header, query | Port-based | Basic |
| **Performance** | Good | Ultra-low latency | Basic |
| **Static IP** | No (use Global Accelerator) | Yes (Elastic IP) | No |
| **WebSocket** | ✅ | ✅ | ❌ |
| **Use Case** | Web apps, microservices | Gaming, IoT, financial | Legacy only |

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **Microservice Routing** | `/users/*` → Users service, `/orders/*` → Orders service, `/payments/*` → Payments service |
| 2 | **Blue-Green Deployment** | Two target groups (blue/green). Weighted routing: 90% blue, 10% green → gradually shift |
| 3 | **EKS Ingress** | AWS Load Balancer Controller creates ALB from K8s Ingress resource. Path-based routing to pods |
| 4 | **Multi-Tenant SaaS** | Host-based routing: `tenant1.app.com` → TG-1, `tenant2.app.com` → TG-2 |

### 🎯 Interview Questions — ALB

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **ALB vs NLB?** | ALB: Layer 7, content-based routing, HTTP/gRPC. NLB: Layer 4, ultra-low latency, static IP, TCP/UDP |
| 2 | **ALB vs API Gateway?** | ALB: simple HTTP routing, cheaper at high volume, no rate limiting. API Gateway: auth, throttling, caching, request transform, WebSocket |
| 3 | **What is a target group?** | Group of targets (EC2, ECS tasks, IPs, Lambda) that ALB routes to. Each has its own health check |
| 4 | **Sticky sessions?** | ALB generates a cookie (`AWSALB`) to route same client to same target. Duration-based or app-based |
| 5 | **How does ALB work with ECS?** | ECS service registers tasks as targets in a target group. ALB routes traffic. Dynamic port mapping for multiple tasks on same host |
| 6 | **Cross-zone load balancing?** | Distributes traffic evenly across all targets in all enabled AZs, not just within the AZ the ALB node is in |

---

## 7️⃣ Amazon S3 (Simple Storage Service)

### What It Is

> **Unlimited object storage** — 99.999999999% (11 nines) durability. Objects up to 5 TB. Flat namespace with prefix-based "folders".

```text
  S3 Bucket: my-app-prod
  │
  ├── images/logo.png          (Object key = full path)
  ├── data/users.json
  └── logs/2024/01/access.log

  URL: https://my-app-prod.s3.amazonaws.com/images/logo.png
```

### Storage Classes

| Class | Access | Min Duration | Use Case |
|-------|--------|-------------|----------|
| **Standard** | Instant | None | Frequently accessed data |
| **Intelligent-Tiering** | Instant | 30 days | Unknown access patterns |
| **Standard-IA** | Instant | 30 days | Infrequent access, fast retrieval |
| **Glacier Instant** | Instant | 90 days | Archive with instant access |
| **Glacier Flexible** | 1-5 min or 5-12 hrs | 90 days | Archive, flexible retrieval |
| **Glacier Deep Archive** | 12-48 hrs | 180 days | Long-term archive (cheapest) |

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **Static Website** | S3 bucket + CloudFront CDN. Enable static hosting, point Route 53 |
| 2 | **Data Lake** | Land raw data in S3 → Glue crawlers → query with Athena (SQL over S3) |
| 3 | **Backup & Disaster Recovery** | Cross-region replication (CRR) + lifecycle rules to Glacier |
| 4 | **Pre-signed URLs** | Generate time-limited URLs for private object upload/download without exposing credentials |
| 5 | **Event-Driven Processing** | S3 event → Lambda / SQS / SNS → process file on upload |

### Code Example — Pre-signed URL (Java)

```java
S3Presigner presigner = S3Presigner.builder().region(Region.US_EAST_1).build();

GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
    .signatureDuration(Duration.ofMinutes(15))
    .getObjectRequest(b -> b.bucket("my-bucket").key("report.pdf"))
    .build();

PresignedGetObjectRequest presignedUrl = presigner.presignGetObject(presignRequest);
String url = presignedUrl.url().toString(); // Share this URL (expires in 15 min)
```

### 🎯 Interview Questions — S3

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **S3 consistency model?** | Strong read-after-write consistency for all operations (PUT/DELETE) since Dec 2020 |
| 2 | **How to secure S3?** | Bucket policy + IAM policy + ACL (legacy) + Block Public Access + Encryption (SSE-S3, SSE-KMS, SSE-C) + VPC Endpoint |
| 3 | **S3 vs EBS vs EFS?** | S3: object storage (API). EBS: block storage (attached to 1 EC2). EFS: file system (NFS, shared across EC2s) |
| 4 | **What is S3 versioning?** | Keeps all versions of an object. Prevents accidental deletes. Combined with MFA Delete for extra protection |
| 5 | **Multipart upload?** | Required for objects > 5 GB. Recommended for > 100 MB. Upload parts in parallel → complete |
| 6 | **S3 event notifications?** | Trigger Lambda, SQS, SNS, or EventBridge on object create/delete/restore events |
| 7 | **S3 Transfer Acceleration?** | Uses CloudFront edge locations to speed up uploads over long distances |
| 8 | **Cross-Region Replication?** | Async replication to another region. Requires versioning. Use case: DR, compliance, latency reduction |

---

## 8️⃣ Amazon ECS (Elastic Container Service)

### What It Is

> **Managed Docker container orchestration** — run containers without managing Kubernetes. Use **Fargate** (serverless) or **EC2** (self-managed) as compute.

```text
  ┌────────────────────── ECS CLUSTER ──────────────────────┐
  │                                                          │
  │  SERVICE: web-api (desired: 3)                          │
  │  ┌────────┐  ┌────────┐  ┌────────┐                    │
  │  │ Task 1 │  │ Task 2 │  │ Task 3 │   ← Docker         │
  │  │(Fargate)│ │(Fargate)│ │(Fargate)│     containers     │
  │  └────────┘  └────────┘  └────────┘                    │
  │                                                          │
  │  SERVICE: worker (desired: 2)                           │
  │  ┌────────┐  ┌────────┐                                 │
  │  │ Task 1 │  │ Task 2 │                                 │
  │  └────────┘  └────────┘                                 │
  └──────────────────────────────────────────────────────────┘
```

### ECS Concepts

| Concept | What It Is |
|---------|-----------|
| **Cluster** | Logical grouping of tasks and services |
| **Task Definition** | Blueprint (like a Dockerfile compose): image, CPU, memory, ports, env vars |
| **Task** | Running instance of a task definition (= one or more containers) |
| **Service** | Ensures N tasks are always running. Integrates with ALB, auto-scaling |
| **Fargate** | Serverless compute — no EC2 to manage. Pay per task vCPU/memory |

### Fargate vs EC2 Launch Type

| Aspect | Fargate | EC2 |
|--------|---------|-----|
| **Management** | Serverless | You manage instances |
| **Cost** | Pay per task (vCPU + mem) | Pay for EC2 (even if idle) |
| **Scaling** | Per-task | Per-instance + per-task |
| **GPU** | ❌ | ✅ |
| **Best For** | Most workloads, simplicity | GPU, cost optimization at scale |

### Real Use Cases

| # | Use Case | Architecture |
|---|----------|-------------|
| 1 | **Microservices Platform** | ALB → ECS Services (Users, Orders, Payments). Each service auto-scales independently |
| 2 | **CI/CD Worker** | CodePipeline → CodeBuild → push to ECR → ECS rolling/blue-green deployment |
| 3 | **Batch Processing** | SQS → ECS tasks (auto-scale based on queue depth) → process & store results |
| 4 | **ML Inference** | API Gateway → ALB → ECS (ML model container). GPU instances for heavy inference |

### 🎯 Interview Questions — ECS

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **ECS vs EKS?** | ECS: simpler, AWS-native, lower learning curve. EKS: Kubernetes (portable, multi-cloud, huge ecosystem) |
| 2 | **Fargate vs EC2?** | Fargate: serverless, simpler, no patching. EC2: lower cost at scale, GPU support, more control |
| 3 | **How does ECS auto-scale?** | Application Auto Scaling on service (target tracking: CPU/memory). Fargate scales tasks directly; EC2 also needs Capacity Provider for instance scaling |
| 4 | **Task role vs execution role?** | Task role: what the container can access (S3, DynamoDB). Execution role: what ECS agent needs (pull from ECR, send logs to CloudWatch) |
| 5 | **Blue-green deployment?** | Use CodeDeploy with ECS. Two target groups, traffic shifts gradually (linear/canary/all-at-once) with auto-rollback |
| 6 | **Service discovery?** | AWS Cloud Map (DNS-based). Services register/discover each other via DNS names: `orders.internal` |

---

## 9️⃣ Amazon EKS (Elastic Kubernetes Service)

### What It Is

> **Managed Kubernetes** — AWS manages the control plane (API server, etcd, scheduler). You manage worker nodes (or use Fargate).

```text
  ┌────── CONTROL PLANE (AWS Managed) ──────┐
  │ API Server │ etcd │ Scheduler │ Controller│
  └──────────────────┬──────────────────────┘
                     │
  ┌──────────────────┴─── DATA PLANE ────────────────────┐
  │  Node Group 1 (On-Demand)    Node Group 2 (Spot)     │
  │  ┌──────┐  ┌──────┐         ┌──────┐  ┌──────┐      │
  │  │Node 1│  │Node 2│         │Node 3│  │Node 4│      │
  │  │┌────┐│  │┌────┐│         │┌────┐│  │┌────┐│      │
  │  ││Pod ││  ││Pod ││         ││Pod ││  ││Pod ││      │
  │  │└────┘│  │└────┘│         │└────┘│  │└────┘│      │
  │  └──────┘  └──────┘         └──────┘  └──────┘      │
  └──────────────────────────────────────────────────────┘
```

### Real Use Cases

| # | Use Case | Why EKS |
|---|----------|---------|
| 1 | **Multi-Cloud Strategy** | K8s portability. Same manifests on EKS, GKE, AKS |
| 2 | **Large Microservices Platform** | Thousands of pods. K8s service mesh (Istio), Helm charts, robust ecosystem |
| 3 | **ML Training Platform** | GPU node groups + Kubeflow for ML training pipelines |
| 4 | **Hybrid Cloud** | EKS Anywhere for on-prem + EKS in cloud. Consistent K8s experience |

### 🎯 Interview Questions — EKS

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **EKS vs ECS?** | EKS: K8s (portable, massive ecosystem, higher complexity). ECS: simpler, AWS-native, good for AWS-only shops |
| 2 | **How does EKS networking work?** | VPC CNI plugin: pods get real VPC IPs (directly routable). No overlay network overhead |
| 3 | **EKS node options?** | Managed Node Groups (AWS manages), Self-Managed (you control AMI), Fargate (serverless, per-pod) |
| 4 | **How to expose services?** | ClusterIP (internal), NodePort, LoadBalancer (NLB/ALB via AWS LB Controller), Ingress (ALB Ingress) |
| 5 | **EKS cost?** | $0.10/hr per cluster (~$73/mo) + compute (EC2/Fargate). No charge for control plane pods |
| 6 | **How to handle secrets in EKS?** | K8s Secrets + AWS Secrets Manager with CSI driver (mounts secrets as volumes) |

---

## 🔟 AWS KMS (Key Management Service)

### What It Is

> **Managed encryption key service** — create, manage, and control cryptographic keys. Integrated with 100+ AWS services for seamless encryption.

```text
  ┌──────────────────── KMS KEY HIERARCHY ──────────────────┐
  │                                                          │
  │  AWS Managed Key          Customer Managed Key (CMK)    │
  │  (aws/s3, aws/rds)       (you create & control)        │
  │       │                        │                         │
  │       ▼                        ▼                         │
  │  ┌──────────┐           ┌──────────┐                    │
  │  │ KMS Key  │           │ KMS Key  │                    │
  │  └──────────┘           └──────────┘                    │
  │       │                        │                         │
  │       ▼                        ▼                         │
  │  Data Encryption Key     Data Encryption Key            │
  │  (encrypts your data)   (envelope encryption)           │
  └──────────────────────────────────────────────────────────┘
```

### Envelope Encryption

```text
  HOW ENVELOPE ENCRYPTION WORKS:
  ──────────────────────────────
  1. You call KMS → GenerateDataKey
  2. KMS returns:
     • Plaintext Data Key (use to encrypt data)
     • Encrypted Data Key (encrypted by KMS Master Key)
  3. Encrypt your data with Plaintext Data Key
  4. Store Encrypted Data Key alongside Encrypted Data
  5. Discard Plaintext Data Key from memory

  TO DECRYPT:
  1. Send Encrypted Data Key to KMS → Decrypt
  2. KMS returns Plaintext Data Key
  3. Decrypt data locally
```

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **S3 Server-Side Encryption** | SSE-KMS: S3 calls KMS to encrypt each object. Audit via CloudTrail |
| 2 | **RDS Encryption** | Enable encryption at rest. KMS key encrypts data, snapshots, replicas |
| 3 | **Application-Level Encryption** | Encrypt sensitive fields (SSN, CC#) before storing in DB. Decrypt on read |
| 4 | **Cross-Account Access** | Account A's KMS key with key policy → Account B's Lambda can decrypt |
| 5 | **EBS Volume Encryption** | Encrypted EBS volumes. Snapshots are auto-encrypted with same key |

### 🎯 Interview Questions — KMS

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **What is envelope encryption?** | KMS generates a Data Key → you encrypt data locally with it → store encrypted data key alongside. Avoids sending large data to KMS |
| 2 | **CMK vs AWS Managed Key?** | CMK: you control rotation, policies, cross-account access. AWS Managed: auto-created, auto-rotated, less control |
| 3 | **Key rotation?** | AWS Managed: auto yearly. CMK: enable automatic (yearly) or manual. Old key material kept for decryption |
| 4 | **KMS vs CloudHSM?** | KMS: multi-tenant, managed, FIPS 140-2 Level 2. CloudHSM: single-tenant, dedicated hardware, FIPS 140-2 Level 3, you control keys |
| 5 | **KMS pricing?** | $1/month per key + $0.03 per 10,000 API calls. Can get expensive at very high volume |
| 6 | **What happens if KMS key is deleted?** | 7-30 day waiting period. After deletion, all data encrypted with that key is PERMANENTLY inaccessible |

---

## 1️⃣1️⃣ AWS Secrets Manager

### What It Is

> **Managed secret storage with automatic rotation** — store DB credentials, API keys, tokens. Built-in rotation via Lambda for RDS, Redshift, DocumentDB.

```text
  ┌──────────────── SECRETS MANAGER ─────────────────────┐
  │                                                       │
  │  Secret: prod/db/mysql                                │
  │  ┌─────────────────────────────────────────────────┐  │
  │  │ { "username": "admin",                          │  │
  │  │   "password": "s3cur3P@ss!",                    │  │
  │  │   "host": "mydb.cluster-abc.us-east-1.rds...",  │  │
  │  │   "port": 3306 }                                │  │
  │  └─────────────────────────────────────────────────┘  │
  │                                                       │
  │  Rotation: Every 30 days (Lambda auto-rotates)       │
  │  Encryption: KMS CMK                                 │
  │  Versioning: AWSCURRENT, AWSPREVIOUS, AWSPENDING     │
  └───────────────────────────────────────────────────────┘
```

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **RDS Password Rotation** | Secrets Manager + built-in Lambda rotation function → rotates DB password every 30 days automatically |
| 2 | **Third-Party API Keys** | Store Stripe/Twilio API keys. Lambda/ECS fetch at runtime. Rotate manually or via custom Lambda |
| 3 | **Cross-Account Secrets** | Account A stores secret → resource policy grants Account B access via IAM |
| 4 | **ECS/EKS Secret Injection** | ECS task definition references secret ARN → injected as env var. EKS: CSI Secrets Store driver |

### Code Example — Fetch Secret (Java)

```java
SecretsManagerClient client = SecretsManagerClient.builder()
    .region(Region.US_EAST_1).build();

GetSecretValueRequest request = GetSecretValueRequest.builder()
    .secretId("prod/db/mysql")
    .build();

String secretJson = client.getSecretValue(request).secretString();
// Parse JSON → get username, password, host
```

### 🎯 Interview Questions — Secrets Manager

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **Secrets Manager vs Parameter Store?** | Secrets Manager: built-in rotation, $0.40/secret/month. Parameter Store: free tier (standard), no built-in rotation, hierarchical config |
| 2 | **How does rotation work?** | Lambda rotates secret in 4 steps: createSecret → setSecret (update DB) → testSecret → finishSecret. Uses AWSPENDING/AWSCURRENT labels |
| 3 | **How to avoid hardcoding secrets?** | Store in Secrets Manager. Fetch at startup or use caching SDK. ECS: inject via task definition. Lambda: env var from secret reference |
| 4 | **Cross-region replication?** | Secrets Manager supports replica secrets in other regions for DR |
| 5 | **How is it encrypted?** | Always encrypted with KMS (default `aws/secretsmanager` key or your CMK). Decrypted server-side when fetched |

---

## 1️⃣2️⃣ AWS Systems Manager Parameter Store

### What It Is

> **Hierarchical config and secrets storage** — store configuration data, feature flags, and secrets in a structured hierarchy. Free tier available.

```text
  Parameter Hierarchy:
  ─────────────────────
  /myapp/
  ├── /prod/
  │   ├── db-host        = "prod-db.cluster.rds.amazonaws.com"  (String)
  │   ├── db-password     = "encrypted..."                       (SecureString)
  │   ├── feature-flags   = '{"dark-mode":true,"beta":false}'    (String)
  │   └── max-connections = "100"                                (String)
  │
  └── /dev/
      ├── db-host        = "dev-db.cluster.rds.amazonaws.com"
      └── db-password     = "encrypted..."
```

### Parameter Types

| Type | Use Case | Encryption | Max Size |
|------|----------|-----------|----------|
| **String** | Plain text config | No | 4 KB (std) / 8 KB (adv) |
| **StringList** | Comma-separated values | No | 4 KB (std) / 8 KB (adv) |
| **SecureString** | Passwords, API keys | KMS encrypted | 4 KB (std) / 8 KB (adv) |

### Standard vs Advanced Tier

| Feature | Standard | Advanced |
|---------|----------|---------|
| **Cost** | Free | $0.05/param/month |
| **Max params** | 10,000 | 100,000 |
| **Max size** | 4 KB | 8 KB |
| **Parameter policies** | ❌ | ✅ (TTL, expiry notifications) |
| **Throughput** | 40 TPS (free), 1,000 TPS ($) | 1,000 TPS |

### Real Use Cases

| # | Use Case | How It Works |
|---|----------|-------------|
| 1 | **Environment Configuration** | `/app/prod/db-host`, `/app/dev/db-host`. Lambda/ECS fetch by path for env-specific config |
| 2 | **Feature Flags** | Store flags as parameters. Update without redeployment. Use `GetParametersByPath` to fetch all |
| 3 | **AMI ID Management** | `/golden-ami/latest = ami-abc123`. Auto-scaling references latest AMI parameter |
| 4 | **Secrets (Budget Option)** | SecureString type for small-scale secrets without Secrets Manager cost |

### Code Example — Fetch Config (Spring Boot)

```yaml
# application.yml - AWS Parameter Store integration
aws:
  paramstore:
    enabled: true
    prefix: /myapp
    profile-separator: /

# Parameters auto-injected:
# /myapp/prod/db-host → ${db-host}
```

```java
@Value("${db-host}")
private String dbHost;

// Or programmatic access:
SsmClient ssm = SsmClient.builder().build();
GetParametersByPathRequest req = GetParametersByPathRequest.builder()
    .path("/myapp/prod/")
    .withDecryption(true)
    .build();
List<Parameter> params = ssm.getParametersByPath(req).parameters();
```

### 🎯 Interview Questions — Parameter Store

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **Parameter Store vs Secrets Manager?** | PS: free (standard), hierarchical, config + secrets. SM: $0.40/secret, auto-rotation, purpose-built for secrets |
| 2 | **When to use which?** | Parameter Store: config values, feature flags, non-rotating secrets. Secrets Manager: DB creds needing rotation, third-party API keys |
| 3 | **SecureString encryption?** | Encrypted with KMS (default `aws/ssm` key or your CMK). Decrypted with `WithDecryption=true` |
| 4 | **How to organize parameters?** | Use hierarchy: `/{app}/{env}/{key}`. Fetch by path with `GetParametersByPath` |
| 5 | **What are parameter policies?** | Advanced tier only. Set TTL, expiry alerts (notify before secret expires), no-change alerts |

---

## 📊 Cross-Service Comparison Tables

### Secrets Manager vs Parameter Store

| Feature | Secrets Manager | Parameter Store |
|---------|-----------------|-----------------|
| **Cost** | $0.40/secret/month + API calls | Free (standard) |
| **Rotation** | Built-in (Lambda) | Manual only |
| **Max Size** | 64 KB | 4 KB (std) / 8 KB (adv) |
| **Hierarchy** | No | Yes (`/app/env/key`) |
| **Cross-Region** | Replication supported | Manual |
| **Best For** | DB passwords, API keys needing rotation | Config, feature flags, budget secrets |

### SNS vs SQS vs EventBridge

| Feature | SNS | SQS | EventBridge |
|---------|-----|-----|-------------|
| **Pattern** | Pub/Sub (push) | Queue (pull) | Event bus (push) |
| **Delivery** | Fan-out to all subscribers | One consumer per message | Rule-based routing |
| **Persistence** | No (fire & forget) | Yes (up to 14 days) | No (retry 24hr) |
| **Filtering** | Attribute-based | No | Content-based (rich) |
| **Sources** | Any (via API) | Any (via API) | 30+ AWS services + custom |
| **Best For** | Fan-out, alerts | Decoupling, buffering | Event-driven architectures |

### Lambda vs ECS vs EKS

| Feature | Lambda | ECS (Fargate) | EKS |
|---------|--------|---------------|-----|
| **Max Runtime** | 15 min | Unlimited | Unlimited |
| **Scaling** | Auto (0 to 1000s) | Auto-scaling | HPA/VPA/CA |
| **Cold Start** | Yes | Task startup ~30s | Pod startup ~seconds |
| **Cost at Zero** | $0 | $0 (scale to 0) | $73/mo (control plane) |
| **Portability** | AWS only | Docker | Multi-cloud (K8s) |
| **Best For** | Event-driven, glue | Web apps, APIs | Large platforms, multi-cloud |

---

## 🏗️ Architecture Patterns — Putting It All Together

### Pattern 1: Serverless E-Commerce

```text
  Mobile/Web
      │
      ▼
  API Gateway ──▶ Lambda (CRUD) ──▶ DynamoDB
      │                │
      │         S3 (product images)
      │
  Cognito (Auth)

  ORDER FLOW:
  Lambda → Step Functions → [Validate → Pay → Inventory → Ship → Notify]
                                                          │
                                                    SNS Topic
                                                    ├── SQS (Email)
                                                    └── SQS (Analytics)
```

### Pattern 2: Containerized Microservices

```text
  Route 53 → CloudFront → ALB
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         ECS: Users    ECS: Orders   ECS: Payments
              │             │             │
              └─────────────┼─────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
           RDS          ElastiCache     SQS → Lambda
                                        (async tasks)

  SECRETS: Secrets Manager (DB creds, auto-rotated)
  CONFIG:  Parameter Store (/app/prod/*)
  ENCRYPTION: KMS CMK for RDS, S3, SQS
```

### Pattern 3: Event-Driven Data Pipeline

```text
  Data Sources → Kinesis / S3 Upload
                        │
                   EventBridge
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
    Lambda (ETL)   Step Functions   SNS (alerts)
         │         (complex flow)
         ▼              │
    S3 (processed)      ▼
         │          Glue → Redshift
         ▼
    Athena (query)
```

---

## 🎯 Bonus: Top Cross-Service Interview Questions

| # | Question | Key Answer Points |
|---|----------|-------------------|
| 1 | **Design a notification system** | SNS topic per event type → SQS queues per channel (email, push, SMS) → Lambda consumers. DLQ for failures. KMS encryption at rest |
| 2 | **How to handle secrets in a microservice architecture?** | Secrets Manager for DB creds (auto-rotation). Parameter Store for config. Inject via ECS task definition or K8s CSI driver. Never in code/env vars in plaintext |
| 3 | **SNS + SQS fan-out vs EventBridge?** | SNS+SQS: simple fan-out, high throughput. EventBridge: content-based routing, schema discovery, 30+ AWS event sources. Use EventBridge for complex event-driven architectures |
| 4 | **Lambda vs Step Functions for orchestration?** | Single Lambda: simple tasks < 15min. Step Functions: multi-step, conditional, parallel, retries, long-running (up to 1 year) |
| 5 | **How to encrypt data at rest and in transit?** | At rest: KMS (S3 SSE-KMS, RDS encryption, EBS encryption). In transit: TLS/SSL (ALB HTTPS, API Gateway HTTPS). Application-level: envelope encryption with KMS |
| 6 | **ECS vs EKS decision criteria?** | ECS: AWS-only, simpler. EKS: multi-cloud, K8s ecosystem, team has K8s experience. Both support Fargate |
| 7 | **How to do a zero-downtime deployment?** | ECS: CodeDeploy blue-green with ALB target groups. EKS: rolling update in Deployment spec. Lambda: weighted aliases. API Gateway: canary deployments |
| 8 | **ALB vs API Gateway as entry point?** | ALB: cheaper at high volume, simple routing. API Gateway: auth, throttling, caching, WebSocket, request validation. Can use both: API GW → VPC Link → ALB |
