# 🚀 Last Minute Revision — Interview Quick Reference

> Bite-sized, interview-ready notes organized by topic. Each section is self-contained for rapid revision.

---

## 📖 Table of Contents

| # | Topic Group | Key Areas |
|---|-------------|-----------|
| **A** | [Core Java](#-a--core-java) | HashMap, Enums, GC, Keywords, Records, Pattern Matching, Singleton |
| **B** | [Testing](#-b--testing) | Mockito, PowerMockito |
| **C** | [Spring Boot](#-c--spring-boot) | @Transactional, @Async, Security, JWT |
| **D** | [Distributed Systems & Messaging](#-d--distributed-systems--messaging) | Kafka, Schema Registry, Saga Pattern, Consistent Hashing |
| **E** | [AWS Services](#-e--aws-services) | Lambda, SQS, DynamoDB, RDS, S3, ECS/EKS, Load Balancers, CloudWatch |
| **F** | [Kubernetes & Container Orchestration](#-f--kubernetes--container-orchestration) | Architecture, Objects, Helm, Service Mesh |
| **G** | [DevOps & CI/CD](#-g--devops--cicd) | Git, Argo CD, JFrog, Deployment Strategies |
| **H** | [Networking & Security](#-h--networking--security) | SSL Termination, Istio, mTLS |
| **I** | [AWS Troubleshooting Scenarios](#-i--aws-troubleshooting-scenarios-20-real-world-problems) | 20 Production Debugging Questions |
| **J** | [Databases & Caching](#-j--databases--caching) | Redis as DB, Cache, Broker |
| **K** | [Design Patterns](#-k--design-patterns) | Observer Pattern |

---
---

# ☕ A — Core Java

## HashMap Internals

HashMap stores key-value pairs in an **array of buckets**:

1. Index is calculated using `hashCode()` and **bitwise AND**.
2. Collisions are stored in a **linked list**.
3. When a bucket's list exceeds **8 entries**, it converts to a **Red-Black Tree** → O(log n) lookups.
4. The array **resizes** when `size > capacity × load factor` (default load factor = **0.75**).

---

## Enum

Enums in Java are **full classes**, not simple constants:

- Can contain **fields, methods, and behavior**.
- Provide **type safety** — prevent invalid values at compile time.
- Common uses: status values, roles, event types, strategy-pattern implementations.

---

## Garbage Collection (GC)

- **GC Roots** are starting points (stack variables, static fields) used to determine object reachability.
- **Minor GC** cleans the **Young Generation**; **Major GC** cleans the **Old Generation**.
- Object lifecycle: **Eden → Survivor → Old** (based on lifespan / age threshold).
- **G1** is the default GC in Java 11+ — balanced throughput and pause times.
- **ZGC** is preferred for low-latency, large-heap systems.
- GC tuning involves configuring heap size (`-Xms`, `-Xmx`) and pause-time goals.

---

## Java Keywords

| Keyword | Purpose | Key Detail |
|---------|---------|------------|
| `volatile` | Ensures **visibility** of changes across threads | Does **not** provide mutual exclusion or atomicity |
| `transient` | Prevents a field from being **serialized** | Ignored during `ObjectOutputStream` |
| `synchronized` | Ensures **mutual exclusion** — one thread at a time | Also guarantees visibility |
| `final` | Prevents **modification** (variable / method / class) | Makes references immutable, not objects |
| `static` | Makes a member **class-level** (shared across instances) | — |
| `abstract` | Defines **incomplete behavior** for subclass inheritance | Cannot be instantiated directly |

---

## Modern Java Features (14+)

- **Pattern Matching** — reduces casting boilerplate (`instanceof` with variable binding).
- **Sealed Classes** — restrict inheritance to a declared set of subclasses; improves domain modeling.
- **Records** — concise, immutable data carriers with auto-generated `equals`, `hashCode`, `toString`.

> Together, these features enable safer, more expressive, and maintainable OO design.

---

## Singleton Pattern

Multiple implementations exist:

| Approach | Thread-Safe | Serialization-Safe | Reflection-Safe |
|----------|:-----------:|:-------------------:|:---------------:|
| Eager initialization | ✅ | ❌ | ❌ |
| Lazy initialization | ❌ | ❌ | ❌ |
| Synchronized method | ✅ | ❌ | ❌ |
| Double-checked locking | ✅ | ❌ | ❌ |
| Bill Pugh (inner class) | ✅ | ❌ | ❌ |
| **Enum-based** | ✅ | ✅ | ✅ |

> **Best practice**: Use **enum-based Singleton** — it is thread-safe, serialization-safe, and protected against reflection attacks.

---
---

# 🧪 B — Testing

## Mockito & PowerMockito

- **Mockito** — standard Java mocking framework for unit tests. Mocks dependencies and verifies interactions.
- **PowerMockito** — extends Mockito to mock `static`, `private`, and `final` methods using bytecode manipulation.
  - **Discouraged** in modern development — fragile, slow, and couples tests to implementation details.
  - Recent Mockito versions (3.4+) support **static mocking** natively, making PowerMockito rarely needed.

---
---

# 🌱 C — Spring Boot

## @Transactional & @Async

| Annotation | Mechanism | Key Detail |
|------------|-----------|------------|
| `@Transactional` | AOP proxy + `ThreadLocal` | Manages DB transactions; context is **thread-bound** |
| `@Async` | Executes in separate thread via `TaskExecutor` | Runs on a **different thread** |

> ⚠️ **Gotcha**: Since transactions are stored in `ThreadLocal`, they do **not** propagate to `@Async` methods. Combining both leads to unexpected behavior — the async method runs **without** a transaction.

---

## JWT Authentication

| Token | Storage | Purpose |
|-------|---------|---------|
| **Access Token** | Not stored in DB | Self-contained; validated via digital signature. Short-lived. |
| **Refresh Token** | Stored in DB | Enables revocation, rotation, and session control. Long-lived. |

---

## Securing an API (Spring Security)

1. Use **Spring Security** with **stateless JWT** authentication.
2. A custom **JWT filter** validates the token on each request and sets the `SecurityContext`.
3. **Role-based authorization** at URL or method level.
4. **Production hardening**: disable sessions, enforce HTTPS, use short-lived access tokens, manage refresh tokens securely.

---
---

# 📡 D — Distributed Systems & Messaging

## Consistent Hashing

Distributes keys across nodes using a **hash ring**. When nodes are added or removed, only a **small subset** of keys need to move.

- **Virtual nodes** ensure even load distribution.
- Commonly used in: distributed caches, **Cassandra**, **DynamoDB (Dynamo)**.

> Improves scalability and reduces rebalancing overhead compared to naive `hash % N` approaches.

---

## Message Queue vs Pub/Sub

| Pattern | Semantics | Kafka Equivalent |
|---------|-----------|-----------------|
| **Message Queue** | Each message processed by **one** worker | Single consumer group |
| **Pub/Sub** | Events broadcast to **multiple** consumers | Multiple consumer groups |

> Kafka supports **both** patterns, making it ideal for job processing and event-driven architectures.

---

## Kafka Schema Registry

A centralized service that manages and validates message schemas for Kafka topics:

1. **Producer** sends schema to the Registry → Registry assigns an **ID** (if new).
2. **Producer** serializes the message with the **schema ID** (not the full schema).
3. **Consumer** reads the schema ID → fetches the schema from the Registry → deserializes safely.

> Ensures **schema compatibility** and safe evolution, preventing breaking changes between producers and consumers.

---

## Saga Pattern

Manages distributed transactions across microservices using a sequence of **local transactions** with **compensating actions**:

| Approach | Control | Communication | Best For |
|----------|---------|---------------|----------|
| **Orchestration** | Central controller | Commands | Complex flows |
| **Choreography** | Decentralized | Events | Simple flows |

> Ensures **eventual consistency** without distributed two-phase commit (2PC).

---
---

# ☁️ E — AWS Services

## Core Services Used in Practice

| Service | Use Case |
|---------|----------|
| **SQS** | Decoupled asynchronous processing |
| **SNS** | Fan-out messaging to multiple subscribers |
| **S3** | File storage with presigned URLs for secure access |
| **Secrets Manager** | Credential storage with automatic rotation |
| **Parameter Store** | Configuration management (non-secret values) |
| **ALB** | Path-based routing for microservices (ECS/EKS) |

---

## AWS Lambda

- **Serverless compute**: executes code in response to events, auto-scales on demand.
- Best for: event-driven workloads, async processing, lightweight APIs.
- ⚠️ **Java cold starts** can be slow — mitigate with **provisioned concurrency** or optimized runtimes (GraalVM, SnapStart).

---

## Lambda + RDS Problem

| Issue | Detail |
|-------|--------|
| **Problem** | Lambda scales per request → potentially thousands of concurrent DB connections. RDS has a fixed connection limit. |
| **Symptom** | Connection exhaustion → failures under load |
| **Solutions** | **RDS Proxy** (connection pooling), limit Lambda concurrency, or switch to **DynamoDB** for fully serverless scaling |

> **RDS Proxy** decouples Lambda concurrency from database connection limits by managing connection pooling centrally.

---

## DynamoDB

- **Partition key** determines data distribution — must have **high cardinality** to avoid hot partitions.
- **Sort key** allows multiple items under the same partition key and enables **range queries**.
- **GSI** (Global Secondary Index) — query using different keys.
- **LSI** (Local Secondary Index) — alternate sort keys for the same partition key.
- **Single Table Design** — stores multiple entity types in one table, optimized by **access patterns** instead of relational joins.

---

## SQS Visibility Timeout

The duration for which a message remains **invisible** to other consumers after being received:

- Prevents **duplicate processing** while allowing retry on consumer failure.
- If the message is **not deleted** before the timeout expires, it becomes visible again for reprocessing.

---

## Load Balancers

| Type | Layer | Best For |
|------|-------|----------|
| **ALB** (Application) | Layer 7 | Microservices, HTTP routing, path/host-based rules |
| **NLB** (Network) | Layer 4 | High-performance TCP/UDP workloads |
| **GLB** (Gateway) | Layer 3 | Security appliances (firewalls, IDS) |
| **CLB** (Classic) | Legacy | Avoid — use ALB or NLB instead |

### Target Groups

A **Target Group** is a logical grouping of backend resources (EC2 instances, IPs, or Lambda functions) that receive traffic from a Load Balancer. It performs **health checks** and enables routing strategies like blue-green and canary.

---

## ECS & EKS

| Service | What It Is |
|---------|------------|
| **ECS** | AWS container orchestration — runs Docker containers on EC2 or **Fargate** |
| **EKS** | AWS managed **Kubernetes** — full K8s capabilities with AWS-managed control plane |
| **CloudWatch** | Monitoring service for logs, metrics, and alarms across ECS, EKS, Lambda, etc. |

---
---

# ⚙️ F — Kubernetes & Container Orchestration

## Architecture

| Component | Role |
|-----------|------|
| **API Server** | Front-end of the control plane; handles all REST requests |
| **Scheduler** | Assigns pods to nodes |
| **Controller Manager** | Runs reconciliation loops (Deployment, ReplicaSet, etc.) |
| **etcd** | Distributed key-value store for cluster state |
| **kubelet** | Agent on each worker node; manages containers |
| **Container Runtime** | Runs containers (containerd, CRI-O) |
| **kube-proxy** | Handles networking and service routing |

> Kubernetes follows a **reconciliation model** — it continuously ensures the desired state matches the actual cluster state.

## Key Objects

| Object | Purpose |
|--------|---------|
| **Pod** | Runs container(s) |
| **Deployment** | Manages stateless pods and rolling updates |
| **Service** | Exposes pods via stable networking |
| **Ingress** | HTTP routing to services |
| **ConfigMap** | Application configuration |
| **Secret** | Sensitive configuration |
| **StatefulSet** | Stateful applications (with stable identity) |
| **DaemonSet** | Node-level agents (logging, monitoring) |
| **Job** | One-time task |

## Helm

A **package manager** for Kubernetes that templates manifests and simplifies deployment across environments (dev, staging, prod).

---

## Service Mesh

An **infrastructure layer** that manages service-to-service communication in microservices using **sidecar proxies**. Provides:

- **Traffic management** — routing, retries, load balancing
- **mTLS security** — mutual TLS between services
- **Observability** — distributed tracing, metrics
- **Fault injection** — chaos testing without code changes

### Istio

A popular service mesh for Kubernetes that uses **Envoy sidecar proxies**. Provides all the above capabilities without modifying application code.

---
---

# 🔧 G — DevOps & CI/CD

## Git — Force Push After Rebase

After a rebase, **commit hashes change** because Git rewrites history. The local branch no longer matches the remote, so Git rejects a normal push.

- Use `git push --force-with-lease` to safely overwrite remote history.
- `--force-with-lease` ensures you don't accidentally overwrite someone else's work.

---

## Argo CD

A **GitOps** continuous delivery tool for Kubernetes:

1. **Polls** the Git repo periodically (or receives **webhook** notifications).
2. Fetches the latest commit and compares **desired manifests** vs **live cluster state**.
3. If mismatched → marks the app **OutOfSync**.
4. Optionally **auto-syncs** to restore the desired state.

---

## JFrog Artifactory

A **universal artifact repository manager** for storing and managing build artifacts (JARs, Docker images, etc.):

- Centralizes dependency management.
- Supports **snapshot** and **release** repositories.
- Integrates with CI/CD pipelines for reproducible and secure builds.

---

## Deployment Strategies

| Strategy | Description | Risk |
|----------|-------------|------|
| **Rolling** | Gradually updates instances; zero downtime | Moderate — mixed versions briefly |
| **Blue-Green** | Two identical environments; instant traffic switch | Low — instant rollback |
| **Canary** | Exposes a small % of users to the new version | Lowest — controlled blast radius |
| **Feature Flags** | Runtime toggle of features without redeployment | Lowest — granular control |

---
---

# 🔐 H — Networking & Security

## SSL Termination

The process of **decrypting HTTPS traffic** at a load balancer or proxy instead of the application server:

```text
Client → HTTPS → Load Balancer (decrypt) → HTTP → Service
```

**Benefits**:
- Reduces CPU load on application servers
- Simplifies certificate management (single point)
- Enables centralized security policies
- Improves overall performance

---
---

# 🔥 I — AWS Troubleshooting Scenarios (20 Real-World Problems)

> Senior-level AWS scenario questions commonly asked in interviews. Each covers a production failure and its root cause.

---

### 1. API Gateway + Lambda Returns 502

**Possible causes**: Lambda timeout, memory exhaustion, incorrect IAM role, VPC misconfiguration (no NAT Gateway).

> 💡 If Lambda is inside a VPC and needs internet access, it **must** have a NAT Gateway configured.

---

### 2. SQS Messages Keep Reappearing

**Possible causes**: Consumer didn't delete the message, visibility timeout too short, processing takes longer than the timeout.

> 💡 **Fix**: Increase the visibility timeout or explicitly delete the message after successful processing.

---

### 3. DynamoDB Throttling Under Load

**Possible causes**: Hot partition (bad partition key), low provisioned capacity, poor key distribution.

> 💡 **Fix**: Improve partition key cardinality, switch to on-demand mode, add GSIs carefully.

---

### 4. ECS Tasks Keep Restarting

**Possible causes**: Failing health checks, out of memory (OOM kill), container crash, ALB health check path misconfigured.

---

### 5. ALB Returns 504 Gateway Timeout

**Possible causes**: Backend not responding, security group blocking traffic, target group unhealthy, app timeout exceeds ALB idle timeout (default 60s).

---

### 6. Unexpected High Lambda Cost

**Possible causes**: Infinite recursion, SQS retry loop, large memory allocation, excessive invocations due to event storm.

---

### 7. RDS CPU at 100%

**Possible causes**: Missing indexes, too many open connections, slow queries, no read replicas for read-heavy workloads.

---

### 8. SNS → SQS → Lambda Processing Duplicates

**Possible causes**: At-least-once delivery semantics, Lambda retries on failure, consumer logic is not idempotent.

> 💡 **Fix**: Implement **idempotent consumers** — use a unique message ID to deduplicate.

---

### 9. S3 Public Data Leak

**Possible causes**: Public bucket policy, object ACL set to open, **Block Public Access** not enabled.

> 💡 **Fix**: Enable **S3 Block Public Access** at the account level.

---

### 10. EKS Pods in CrashLoopBackOff

**Possible causes**: Bad configuration, missing secrets/configmaps, wrong liveness/readiness probes, insufficient CPU/memory resources.

---

### 11. CloudWatch Logs Missing

**Possible causes**: IAM role missing `logs:CreateLogGroup` / `logs:PutLogEvents` permissions, log group not created, Lambda timing out before log flush.

---

### 12. High API Latency in Production

**Investigate**: ALB latency metrics, Lambda cold starts, RDS slow queries, network latency (cross-AZ), auto-scaling lag.

---

### 13. Auto Scaling Not Triggering

**Possible causes**: Wrong metric selected, cooldown period too long, no CloudWatch alarm configured, target tracking misconfigured.

---

### 14. Secrets Manager Rotation Failing

**Possible causes**: Lambda rotation function error, missing IAM permissions, incorrect DB credentials in the rotation logic.

---

### 15. Kafka on EC2 Losing Messages

**Possible causes**: `replication.factor=1`, `acks=1` (not `all`), unclean leader election enabled.

> 💡 **Fix**: Set `replication.factor ≥ 3`, `acks=all`, `unclean.leader.election.enable=false`.

---

### 16. Multi-AZ RDS Still Has Downtime

Multi-AZ ensures **high availability**, not **zero downtime**. Failover still takes approximately **30–60 seconds** for DNS propagation and connection re-establishment.

---

### 17. High DynamoDB Cost

**Possible causes**: Using `Scan` instead of `Query`, too many GSIs (each is a full table copy), provisioned capacity set too high.

---

### 18. API Gateway Rate Limiting

**How to implement**: Usage plans + API keys, throttling settings (rate + burst), WAF integration for advanced rules.

---

### 19. Lambda in VPC Very Slow

**Possible causes**: ENI attachment delay (cold start), VPC cold starts are slower than non-VPC, NAT Gateway overhead for internet access.

> 💡 **Fix**: Use **VPC endpoints** for AWS service calls. Consider **Lambda SnapStart** or provisioned concurrency.

---

### 20. Designing High Availability in AWS

**Key pillars**: Multi-AZ deployment, auto scaling groups, load balancers, stateless services, health checks, backup and disaster recovery strategy.

---

## 🎯 Senior-Level Pattern

Most AWS production failures relate to:

| Category | Examples |
|----------|---------|
| **Scaling mismatch** | Lambda + RDS, auto-scaling lag |
| **Networking misconfig** | Security groups, NAT, VPC routing |
| **IAM misconfig** | Missing permissions, overly broad policies |
| **Concurrency spikes** | Connection exhaustion, throttling |
| **Improper retry handling** | SQS retry storms, duplicate processing |
| **Lack of idempotency** | Duplicate Lambda invocations |

> **30-Second Summary**: In AWS production systems, most real-world issues stem from concurrency scaling, misconfigured networking, improper IAM roles, or lack of resilience patterns like retries, idempotency, and circuit breakers.


# 🗄️ J — Databases & Caching

## Redis Use Cases in Spring Boot

Redis is a distributed in-memory datastore with persistence, rich data structures, pub/sub, and clustering — ideal for microservices. Consider Ehcache for local caching and Redis for shared distributed caching.

### 1️⃣ Redis as a Database (Primary Store)
👉 Redis stores application data directly. Avoid using as the *only* database in enterprise systems.

- **Use Cases**: User sessions, shopping carts, leaderboards, feature flags, real-time counters, rate limiting state.
- **Spring Boot Support**: `spring-data-redis` using `@RedisHash`.
- **Pros**: Ultra fast, flexible schema, simple scaling.
- **Cons**: Not ideal for relational queries, limited transactions, memory cost, durability weaker than RDBMS.

### 2️⃣ Redis as a Cache (Most Common)
👉 The primary usage in microservices. 

- **Pattern**: `DB → Redis cache → Application` (Cache aside, Write through, Write behind).
- **Spring Boot Config**: Enable caching using `@EnableCaching`, configure Redis as the cache provider, use annotations like `@Cacheable`, `@CachePut`, and `@CacheEvict`. Configure TTL and JSON serialization for production.
- **Pros**: Reduces DB load, faster responses, horizontal scaling, shared across instances.

### 3️⃣ Redis as a Message Broker
👉 Lightweight messaging via Pub/Sub or Streams.

| Option | Use When | Limitations / Pros |
|--------|----------|--------------------|
| **Pub/Sub** (Simple) | Notifications, real-time updates | ❌ No persistence, message loss possible, no replay |
| **Streams** (Modern) | Event processing, reliable delivery | ✅ Consumer groups, reliable delivery (Better alternative to Pub/Sub) |

> ⚠️ **When NOT to use Redis for messaging**: Avoid if you need exactly-once delivery, long retention, event replay, or high durability. Use **Kafka** instead.

---
---

# 🎨 K — Design Patterns

## Observer Pattern

Defines a **one-to-many relationship** where dependent objects (Observers) are automatically notified when the state of one object (Subject) changes.
Also known as **Publish–Subscribe** or **Event Listener** pattern.

- **Real-World Examples**: Stock price updates, Kafka consumers, UI event listeners, Spring Application Events.
- **Microservices Example**: Order Service publishes `OrderCreated` event. Payment, Notification, and Inventory services (Observers) listen and react.

### Pros & Cons
| ✅ Pros | ❌ Cons |
|---------|---------|
| Loose coupling | Too many notifications |
| Easy to add subscribers | Memory leaks if observers not removed |
| Event-driven design | Hard to debug chained events |
| Scalable | |

### General Structure

```text
Subject (Publisher)
   ↓ notify
Observer1
Observer2
Observer3
```

### Implementation in Spring Boot
Spring Boot makes the Observer pattern simple with its built-in event mechanism.

**Publisher:**
```java
applicationEventPublisher.publishEvent(new OrderCreatedEvent());
```

**Listener:**
```java
@EventListener
public void handle(OrderCreatedEvent event) { }
```

> **Senior Insight**: The Observer pattern is the architectural foundation for Event-Driven Architectures, Reactive Systems, Kafka Messaging, CQRS, and Domain Events. Use it whenever a state change requires downstream notification with loose coupling.
