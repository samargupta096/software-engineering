# Messaging Documentation 📨

> Comprehensive learning resources for Apache Kafka and event streaming.

---

## 📚 Documentation Index

| Document | Level | Time | Description |
|----------|-------|------|-------------|
| [🚀 Learning Hub](./kafka-deep-dive.md) | Beginner | 10 min | **Start here!** Overview, learning path, and navigation |
| [📘 Kafka Fundamentals](./kafka-fundamentals.md) | Intermediate | 45 min | Core concepts, Producers, Consumers, Examples |
| [🔧 Internals & Architecture](./kafka-internals-architecture.md) | Advanced | 60 min | Replication, Storage, Performance tuning |

---

## 🎯 Recommended Learning Paths

### Path 1: Quick Start (30 min)
```mermaid
graph LR
    A[Learning Hub] --> B[Fundamentals: Core Concepts]
    B --> C[Try Basic Commands]
    style A fill:#FF6B35,color:white
    style B fill:#2196F3,color:white
    style C fill:#4CAF50,color:white
```

### Path 2: Full Deep Dive (2 hours)
```mermaid
graph LR
    A[Learning Hub] --> B[Fundamentals]
    B --> C[Internals]
    C --> D[Best Practices]
    style A fill:#FF6B35,color:white
    style B fill:#2196F3,color:white
    style C fill:#9C27B0,color:white
    style D fill:#4CAF50,color:white
```

---

## 🗂️ Topics Covered

### Fundamentals
- Topics, Partitions, Offsets
- Producers and partitioning strategies
- Consumers and Consumer Groups
- Message delivery guarantees

### Architecture & Internals
- Broker architecture and request processing
- Replication: ISR, Leader election, High Watermark
- Storage engine: Log segments, Compaction
- Performance: Zero-copy, Batching, Compression

### Ecosystem
- Kafka Connect (Source & Sink connectors)
- Kafka Streams (Stream processing)
- ksqlDB (SQL for streams)
- Schema Registry

### Best Practices
- Production deployment checklist
- Partition sizing guidelines
- Monitoring and alerting
- Common pitfalls and solutions

---

## 🔗 Quick Links

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Developer](https://developer.confluent.io/)
- [Kafka Tutorials](https://kafka-tutorials.confluent.io/)

---

> 💡 **Tip:** Use the navigation headers at the top of each document to move between files.
