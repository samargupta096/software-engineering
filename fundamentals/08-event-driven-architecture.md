# 📡 Event-Driven Architecture (EDA)

> Software architecture paradigm promoting the production, detection, consumption of, and reaction to events.

---

## 📋 Core Components

| Component | Role |
|-----------|------|
| **Event Producer** | Generates an event (state change) |
| **Event Channel** | Transports events (Message Broker / Event Bus) |
| **Event Consumer** | Reacts to the event |
| **Event Processor** | Transforms or filters events mid-stream |

---

## 🏗️ Architecture Patterns

### 1. Pub/Sub Model
- Producers publish messages to topics.
- Multiple consumers subscribe to topics.
- Example: **Kafka**, **SNS/SQS**, **RabbitMQ (Fanout)**.

### 2. Event Sourcing
- Store the *sequence of events* (changes) rather than just the current state.
- Replay events to rebuild state.
- Example: **Banking Ledgers**, **Git**.

### 3. CQRS (Command Query Responsibility Segregation)
- Separate read (Query) and write (Command) models.
- Often used with Event Sourcing.

---

## 🚀 Benefits vs. Challenges

| Benefits | Challenges |
|----------|------------|
| **Decoupling** | Services don't need to know about each other |
| **Scalability** | Async processing allows independent scaling |
| **Responsiveness** | Real-time updates |
| **Resilience** | Buffer bursts of traffic |

| **Complexity** | Async flows harder to debug |
| **Consistency** | Eventual consistency challenges |
| **Ordering** | Guarantees can be tricky distributed |

---

## 📚 Resources

- [Microservices Patterns (Chris Richardson)](https://microservices.io/patterns/data/event-driven-architecture.html)
