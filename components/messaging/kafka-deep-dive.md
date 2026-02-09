# 📨 Kafka Deep Dive

> Distributed event streaming platform capable of handling trillions of events a day.

---

## 📋 Core Concepts

| Concept | Description |
|---------|-------------|
| **Topic** | Category/feed name to which records are stored |
| **Producer** | Application that publishes messages to a topic |
| **Consumer** | Application that subscribes to topics and processes messages |
| **Broker** | Kafka server that stores data |
| **Partition** | Unit of parallelism and scalability |
| **Offset** | Unique ID of a message within a partition |

---

## 🏗️ Architecture

- **Zookeeper / KRaft**: Metadata management and controller election
- **Topic Partitioning**: Sharding for scale
- **Replication**: Fault tolerance (Leader/Follower model)
- **Consumer Groups**: Load balancing consumers

---

## 🚀 Use Cases

1. **Activity Tracking**: Real-time user behavior
2. **Log Aggregation**: Centralized log collection
3. **Stream Processing**: Real-time analytics (Fraud detection)
4. **Event Sourcing**: Storing state changes as events

---

## 📚 Resources

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
