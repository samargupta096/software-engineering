# Kafka Fundamentals & Core Concepts

> 📘 **Level: Beginner to Intermediate** | ⏱️ **Reading Time: 45 min** | 🔗 **[← Learning Hub](./kafka-deep-dive.md)** | **[Internals Guide →](./kafka-internals-architecture.md)**

---

## 🗺️ Quick Navigation

| Section | What You'll Learn |
|---------|-------------------|
| [Core Concepts](#core-concepts) | Topics, Partitions, Offsets, Consumer Groups |
| [Architecture](#kafka-architecture) | Brokers, Clusters, Zookeeper/KRaft |
| [Producers](#producers) | Publishing messages, Partitioning strategies |
| [Consumers](#consumers) | Subscribing, Consumer Groups, Offsets |
| [Message Delivery](#message-delivery-guarantees) | At-least-once, Exactly-once semantics |
| [Real-World Examples](#real-world-examples) | Event sourcing, Log aggregation |

> [!TIP]
> **New to Kafka?** Start with the [Learning Hub](./kafka-deep-dive.md) for an overview before diving into details.

---

## Core Concepts

### What is Kafka?

Apache Kafka is a **distributed event streaming platform** capable of:
- Publishing and subscribing to streams of records
- Storing streams of records durably and reliably  
- Processing streams of records as they occur

### Core Components Overview

```mermaid
graph TB
    subgraph Producers["📤 Producers"]
        P1["App 1"]
        P2["App 2"]
        P3["Service"]
    end
    
    subgraph Kafka["Apache Kafka Cluster"]
        subgraph Topic["Topic: orders"]
            Part0["Partition 0"]
            Part1["Partition 1"]
            Part2["Partition 2"]
        end
    end
    
    subgraph Consumers["📥 Consumer Group"]
        C1["Consumer 1"]
        C2["Consumer 2"]
    end
    
    P1 --> Part0
    P2 --> Part1
    P3 --> Part2
    
    Part0 --> C1
    Part1 --> C1
    Part2 --> C2
    
    style Kafka fill:#FF6B35,color:white
    style Topic fill:#004E89,color:white
```

### Key Terminology

| Concept | Description | Analogy |
|---------|-------------|---------|
| **Topic** | Named feed/category for messages | Like a database table |
| **Partition** | Ordered, immutable sequence of messages | Like a commit log file |
| **Offset** | Unique ID for each message in a partition | Like a line number |
| **Broker** | Kafka server that stores data | Like a database node |
| **Consumer Group** | Set of consumers sharing workload | Like a worker pool |
| **Replica** | Copy of a partition for fault tolerance | Like a database replica |

---

## Kafka Architecture

### Cluster Architecture

```mermaid
graph TB
    subgraph Cluster["Kafka Cluster"]
        subgraph B1["Broker 1"]
            T1P0["Topic1-P0 (Leader)"]
            T1P1R["Topic1-P1 (Replica)"]
            T2P0R["Topic2-P0 (Replica)"]
        end
        
        subgraph B2["Broker 2"]
            T1P0R["Topic1-P0 (Replica)"]
            T1P1["Topic1-P1 (Leader)"]
            T2P0["Topic2-P0 (Leader)"]
        end
        
        subgraph B3["Broker 3"]
            T1P0R2["Topic1-P0 (Replica)"]
            T1P1R2["Topic1-P1 (Replica)"]
            T2P0R2["Topic2-P0 (Replica)"]
        end
    end
    
    ZK["Zookeeper / KRaft"]
    
    ZK -.->|metadata| B1
    ZK -.->|metadata| B2
    ZK -.->|metadata| B3
    
    style T1P0 fill:#4CAF50,color:white
    style T1P1 fill:#4CAF50,color:white
    style T2P0 fill:#4CAF50,color:white
```

> 🟢 **Leader** = Handles reads/writes | 🔵 **Replica** = Follower for failover

### Topic & Partition Structure

```mermaid
graph LR
    subgraph Topic["Topic: user-events"]
        subgraph P0["Partition 0"]
            M0["Offset 0"]
            M1["Offset 1"]
            M2["Offset 2"]
            M3["Offset 3"]
        end
        subgraph P1["Partition 1"]
            M4["Offset 0"]
            M5["Offset 1"]
            M6["Offset 2"]
        end
        subgraph P2["Partition 2"]
            M7["Offset 0"]
            M8["Offset 1"]
        end
    end
    
    M0 --> M1 --> M2 --> M3
    M4 --> M5 --> M6
    M7 --> M8
    
    style P0 fill:#2196F3,color:white
    style P1 fill:#4CAF50,color:white
    style P2 fill:#FF9800,color:white
```

**Key Points:**
- Messages within a partition are **strictly ordered**
- Ordering is **NOT guaranteed** across partitions
- Each partition is an **immutable, append-only log**
- Partitions enable **horizontal scaling**

---

## Producers

### How Producers Work

```mermaid
sequenceDiagram
    participant App as Application
    participant P as Producer
    participant B as Broker (Leader)
    participant R as Replica
    
    App->>P: send(topic, key, value)
    P->>P: Serialize message
    P->>P: Determine partition
    P->>B: Produce request
    B->>B: Write to log
    B-->>R: Replicate
    R-->>B: Acknowledge
    B-->>P: Acknowledgment
    P-->>App: Success/Callback
```

### Partitioning Strategies

```mermaid
flowchart TD
    Start["Message to Send"] --> HasKey{Has Key?}
    
    HasKey -->|Yes| Hash["hash(key) % partitions"]
    HasKey -->|No| RoundRobin["Round Robin / Sticky"]
    
    Hash --> P1["Same key → Same partition"]
    RoundRobin --> P2["Distributed across partitions"]
    
    P1 --> Ordered["✅ Ordering guaranteed for key"]
    P2 --> Distributed["✅ Load balanced"]
    
    style Start fill:#FF6B35,color:white
    style Ordered fill:#4CAF50,color:white
    style Distributed fill:#2196F3,color:white
```

### Producer Configuration

```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// Durability settings
props.put("acks", "all");           // Wait for all replicas
props.put("retries", 3);            // Retry on failure
props.put("enable.idempotence", true);  // Exactly-once

KafkaProducer<String, String> producer = new KafkaProducer<>(props);
```

| Setting | Options | Trade-off |
|---------|---------|-----------|
| `acks=0` | Fire and forget | Fastest, may lose data |
| `acks=1` | Leader only | Balanced |
| `acks=all` | All replicas | Slowest, most durable |

---

## Consumers

### Consumer Group Mechanics

```mermaid
graph TB
    subgraph Topic["Topic: orders (3 partitions)"]
        P0["Partition 0"]
        P1["Partition 1"]
        P2["Partition 2"]
    end
    
    subgraph CG1["Consumer Group: order-processor"]
        C1["Consumer 1"]
        C2["Consumer 2"]
    end
    
    subgraph CG2["Consumer Group: analytics"]
        C3["Consumer 3"]
    end
    
    P0 --> C1
    P1 --> C1
    P2 --> C2
    
    P0 -.-> C3
    P1 -.-> C3
    P2 -.-> C3
    
    style CG1 fill:#4CAF50,color:white
    style CG2 fill:#2196F3,color:white
```

**Key Rules:**
- Each partition → **exactly one consumer** per group
- Multiple groups → **each receives all messages** (pub-sub)
- Max consumers per group = number of partitions

### Consumer Rebalancing

```mermaid
stateDiagram-v2
    [*] --> Stable: Initial assignment
    
    Stable --> Rebalancing: Consumer joins/leaves
    Stable --> Rebalancing: Partition added
    Stable --> Rebalancing: Consumer fails
    
    Rebalancing --> Stable: Partitions reassigned
    
    note right of Rebalancing
        All consumers pause
        Coordinator reassigns partitions
        Consumers resume
    end note
```

### Offset Management

```mermaid
graph LR
    subgraph Partition["Partition 0"]
        O0["0"] --> O1["1"] --> O2["2"] --> O3["3"] --> O4["4"] --> O5["5"]
    end
    
    Committed["Committed Offset: 3"]
    Current["Current Position: 5"]
    LEO["Log End Offset: 5"]
    
    O3 -.-> Committed
    O5 -.-> Current
    O5 -.-> LEO
    
    style O0 fill:#ccc
    style O1 fill:#ccc
    style O2 fill:#ccc
    style O3 fill:#4CAF50,color:white
    style O4 fill:#2196F3,color:white
    style O5 fill:#2196F3,color:white
```

**Commit Strategies:**
- **Auto-commit**: Easy but may lose/duplicate messages
- **Manual sync commit**: Blocks until confirmed
- **Manual async commit**: Non-blocking, best for performance

---

## Message Delivery Guarantees

```mermaid
flowchart LR
    subgraph Guarantees
        AtMost["At-Most-Once"]
        AtLeast["At-Least-Once"]
        Exactly["Exactly-Once"]
    end
    
    AtMost --> |"May lose messages"| Loss["❌ Data Loss Risk"]
    AtLeast --> |"May duplicate messages"| Dup["⚠️ Duplicates OK"]
    Exactly --> |"Transactional"| Perfect["✅ Perfect"]
    
    style AtMost fill:#f44336,color:white
    style AtLeast fill:#FF9800,color:white
    style Exactly fill:#4CAF50,color:white
```

| Guarantee | How to Achieve | Use Case |
|-----------|----------------|----------|
| **At-most-once** | `acks=0`, auto-commit | Metrics, logs (loss OK) |
| **At-least-once** | `acks=all`, manual commit | Most applications |
| **Exactly-once** | Idempotent producer + transactions | Financial, critical data |

### Exactly-Once Configuration

```java
// Producer
props.put("enable.idempotence", true);
props.put("transactional.id", "my-transactional-id");

// Consumer
props.put("isolation.level", "read_committed");
```

---

## Real-World Examples

### Example 1: E-Commerce Order Processing

```mermaid
graph LR
    subgraph Sources
        Web["Web App"]
        Mobile["Mobile App"]
    end
    
    subgraph Kafka
        Orders["orders topic"]
        Inventory["inventory topic"]
        Notifications["notifications topic"]
    end
    
    subgraph Consumers
        OrderSvc["Order Service"]
        InventorySvc["Inventory Service"]
        EmailSvc["Email Service"]
    end
    
    Web --> Orders
    Mobile --> Orders
    
    Orders --> OrderSvc
    OrderSvc --> Inventory
    Inventory --> InventorySvc
    OrderSvc --> Notifications
    Notifications --> EmailSvc
```

### Example 2: Log Aggregation

```mermaid
graph TB
    subgraph Apps["Applications"]
        App1["Service 1"]
        App2["Service 2"]
        App3["Service 3"]
    end
    
    subgraph Kafka["Kafka"]
        Logs["logs topic"]
    end
    
    subgraph Sinks["Consumers"]
        ES["Elasticsearch"]
        S3["S3 Archive"]
        Metrics["Metrics System"]
    end
    
    App1 --> Logs
    App2 --> Logs
    App3 --> Logs
    
    Logs --> ES
    Logs --> S3
    Logs --> Metrics
```

---

## Common Commands

```bash
# Create topic
kafka-topics.sh --create --topic my-topic --partitions 3 --replication-factor 2

# List topics
kafka-topics.sh --list --bootstrap-server localhost:9092

# Describe topic
kafka-topics.sh --describe --topic my-topic

# Produce messages
kafka-console-producer.sh --topic my-topic --bootstrap-server localhost:9092

# Consume messages
kafka-console-consumer.sh --topic my-topic --from-beginning --bootstrap-server localhost:9092

# Consumer groups
kafka-consumer-groups.sh --list --bootstrap-server localhost:9092
kafka-consumer-groups.sh --describe --group my-group
```

---

## Summary

| Concept | Key Takeaway |
|---------|--------------|
| **Topics** | Logical channels for messages |
| **Partitions** | Enable parallelism and ordering |
| **Consumer Groups** | Enable scalable, fault-tolerant consumption |
| **Replication** | Provides fault tolerance |
| **Offsets** | Track consumer progress |

---

**Next:** [🔧 Kafka Internals & Architecture →](./kafka-internals-architecture.md)

---

## 📚 Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Developer](https://developer.confluent.io/)
- [Kafka: The Definitive Guide](https://www.confluent.io/resources/kafka-the-definitive-guide/)
