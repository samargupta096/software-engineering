[🏠 Home](../../../README.md) | [⬅️ CAP Theorem](./02-cap-theorem.md) | [➡️ PostgreSQL Guide](./04-postgresql-guide.md)

# 📈 Scalability Patterns

> How to design systems that handle millions of users

---

## 🎯 Quick Reference: When to Use What

| Pattern | Problem It Solves | Example |
|---------|-------------------|---------|
| **Replication** | Read bottleneck | MySQL read replicas |
| **Sharding** | Data too big for one DB | User ID-based sharding |
| **Caching** | Repeated expensive queries | Redis for sessions |
| **Async Processing** | Slow operations blocking users | Email via queue |
| **CDN** | Slow static content delivery | CloudFront for images |
| **Load Balancing** | Single server overload | Nginx round-robin |

---

## 📊 The Scaling Journey

```mermaid
flowchart TB
    subgraph Stage1["Stage 1: 1-1K Users"]
        S1_APP[Single Server]
        S1_DB[(Single DB)]
        S1_APP --> S1_DB
    end
    
    subgraph Stage2["Stage 2: 1K-100K Users"]
        S2_LB[Load Balancer]
        S2_APP1[App Server 1]
        S2_APP2[App Server 2]
        S2_CACHE[(Redis Cache)]
        S2_DB[(Master DB)]
        S2_REP[(Replica DB)]
        
        S2_LB --> S2_APP1 & S2_APP2
        S2_APP1 & S2_APP2 --> S2_CACHE --> S2_DB
        S2_DB --> S2_REP
    end
    
    subgraph Stage3["Stage 3: 100K-1M Users"]
        S3_CDN[CDN]
        S3_LB[Load Balancer]
        S3_APPS[Multiple App Servers]
        S3_CACHE[(Redis Cluster)]
        S3_SHARDS[(Sharded DBs)]
        S3_QUEUE[Message Queue]
        S3_WORKERS[Background Workers]
        
        S3_CDN --> S3_LB --> S3_APPS
        S3_APPS --> S3_CACHE --> S3_SHARDS
        S3_APPS --> S3_QUEUE --> S3_WORKERS
    end
    
    Stage1 --> Stage2 --> Stage3
```

---

## ⬆️ Vertical vs ➡️ Horizontal Scaling

### Visual Comparison

```mermaid
flowchart LR
    subgraph Vertical["⬆️ Vertical Scaling"]
        direction TB
        V1["🖥️ Small\n2 CPU, 4GB"]
        V2["🖥️ Medium\n8 CPU, 32GB"]
        V3["🖥️ Large\n64 CPU, 256GB"]
        V1 --> V2 --> V3
    end
    
    subgraph Horizontal["➡️ Horizontal Scaling"]
        direction LR
        H1["🖥️ Server 1"]
        H2["🖥️ Server 2"]
        H3["🖥️ Server 3"]
        H4["🖥️ Server N..."]
    end
```

### 📊 Detailed Comparison

| Aspect | Vertical ⬆️ | Horizontal ➡️ |
|--------|-------------|---------------|
| **How** | Bigger machine | More machines |
| **Cost curve** | 📈 Exponential | 📉 Linear |
| **Limit** | Hardware max | ♾️ Unlimited |
| **Downtime** | Required | Zero (rolling) |
| **Complexity** | 🟢 Simple | 🔴 Complex |
| **Data** | Single location | Distributed |
| **Example** | AWS m5.24xlarge | 10x m5.xlarge |

### 💰 Cost Example

```
Vertical Scaling:
  m5.xlarge (4 CPU, 16GB)  = $0.19/hour
  m5.4xlarge (16 CPU, 64GB) = $0.77/hour (4x CPU, 4x cost)
  m5.12xlarge (48 CPU, 192GB) = $2.30/hour (12x CPU, 12x cost)
  
Horizontal Scaling:
  3x m5.xlarge = $0.57/hour for 12 CPU + fault tolerance ✅
```

---

## 🔑 Pattern 1: Database Replication

### How It Works

```mermaid
flowchart TB
    subgraph Application
        APP[App Server]
    end
    
    subgraph Database["Database Cluster"]
        MASTER[(Master\n✍️ Writes)]
        R1[(Replica 1\n📖 Reads)]
        R2[(Replica 2\n📖 Reads)]
        R3[(Replica 3\n📖 Reads)]
    end
    
    APP -->|"Writes"| MASTER
    MASTER -->|"Replication"| R1 & R2 & R3
    APP -.->|"Reads"| R1 & R2 & R3
```

### Replication Patterns

| Pattern | Write | Read | Consistency | Use Case |
|---------|-------|------|-------------|----------|
| **Master-Slave** | Master only | Slaves | Strong | Most read-heavy apps |
| **Master-Master** | Any master | Any | Eventual | Multi-region |
| **Synchronous** | Wait for all | Any | Strong | Financial data |
| **Asynchronous** | Don't wait | Any | Eventual | Social media |

### ⚠️ Replication Lag Problem

```mermaid
sequenceDiagram
    participant User
    participant Master
    participant Replica
    
    User->>Master: Update profile (name = "John")
    Master-->>User: Success!
    User->>Replica: Get profile
    Note over Replica: Still has old data!
    Replica-->>User: name = "Old Name" ❌
    
    Note over Master,Replica: After replication lag...
    Master->>Replica: Replicate update
    User->>Replica: Get profile
    Replica-->>User: name = "John" ✅
```

**Solutions:**
1. Read your own writes (sticky sessions)
2. Read from master for critical data
3. Show loading state during lag window

---

## 🔑 Pattern 2: Database Sharding

### What is Sharding?

```mermaid
flowchart TB
    subgraph Before["❌ Before: Single DB Bottleneck"]
        DB1[(100M users\nSingle DB\n💀 Overloaded)]
    end
    
    subgraph After["✅ After: Sharded DB"]
        S1[(Shard 1\nUsers 1-25M)]
        S2[(Shard 2\nUsers 25-50M)]
        S3[(Shard 3\nUsers 50-75M)]
        S4[(Shard 4\nUsers 75-100M)]
    end
    
    Before --> After
```

### Sharding Strategies Comparison

```mermaid
flowchart TB
    subgraph Range["📏 Range-Based"]
        RR[User A-H → Shard 1]
        RR2[User I-P → Shard 2]
        RR3[User Q-Z → Shard 3]
    end
    
    subgraph Hash["#️⃣ Hash-Based"]
        HH["hash(user_id) % 3"]
        HH1[Result 0 → Shard 1]
        HH2[Result 1 → Shard 2]
        HH3[Result 2 → Shard 3]
    end
    
    subgraph Geo["🌍 Geographic"]
        GG1[India users → Shard India]
        GG2[US users → Shard US]
        GG3[EU users → Shard EU]
    end
```

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **Range** | Easy to implement, range queries work | Hot spots if uneven | Time-series, A-Z data |
| **Hash** | Even distribution | Range queries need all shards | User data |
| **Geographic** | Low latency per region | Cross-region queries slow | Global apps |
| **Directory** | Flexible assignment | Single point of failure | Complex routing |

### ⚠️ Sharding Challenges

```mermaid
flowchart LR
    subgraph Challenges["😰 Sharding Pain Points"]
        C1["🔗 Join across shards"]
        C2["🔄 Resharding is hard"]
        C3["💳 Transactions across shards"]
        C4["🔍 Aggregate queries"]
    end
```

| Challenge | Mitigation |
|-----------|------------|
| Joins across shards | Denormalize data, application-level joins |
| Resharding | Use consistent hashing |
| Transactions | Saga pattern, avoid cross-shard |
| Aggregations | Pre-compute, use analytics DB |

### Consistent Hashing Visualization

```mermaid
flowchart TB
    subgraph Ring["Hash Ring (0-360)"]
        direction TB
        S1["Shard 1\n(at 90°)"]
        S2["Shard 2\n(at 180°)"]
        S3["Shard 3\n(at 270°)"]
    end
    
    subgraph Keys["Key Placement"]
        K1["User A (hash=45°) → Shard 1"]
        K2["User B (hash=120°) → Shard 2"]
        K3["User C (hash=200°) → Shard 3"]
    end
```

---

## 🔑 Pattern 3: Caching Layers

### Cache Hierarchy

```mermaid
flowchart LR
    subgraph Client["👤 Client Side"]
        BC[🌐 Browser Cache]
    end
    
    subgraph Edge["🌍 Edge"]
        CDN[📡 CDN Cache]
    end
    
    subgraph Server["🖥️ Server Side"]
        GW[🚪 API Gateway Cache]
        APP[💾 Application Cache]
        REDIS[🔴 Redis/Memcached]
        DB[📊 DB Query Cache]
    end
    
    BC --> CDN --> GW --> APP --> REDIS --> DB
```

### Cache Strategies Visual

```mermaid
flowchart TB
    subgraph CacheAside["Cache-Aside (Lazy Loading)"]
        CA1[App checks cache]
        CA2{Cache hit?}
        CA3[Return data]
        CA4[Query DB]
        CA5[Update cache]
        
        CA1 --> CA2
        CA2 -->|Yes| CA3
        CA2 -->|No| CA4 --> CA5 --> CA3
    end
    
    subgraph WriteThrough["Write-Through"]
        WT1[App writes data]
        WT2[Write to cache]
        WT3[Write to DB]
        WT4[Return success]
        
        WT1 --> WT2 --> WT3 --> WT4
    end
    
    subgraph WriteBehind["Write-Behind (Write-Back)"]
        WB1[App writes data]
        WB2[Write to cache]
        WB3[Return success immediately]
        WB4[Async write to DB]
        
        WB1 --> WB2 --> WB3
        WB2 -.-> WB4
    end
```

### 📊 Strategy Comparison

| Strategy | Read Perf | Write Perf | Consistency | Use Case |
|----------|-----------|------------|-------------|----------|
| **Cache-Aside** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Read-heavy, can tolerate stale |
| **Write-Through** | ⭐⭐⭐ | ⭐ | ⭐⭐⭐ | Need consistency |
| **Write-Behind** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | Write-heavy, can lose data |
| **Read-Through** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ | Simplify app code |

### Cache Invalidation Patterns

```
"There are only two hard things in Computer Science: 
cache invalidation and naming things."
                                    - Phil Karlton
```

| Pattern | How | When to Use |
|---------|-----|-------------|
| **TTL (Time-to-Live)** | Auto-expire after X seconds | When staleness is acceptable |
| **Write-Invalidate** | Delete cache on write | Strong consistency needed |
| **Write-Update** | Update cache on write | Frequent reads after writes |
| **Event-Based** | Invalidate on event | Complex invalidation rules |

---

## 🔑 Pattern 4: Async Processing

### The Problem

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Email
    participant DB
    
    User->>API: Place Order
    API->>DB: Save Order (100ms)
    API->>Email: Send Confirmation (2000ms) ❌
    Note over User: User waiting 2100ms!
    API-->>User: Order Placed
```

### The Solution

```mermaid
sequenceDiagram
    participant User
    participant API
    participant Queue
    participant Worker
    participant Email
    participant DB
    
    User->>API: Place Order
    API->>DB: Save Order (100ms)
    API->>Queue: Queue Email (5ms)
    API-->>User: Order Placed ✅
    Note over User: User got response in 105ms!
    
    Queue->>Worker: Process Email
    Worker->>Email: Send Confirmation
```

### Message Queue Visualization

```mermaid
flowchart LR
    subgraph Producers["📤 Producers"]
        P1[Order Service]
        P2[User Service]
        P3[Payment Service]
    end
    
    subgraph Queue["📮 Message Queue"]
        Q1["📧 Email Queue"]
        Q2["📱 Push Queue"]
        Q3["📊 Analytics Queue"]
    end
    
    subgraph Consumers["📥 Consumers"]
        C1[Email Worker 1]
        C2[Email Worker 2]
        C3[Push Worker]
        C4[Analytics Worker]
    end
    
    Producers --> Queue --> Consumers
```

### 📊 Queue vs Pub/Sub

| Aspect | Queue | Pub/Sub |
|--------|-------|---------|
| **Delivery** | One consumer | All subscribers |
| **Use Case** | Task distribution | Event broadcasting |
| **Example** | Email sending | Order placed event |
| **Tools** | SQS, Celery | Kafka, SNS, Redis Pub/Sub |

---

## 🔑 Pattern 5: CQRS

### Command Query Responsibility Segregation

```mermaid
flowchart TB
    subgraph Traditional["❌ Traditional: Same Model for Read/Write"]
        T1[API] --> T2[(Single DB)]
    end
    
    subgraph CQRS["✅ CQRS: Separate Models"]
        direction TB
        
        subgraph Write["✍️ Write Side"]
            W1[Commands API]
            W2[(Write DB\nNormalized)]
        end
        
        subgraph Read["📖 Read Side"]
            R1[Queries API]
            R2[(Read DB\nDenormalized)]
        end
        
        W1 --> W2
        W2 -->|Events| SYNC[Event Bus]
        SYNC --> R2
        R1 --> R2
    end
```

### When to Use CQRS

| ✅ Use CQRS When | ❌ Avoid CQRS When |
|------------------|-------------------|
| Read and write patterns differ greatly | Simple CRUD application |
| Complex queries need optimization | Read/write patterns similar |
| High scalability required | Small team |
| Event sourcing is used | Tight budget/timeline |

---

## 🌐 Multi-Region Architecture

### Global Distribution

```mermaid
flowchart TB
    subgraph DNS["🌐 Global DNS (GeoDNS)"]
        GLB[Route users to nearest region]
    end
    
    subgraph US["🇺🇸 US Region"]
        US_LB[Load Balancer]
        US_APP[App Cluster]
        US_CACHE[(Redis)]
        US_DB[(Primary DB)]
    end
    
    subgraph EU["🇪🇺 EU Region"]
        EU_LB[Load Balancer]
        EU_APP[App Cluster]
        EU_CACHE[(Redis)]
        EU_DB[(Replica DB)]
    end
    
    subgraph ASIA["🇮🇳 Asia Region"]
        ASIA_LB[Load Balancer]
        ASIA_APP[App Cluster]
        ASIA_CACHE[(Redis)]
        ASIA_DB[(Replica DB)]
    end
    
    GLB --> US_LB & EU_LB & ASIA_LB
    
    US_DB <-->|"Cross-region\nreplication"| EU_DB & ASIA_DB
```

### Latency Impact

```
📍 Without Multi-Region (US-only):
  - US User: 50ms ✅
  - EU User: 150ms 😐
  - Asia User: 250ms ❌

📍 With Multi-Region:
  - US User: 50ms ✅
  - EU User: 50ms ✅
  - Asia User: 50ms ✅
```

---

## 📏 Capacity Planning

### Formula

```
Required Servers = (Peak RPS × Latency in sec) / Concurrent Connections per Server
```

### 📊 Example Calculation

```mermaid
flowchart LR
    subgraph Input["📥 Inputs"]
        I1["Peak: 100,000 RPS"]
        I2["Latency: 200ms"]
        I3["Connections/server: 10,000"]
    end
    
    subgraph Calc["🔢 Calculation"]
        C1["100,000 × 0.2 = 20,000"]
        C2["20,000 / 10,000 = 2"]
    end
    
    subgraph Output["📤 Result"]
        O1["Base: 2 servers"]
        O2["+50% buffer: 3 servers"]
        O3["+Redundancy: 6 servers"]
    end
    
    Input --> Calc --> Output
```

---

## 📚 Summary Cheat Sheet

```
┌────────────────────────────────────────────────────────────────┐
│                    SCALABILITY CHEAT SHEET                      │
├────────────────────────────────────────────────────────────────┤
│ Stage 1 (1-1K users):                                          │
│   → Single server, single DB                                   │
│                                                                 │
│ Stage 2 (1K-100K users):                                       │
│   → Load balancer + multiple app servers                       │
│   → Add caching (Redis)                                        │
│   → Add read replicas                                          │
│                                                                 │
│ Stage 3 (100K-1M users):                                       │
│   → CDN for static content                                     │
│   → Message queues for async                                   │
│   → Database sharding                                          │
│   → Microservices                                              │
│                                                                 │
│ Stage 4 (1M+ users):                                           │
│   → Multi-region deployment                                    │
│   → CQRS for complex queries                                   │
│   → Event-driven architecture                                  │
└────────────────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

| Lesson | Remember |
|--------|----------|
| Start simple | Don't over-engineer from day 1 |
| Scale when needed | Measure first, then optimize |
| Cache everything | Redis is your friend |
| Go async | Don't block users |
| Replicate before sharding | Sharding is hard |

---

*Start simple, scale as needed!* 🚀
