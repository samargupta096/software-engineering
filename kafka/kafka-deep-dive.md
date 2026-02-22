# 📨 Kafka Deep Dive - Learning Hub

> Distributed event streaming platform capable of handling trillions of events a day.

---

## 🗺️ Documentation Navigation

| Document | Level | Description |
|----------|-------|-------------|
| **📍 You are here** | Overview | Learning hub and entry point |
| [📘 Kafka Fundamentals](./kafka-fundamentals.md) | Beginner-Intermediate | Core concepts, Producers, Consumers, Examples |
| [🔧 Internals & Architecture](./kafka-internals-architecture.md) | Advanced | Deep internals, Replication, Performance |

---

## 🎯 Learning Path

```mermaid
flowchart LR
    Start["🚀 Start Here"] --> Basics["📘 Fundamentals"]
    Basics --> Internals["🔧 Internals"]
    Internals --> Practice["💻 Practice"]
    
    style Start fill:#FF6B35,color:white
    style Basics fill:#2196F3,color:white
    style Internals fill:#9C27B0,color:white
    style Practice fill:#4CAF50,color:white
```

| Step | Document | Focus | Time |
|------|----------|-------|------|
| 1️⃣ | This page | Overview & orientation | 10 min |
| 2️⃣ | [Fundamentals](./kafka-fundamentals.md) | Topics, Producers, Consumers | 45 min |
| 3️⃣ | [Internals](./kafka-internals-architecture.md) | Replication, Performance | 60 min |

---

## 🧠 Core Concepts at a Glance

```mermaid
mindmap
  root((Kafka))
    Core Components
      Topics
      Partitions
      Brokers
      Producers
      Consumers
    Key Features
      Distributed
      Fault Tolerant
      Scalable
      High Throughput
    Ecosystem
      Kafka Connect
      Kafka Streams
      ksqlDB
      Schema Registry
```

---

## 📋 Quick Reference

| Concept | Description |
|---------|-------------|
| **Topic** | Category/feed name to which records are stored |
| **Producer** | Application that publishes messages to a topic |
| **Consumer** | Application that subscribes to topics and processes messages |
| **Broker** | Kafka server that stores data |
| **Partition** | Unit of parallelism and scalability |
| **Offset** | Unique ID of a message within a partition |
| **Consumer Group** | Set of consumers sharing workload |
| **Replication** | Copies of partitions for fault tolerance |

---

## 🏗️ High-Level Architecture

```mermaid
graph TB
    subgraph Producers
        P1["Producer 1"]
        P2["Producer 2"]
    end
    
    subgraph Kafka["Kafka Cluster"]
        B1["Broker 1"]
        B2["Broker 2"]
        B3["Broker 3"]
        ZK["Zookeeper / KRaft"]
    end
    
    subgraph Consumers
        CG1["Consumer Group 1"]
        CG2["Consumer Group 2"]
    end
    
    P1 --> B1
    P2 --> B2
    
    B1 --> CG1
    B2 --> CG1
    B3 --> CG2
    
    ZK -.-> B1
    ZK -.-> B2
    ZK -.-> B3
    
    style Kafka fill:#FF6B35,color:white
```

---

## 🚀 Use Cases

| Use Case | Description | Example |
|----------|-------------|---------|
| **Activity Tracking** | Real-time user behavior | LinkedIn, Netflix |
| **Log Aggregation** | Centralized log collection | ELK Stack integration |
| **Stream Processing** | Real-time analytics | Fraud detection |
| **Event Sourcing** | Storing state changes as events | Banking systems |
| **Messaging** | Pub/Sub communication | Microservices |
| **Metrics** | Operational monitoring | System dashboards |

---

## 📊 Skill Level Matrix

| Topic | Beginner | Intermediate | Advanced |
|-------|:--------:|:------------:|:--------:|
| Topics & Partitions | ✅ | ✅ | ✅ |
| Producers & Consumers | ✅ | ✅ | ✅ |
| Consumer Groups | | ✅ | ✅ |
| Delivery Guarantees | | ✅ | ✅ |
| Replication & ISR | | | ✅ |
| Performance Tuning | | | ✅ |
| Kafka Connect | | ✅ | ✅ |
| Kafka Streams | | | ✅ |

---

## 🎬 Getting Started

### For Beginners
Start with → [📘 Kafka Fundamentals](./kafka-fundamentals.md)
- Learn Topics, Partitions, Offsets
- Understand Producers and Consumers
- Explore Consumer Groups

### For Intermediate Users
Continue to → [🔧 Internals & Architecture](./kafka-internals-architecture.md)
- Deep dive into replication
- Understand storage engine
- Learn performance optimization

---

## 📚 Resources

| Resource | Type | Link |
|----------|------|------|
| Apache Kafka Docs | Official | [kafka.apache.org](https://kafka.apache.org/documentation/) |
| Confluent Developer | Tutorials | [developer.confluent.io](https://developer.confluent.io/) |
| Kafka: The Definitive Guide | Book | [O'Reilly](https://www.confluent.io/resources/kafka-the-definitive-guide/) |

---

**Next Step:** [📘 Start Learning with Kafka Fundamentals →](./kafka-fundamentals.md)
