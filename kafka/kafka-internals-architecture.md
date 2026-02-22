# Kafka Internals, Architecture & Best Practices

> 🔧 **Level: Advanced** | ⏱️ **Reading Time: 60 min** | 🔗 **[← Learning Hub](./kafka-deep-dive.md)** | **[← Fundamentals](./kafka-fundamentals.md)**

---

## 🗺️ Quick Navigation

| Section | What You'll Learn |
|---------|-------------------|
| [Internal Architecture](#internal-architecture) | Broker internals, Log structure |
| [Replication](#replication-deep-dive) | ISR, Leader election, Failover |
| [Storage Engine](#storage-engine) | Log segments, Compaction, Retention |
| [Performance](#performance-optimization) | Batching, Compression, Zero-copy |
| [Kafka Ecosystem](#kafka-ecosystem) | Connect, Streams, ksqlDB |
| [Best Practices](#best-practices) | Production deployment checklist |

> [!IMPORTANT]
> **Prerequisites:** Understanding of [Kafka basics](./kafka-fundamentals.md) is strongly recommended before diving into internals.

---

## Internal Architecture

### Broker Architecture

```mermaid
graph TB
    subgraph Broker["Kafka Broker"]
        subgraph Network["Network Layer"]
            Acceptor["Acceptor Thread"]
            Processors["Processor Threads"]
            RequestQueue["Request Queue"]
        end
        
        subgraph Core["Core"]
            Controller["Controller"]
            ReplicaMgr["Replica Manager"]
            LogMgr["Log Manager"]
            GroupCoord["Group Coordinator"]
        end
        
        subgraph Storage["Storage"]
            Logs["Log Segments"]
            Index["Index Files"]
            TimeIdx["Time Index"]
        end
    end
    
    Acceptor --> Processors
    Processors --> RequestQueue
    RequestQueue --> Core
    LogMgr --> Storage
    
    style Network fill:#E3F2FD
    style Core fill:#FFF3E0
    style Storage fill:#E8F5E9
```

### Request Processing Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Acceptor
    participant P as Processor
    participant H as Handler
    participant L as Log Manager
    
    C->>A: Connection
    A->>P: Assign to Processor
    P->>P: Read Request
    P->>H: Handle Request
    H->>L: Write/Read Log
    L-->>H: Response
    H-->>P: Response
    P-->>C: Send Response
```

### Log Structure (Per Partition)

```mermaid
graph LR
    subgraph Partition["Partition 0"]
        subgraph Seg1["Segment 0 (Closed)"]
            Log1[".log"]
            Idx1[".index"]
            Time1[".timeindex"]
        end
        
        subgraph Seg2["Segment 1 (Closed)"]
            Log2[".log"]
            Idx2[".index"]
            Time2[".timeindex"]
        end
        
        subgraph Seg3["Segment 2 (Active)"]
            Log3[".log"]
            Idx3[".index"]
            Time3[".timeindex"]
        end
    end
    
    Seg1 --> Seg2 --> Seg3
    
    style Seg3 fill:#4CAF50,color:white
```

**File Types:**
- `.log` - Actual message data
- `.index` - Offset → file position mapping
- `.timeindex` - Timestamp → offset mapping

---

## Replication Deep Dive

### Replication Model

```mermaid
graph TB
    subgraph Topic["Topic: orders, Partition 0"]
        subgraph B1["Broker 1"]
            Leader["Leader Replica"]
        end
        
        subgraph B2["Broker 2"]
            Follower1["Follower (ISR)"]
        end
        
        subgraph B3["Broker 3"]
            Follower2["Follower (ISR)"]
        end
    end
    
    Producer["Producer"] --> Leader
    Leader --> Consumer["Consumer"]
    
    Leader -.->|"Fetch"| Follower1
    Leader -.->|"Fetch"| Follower2
    
    style Leader fill:#4CAF50,color:white
    style Follower1 fill:#2196F3,color:white
    style Follower2 fill:#2196F3,color:white
```

### ISR (In-Sync Replicas) Mechanics

```mermaid
stateDiagram-v2
    [*] --> InSync: Follower caught up
    
    InSync --> OutOfSync: Lag > replica.lag.time.max.ms
    OutOfSync --> InSync: Caught up with leader
    
    InSync --> [*]: Broker failure
    OutOfSync --> [*]: Broker failure
    
    note right of InSync
        Eligible for leader election
        Counted for min.insync.replicas
    end note
    
    note right of OutOfSync
        Not eligible for leader
        Catching up...
    end note
```

### High Watermark & Log End Offset

```mermaid
graph LR
    subgraph LeaderLog["Leader Log"]
        L0["0"] --> L1["1"] --> L2["2"] --> L3["3"] --> L4["4"] --> L5["5"]
    end
    
    LEO["Log End Offset: 5"]
    HW["High Watermark: 3"]
    
    L5 -.-> LEO
    L3 -.-> HW
    
    style L0 fill:#4CAF50,color:white
    style L1 fill:#4CAF50,color:white
    style L2 fill:#4CAF50,color:white
    style L3 fill:#4CAF50,color:white
    style L4 fill:#FFC107
    style L5 fill:#FFC107
```

> 📌 **High Watermark** = Last offset replicated to ALL ISR replicas (safe to expose to consumers)

### Leader Election

```mermaid
sequenceDiagram
    participant ZK as Zookeeper/KRaft
    participant C as Controller
    participant B1 as Broker 1 (Leader)
    participant B2 as Broker 2 (ISR)
    participant B3 as Broker 3 (ISR)
    
    B1-xB1: Leader Fails
    ZK->>C: Leader down detected
    C->>C: Select new leader from ISR
    C->>B2: You are the new leader
    B2->>B2: Become leader
    C->>B3: Update metadata
    C->>Clients: Metadata refresh
```

---

## Storage Engine

### Log Compaction

```mermaid
graph TB
    subgraph Before["Before Compaction"]
        K1A["key1: A"]
        K2A["key2: X"]
        K1B["key1: B"]
        K3A["key3: Y"]
        K1C["key1: C"]
        K2B["key2: Z"]
    end
    
    Compact["🗜️ Log Compaction"]
    
    subgraph After["After Compaction"]
        K3F["key3: Y"]
        K1F["key1: C"]
        K2F["key2: Z"]
    end
    
    Before --> Compact --> After
    
    style Compact fill:#FF6B35,color:white
```

**Compaction keeps:** Latest value per key (like a changelog)

### Retention Policies

```mermaid
flowchart TD
    Policy["Retention Policy"]
    
    Policy --> Time["Time-based"]
    Policy --> Size["Size-based"]
    Policy --> Compact["Compaction"]
    
    Time --> TimeConfig["retention.ms = 7 days"]
    Size --> SizeConfig["retention.bytes = 100GB"]
    Compact --> CompactConfig["cleanup.policy = compact"]
    
    style Time fill:#2196F3,color:white
    style Size fill:#4CAF50,color:white
    style Compact fill:#9C27B0,color:white
```

---

## Performance Optimization

### Zero-Copy Transfer

```mermaid
graph LR
    subgraph Traditional["Traditional I/O"]
        Disk1["Disk"] -->|1| Kernel1["Kernel Buffer"]
        Kernel1 -->|2| User1["User Space"]
        User1 -->|3| Kernel2["Socket Buffer"]
        Kernel2 -->|4| NIC1["Network"]
    end
    
    subgraph ZeroCopy["Zero-Copy (sendfile)"]
        Disk2["Disk"] -->|1| Kernel3["Kernel Buffer"]
        Kernel3 -->|2| NIC2["Network"]
    end
    
    style ZeroCopy fill:#4CAF50,color:white
```

### Batching & Compression

```mermaid
graph TB
    subgraph Producer["Producer Side"]
        Msg1["Msg 1"]
        Msg2["Msg 2"]
        Msg3["Msg 3"]
        
        Batch["Batch (linger.ms)"]
        Compress["Compress (gzip/snappy/lz4/zstd)"]
    end
    
    Msg1 --> Batch
    Msg2 --> Batch
    Msg3 --> Batch
    Batch --> Compress
    Compress --> Network["Network (single request)"]
    
    style Compress fill:#FF9800,color:white
```

### Performance Tuning Parameters

| Parameter | Default | Tuning |
|-----------|---------|--------|
| `batch.size` | 16KB | Increase for throughput |
| `linger.ms` | 0 | Set 5-100ms for batching |
| `compression.type` | none | lz4 (balanced), zstd (best ratio) |
| `buffer.memory` | 32MB | Increase for high throughput |
| `fetch.min.bytes` | 1 | Increase to reduce requests |
| `num.io.threads` | 8 | Match to disk count |
| `num.network.threads` | 3 | Match to CPU cores |

---

## Kafka Ecosystem

```mermaid
graph TB
    subgraph Core["Core Kafka"]
        Brokers["Kafka Brokers"]
    end
    
    subgraph Ecosystem["Ecosystem"]
        Connect["Kafka Connect"]
        Streams["Kafka Streams"]
        KSQL["ksqlDB"]
        SR["Schema Registry"]
    end
    
    subgraph External["External Systems"]
        DB["Databases"]
        S3["Cloud Storage"]
        ES["Elasticsearch"]
    end
    
    Connect --> Brokers
    Streams --> Brokers
    KSQL --> Brokers
    
    DB <--> Connect
    S3 <--> Connect
    ES <--> Connect
    
    style Core fill:#FF6B35,color:white
    style Ecosystem fill:#2196F3,color:white
```

### Kafka Connect

```mermaid
graph LR
    subgraph Sources["Source Connectors"]
        MySQL["MySQL CDC"]
        Files["File Source"]
        API["REST API"]
    end
    
    subgraph Kafka["Kafka Topics"]
        Topics["Topics"]
    end
    
    subgraph Sinks["Sink Connectors"]
        ES["Elasticsearch"]
        HDFS["HDFS"]
        S3["S3"]
    end
    
    Sources --> Topics --> Sinks
```

### Kafka Streams

```mermaid
graph LR
    Input["Input Topic"] --> |"KStream"| Process["Processing"]
    Process --> |"filter, map, join"| Aggregate["Aggregation"]
    Aggregate --> |"KTable"| Output["Output Topic"]
    
    style Process fill:#4CAF50,color:white
    style Aggregate fill:#2196F3,color:white
```

---

## Best Practices

### Production Checklist

| Category | Recommendation |
|----------|----------------|
| **Replication** | `replication.factor >= 3` |
| **ISR** | `min.insync.replicas = 2` |
| **Durability** | Producer: `acks = all` |
| **Partitions** | Start with `num.partitions >= broker count` |
| **Retention** | Set based on use case (don't over-retain) |
| **Monitoring** | Under-replicated partitions, Consumer lag |
| **Security** | TLS + SASL authentication |

### Partition Count Guidelines

```mermaid
flowchart TD
    Start["How many partitions?"]
    
    Start --> Throughput["Calculate: Target Throughput / Partition Throughput"]
    Throughput --> Consumers["Ensure: Partitions >= Max Consumers"]
    Consumers --> Overhead["Consider: More partitions = More overhead"]
    
    Overhead --> Rule["Rule of thumb: 10-100 partitions per topic"]
    
    style Rule fill:#4CAF50,color:white
```

### Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Too many partitions | Start small, scale up |
| Consumer group rebalance storms | Use sticky assignor, increase session timeout |
| Uneven partition distribution | Use key-based partitioning carefully |
| Consumer lag growing | Scale consumers, optimize processing |
| Memory issues | Tune batch.size, buffer.memory |

---

## Monitoring Metrics

### Key Metrics to Watch

```mermaid
graph TB
    subgraph Broker["Broker Metrics"]
        URP["Under-replicated Partitions"]
        ISRShrink["ISR Shrink Rate"]
        NetworkIO["Network I/O"]
        DiskUsage["Disk Usage"]
    end
    
    subgraph Producer["Producer Metrics"]
        RecordSend["Record Send Rate"]
        RecordError["Record Error Rate"]
        Latency["Request Latency"]
    end
    
    subgraph Consumer["Consumer Metrics"]
        Lag["Consumer Lag"]
        FetchRate["Fetch Rate"]
        CommitRate["Commit Rate"]
    end
    
    style URP fill:#f44336,color:white
    style Lag fill:#f44336,color:white
```

---

## Summary

| Component | Key Insight |
|-----------|-------------|
| **Broker** | Request handling → Log Manager → Storage |
| **Replication** | ISR model, High Watermark for consistency |
| **Storage** | Append-only logs, segment files, indexes |
| **Performance** | Zero-copy, batching, compression |
| **Ecosystem** | Connect for integration, Streams for processing |

---

**Back to:** [📘 Kafka Fundamentals](./kafka-fundamentals.md) | [🚀 Learning Hub](./kafka-deep-dive.md)

---

## 📚 Resources

- [Kafka Architecture Deep Dive](https://developer.confluent.io/learn-kafka/)
- [Kafka Internals](https://kafka.apache.org/documentation/#design)
- [Kafka Performance Tuning](https://kafka.apache.org/documentation/#producerconfigs)
