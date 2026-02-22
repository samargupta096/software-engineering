# ⚡ DynamoDB Deep Dive

> AWS's fully managed, serverless, key-value NoSQL database.

---

## 📋 Core Concepts

| Concept | Description |
|---------|-------------|
| **Partition Key (PK)** | Determines the partition (shard) |
| **Sort Key (SK)** | Determines order within a partition (optional) |
| **LSI** | Local Secondary Index (same PK, diff SK) |
| **GSI** | Global Secondary Index (diff PK, diff SK) |
| **RCU / WCU** | Read/Write Capacity Units (provisioned throughput) |

---

## 🏗️ Architecture

- **Serverless**: No servers to manage, auto-scaling
- **Multi-AZ**: Automatic replication across 3 AZs
- **Global Tables**: Multi-region replication with eventual consistency
- **DynamoDB Streams**: Change Data Capture (CDC) for triggers (Lambda)

---

## 🚀 Use Cases

1. **Serverless Apps**: Backend for Lambda functions
2. **Shopping Carts**: High throughput, low latency
3. **Gaming State**: Player profiles, leaderboards
4. **Ad Tech**: Real-time bidding, user profiles

---

## 📚 Resources

- [Amazon DynamoDB Developer Guide](https://docs.aws.amazon.com/dynamodb/latest/developerguide/Introduction.html)
