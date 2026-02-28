# Chapter 3: Message Brokers & Event Infrastructure

> *Choosing and understanding the backbone of your event-driven system*

---

## 🎯 Core Concepts

### Broker Architecture

```mermaid
flowchart TD
    subgraph PRODUCE["Producers"]
        P1["Service A"]
        P2["Service B"]
    end

    subgraph BROKER["📨 Message Broker"]
        direction TB
        T1["Topic: orders"]
        T2["Topic: payments"]
        T3["Topic: notifications"]
        T1 --> Part["Partitions (Kafka)<br/>or Queues (RabbitMQ)"]
    end

    subgraph CONSUME["Consumers"]
        CG1["Consumer Group 1"]
        CG2["Consumer Group 2"]
    end

    P1 -->|publish| T1
    P2 -->|publish| T2
    T1 --> CG1
    T1 --> CG2
    T2 --> CG1

    style BROKER fill:#e8eaf6,stroke:#3f51b5
```

### Kafka Architecture (Deep Dive)

```mermaid
flowchart TD
    Producer["Producer"] --> Topic["Topic: orders"]

    subgraph TOPIC["Topic Partitions"]
        Part0["Partition 0: [E1, E4, E7]"]
        Part1["Partition 1: [E2, E5, E8]"]
        Part2["Partition 2: [E3, E6, E9]"]
    end

    Topic --> TOPIC

    subgraph CG["Consumer Group"]
        C0["Consumer 0 → P0"]
        C1["Consumer 1 → P1"]
        C2["Consumer 2 → P2"]
    end

    TOPIC --> CG

    style TOPIC fill:#e8eaf6,stroke:#3f51b5
    style CG fill:#c8e6c9,stroke:#388e3c
```

### Message Queue vs. Event Stream

| Feature | Message Queue (RabbitMQ, SQS) | Event Stream (Kafka, Pulsar) |
| :--- | :--- | :--- |
| **Message lifecycle** | Deleted after consumption | Retained for configurable period |
| **Replay** | ❌ Not possible | ✅ Replay from any offset |
| **Multiple consumers** | Competing consumers only | Multiple independent consumer groups |
| **Ordering** | Per queue | Per partition |
| **Use case** | Task distribution, work queues | Event sourcing, streaming analytics |

### Broker Comparison

```mermaid
flowchart TD
    Choose(["Choose a Broker"]) --> Q1{"Need event<br/>replay?"}
    Q1 -- Yes --> Q2{"High throughput<br/>(100K+ events/s)?"}
    Q2 -- Yes --> Kafka["✅ Apache Kafka"]
    Q2 -- No --> Pulsar["✅ Pulsar / Redis Streams"]
    Q1 -- No --> Q3{"Complex routing<br/>patterns?"}
    Q3 -- Yes --> Rabbit["✅ RabbitMQ"]
    Q3 -- No --> Q4{"Serverless?"}
    Q4 -- Yes --> SQS["✅ SQS + EventBridge"]
    Q4 -- No --> NATS["✅ NATS"]

    style Kafka fill:#c8e6c9,stroke:#388e3c
    style Rabbit fill:#fff3e0,stroke:#ff9800
    style SQS fill:#e3f2fd,stroke:#1976d2
```

---

## 📝 My Notes

<!-- Add your own notes as you read -->

---

## ❓ Questions to Reflect On

1. What broker best fits your current project's requirements?
2. When would you choose a message queue over an event stream?
3. How do partitioning strategies affect ordering and scalability?

---

## 🛠️ Practice Ideas

- [ ] Set up Kafka locally and produce/consume messages
- [ ] Compare RabbitMQ and Kafka for the same use case
- [ ] Experiment with consumer groups and partition assignment

---

<div align="center">

[⬅️ Previous](./chapter-02-events-and-messaging.md) | [🏠 Home](./README.md) | [Next ➡️](./chapter-04-pub-sub-patterns.md)

</div>
