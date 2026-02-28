# 💾 Designing Data-Intensive Applications — Key Learnings

> *Martin Kleppmann*
> The bible of distributed systems — data storage, replication, partitioning, consistency, and batch/stream processing.

[🏠 Back to Books](./README.md)

---

## The Big Picture

```mermaid
flowchart TD
    subgraph FOUNDATIONS["Part I: Foundations"]
        Reliability["🛡️ Reliability"]
        Scalability["📈 Scalability"]
        Maintainability["🔧 Maintainability"]
    end

    subgraph DATA["Part II: Distributed Data"]
        Replication["🔄 Replication"]
        Partitioning["✂️ Partitioning"]
        Transactions["🔒 Transactions"]
        Consistency["⚖️ Consistency"]
    end

    subgraph DERIVED["Part III: Derived Data"]
        Batch["📦 Batch Processing"]
        Stream["🌊 Stream Processing"]
        Future["🔮 Future of Data"]
    end

    FOUNDATIONS --> DATA --> DERIVED
```

---

## 1. Reliability, Scalability, Maintainability

```mermaid
flowchart LR
    App["Application"] --> R["🛡️ Reliable<br/>Works correctly even<br/>when things go wrong"]
    App --> S["📈 Scalable<br/>Handles growth in<br/>data, traffic, complexity"]
    App --> M["🔧 Maintainable<br/>Easy to understand,<br/>change, and operate"]

    style R fill:#c8e6c9,stroke:#388e3c
    style S fill:#e3f2fd,stroke:#1976d2
    style M fill:#fff3e0,stroke:#ff9800
```

| Property | Key Question | Strategies |
| :--- | :--- | :--- |
| **Reliability** | Does it work when things fail? | Redundancy, testing, monitoring |
| **Scalability** | Can it handle 10x growth? | Sharding, caching, async |
| **Maintainability** | Can a new dev understand it? | Simple design, docs, modularity |

---

## 2. Data Models & Query Languages

```mermaid
flowchart TD
    Models["Data Models"] --> Relational["📊 Relational (SQL)<br/>Tables, joins, schemas"]
    Models --> Document["📄 Document (NoSQL)<br/>JSON/BSON, flexible schema"]
    Models --> Graph["🕸️ Graph<br/>Nodes & edges, relationships"]
    Models --> TS["📈 Time-Series<br/>Timestamped events"]

    Relational -.-> Best1["Many-to-many relationships"]
    Document -.-> Best2["Self-contained documents"]
    Graph -.-> Best3["Highly connected data"]
```

| Model | Best For | Avoid When |
| :--- | :--- | :--- |
| **Relational** | Complex queries, joins, transactions | Extreme write throughput |
| **Document** | Flexible schemas, nested data | Many cross-document joins |
| **Graph** | Social networks, recommendations | Simple key-value lookups |
| **Key-Value** | Caching, sessions, simple lookups | Complex queries |

---

## 3. Replication

```mermaid
flowchart TD
    subgraph LEADER["Single-Leader"]
        L["Leader"] -->|write| L
        L -->|replicate| F1["Follower 1"]
        L -->|replicate| F2["Follower 2"]
        F1 -->|read| Client1["Client"]
        F2 -->|read| Client2["Client"]
    end

    subgraph MULTI["Multi-Leader"]
        ML1["Leader 1"] <-->|sync| ML2["Leader 2"]
        ML1 <-->|sync| ML3["Leader 3"]
    end

    subgraph LEADER_LESS["Leaderless"]
        N1["Node 1"]
        N2["Node 2"]
        N3["Node 3"]
        Client3["Client"] -->|write to all| N1
        Client3 -->|write to all| N2
        Client3 -->|write to all| N3
    end

    style LEADER fill:#c8e6c9,stroke:#388e3c
    style MULTI fill:#fff3e0,stroke:#ff9800
    style LEADER_LESS fill:#e3f2fd,stroke:#1976d2
```

| Strategy | Consistency | Availability | Use Case |
| :--- | :---: | :---: | :--- |
| **Single-Leader** | Strong | Medium | Most applications |
| **Multi-Leader** | Eventual | High | Multi-datacenter |
| **Leaderless** | Tunable | High | Dynamo-style (Cassandra) |

---

## 4. Partitioning (Sharding)

```mermaid
flowchart LR
    Data["Full Dataset"] --> P1["Partition 1<br/>A-F"]
    Data --> P2["Partition 2<br/>G-M"]
    Data --> P3["Partition 3<br/>N-S"]
    Data --> P4["Partition 4<br/>T-Z"]

    P1 --> Node1["Node 1"]
    P2 --> Node2["Node 2"]
    P3 --> Node3["Node 3"]
    P4 --> Node4["Node 4"]
```

| Strategy | How | Hot Spots? | Rebalancing |
| :--- | :--- | :---: | :--- |
| **Key Range** | A-F, G-M, etc. | ⚠️ Yes | Move boundaries |
| **Hash** | hash(key) % N | ✅ No | Consistent hashing |
| **Composite** | Hash + range | ✅ No | Complex but flexible |

---

## 5. Transactions & ACID

```mermaid
flowchart LR
    ACID["ACID"] --> A["Atomicity<br/>All or nothing"]
    ACID --> C["Consistency<br/>Invariants preserved"]
    ACID --> I["Isolation<br/>Concurrent txns don't interfere"]
    ACID --> D["Durability<br/>Committed data survives crashes"]

    style A fill:#e3f2fd,stroke:#1976d2
    style C fill:#fff3e0,stroke:#ff9800
    style I fill:#e8f5e9,stroke:#4caf50
    style D fill:#fce4ec,stroke:#e91e63
```

### Isolation Levels

| Level | Dirty Reads | Non-Repeatable Reads | Phantoms | Performance |
| :--- | :---: | :---: | :---: | :---: |
| **Read Uncommitted** | ⚠️ Yes | ⚠️ Yes | ⚠️ Yes | ⚡ Fastest |
| **Read Committed** | ✅ No | ⚠️ Yes | ⚠️ Yes | ⚡ Fast |
| **Repeatable Read** | ✅ No | ✅ No | ⚠️ Yes | 🔄 Medium |
| **Serializable** | ✅ No | ✅ No | ✅ No | 🐢 Slowest |

---

## 6. The CAP Theorem (Simplified)

```mermaid
flowchart TD
    CAP["During a Network Partition<br/>you MUST choose:"] --> CP["CP: Consistency<br/>Refuse requests if unsure"]
    CAP --> AP["AP: Availability<br/>Serve potentially stale data"]

    CP -.-> CPEx["ZooKeeper, HBase, MongoDB"]
    AP -.-> APEx["Cassandra, DynamoDB, CouchDB"]

    style CP fill:#e3f2fd,stroke:#1976d2
    style AP fill:#fff3e0,stroke:#ff9800
```

> **Reality:** CAP is about trade-offs during partitions. In normal operation, you can have all three. The real question is: **what happens when the network fails?**

---

## 7. Batch vs. Stream Processing

```mermaid
flowchart LR
    subgraph BATCH["📦 Batch Processing"]
        direction TB
        B1["Process bounded dataset"]
        B2["MapReduce, Spark"]
        B3["High throughput"]
        B4["Hours of latency OK"]
    end

    subgraph STREAM["🌊 Stream Processing"]
        direction TB
        S1["Process unbounded events"]
        S2["Kafka Streams, Flink"]
        S3["Low latency"]
        S4["Real-time results"]
    end

    style BATCH fill:#e8eaf6,stroke:#3f51b5
    style STREAM fill:#c8e6c9,stroke:#388e3c
```

| Aspect | Batch | Stream |
| :--- | :--- | :--- |
| **Input** | Bounded dataset | Unbounded event stream |
| **Latency** | Minutes to hours | Milliseconds to seconds |
| **Tools** | Hadoop, Spark | Kafka, Flink, Kinesis |
| **Use Case** | Analytics, ETL | Real-time dashboards, alerts |

---

## 8. Key Takeaways

1. **There is no one-size-fits-all database** — choose based on access patterns
2. **Replication and partitioning** are the two fundamental strategies for scaling
3. **Consistency and availability** are trade-offs, not absolutes
4. **Transactions** provide guarantees but at a performance cost
5. **Batch and stream processing** are complementary, not competing

---

<div align="center">

[⬅️ Previous: Clean Code](./clean-code.md) | [🏠 Back to Books](./README.md) | [Next: Refactoring ➡️](./refactoring.md)

</div>
