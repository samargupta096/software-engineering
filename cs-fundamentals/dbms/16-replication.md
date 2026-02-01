[🏠 Home](../../README.md) | [🗄️ DBMS Roadmap](./00-roadmap.md) | [⬅️ Scaling](./15-scaling.md) | [➡️ NoSQL Types](./17-nosql-types.md)

# 🔄 Replication

> Keeping multiple copies of data for availability and performance.

---

## 📊 Quick Reference

| Type | Description |
|------|-------------|
| **Master-Slave** | One writer, many readers |
| **Master-Master** | Multiple writers |
| **Synchronous** | Wait for replica confirmation |
| **Asynchronous** | Don't wait (faster, less safe) |

---

## 🏗️ Why Replication?

```mermaid
flowchart TB
    Why[Why Replicate?] --> HA[High Availability]
    Why --> Read[Read Scalability]
    Why --> Geo[Geographic Distribution]
    Why --> Backup[Backup / Disaster Recovery]
    
    HA --> |"If primary fails"| Failover["Replica takes over"]
    Read --> |"Spread read load"| Scale["Multiple read replicas"]
    Geo --> |"Reduce latency"| Regional["Replica in each region"]
```

---

## 👑 Master-Slave (Primary-Replica)

```mermaid
flowchart TB
    App[Application]
    Master["Master\n(Read/Write)"]
    Slave1["Slave 1\n(Read Only)"]
    Slave2["Slave 2\n(Read Only)"]
    
    App --> |"Writes"| Master
    App --> |"Reads"| Slave1
    App --> |"Reads"| Slave2
    
    Master --> |"Replicate"| Slave1
    Master --> |"Replicate"| Slave2
```

### How It Works

1. Write goes to Master
2. Master writes to log (binlog/WAL)
3. Slaves read log and apply changes
4. Reads can go to any slave

### Pros & Cons

| Pros | Cons |
|------|------|
| Simple to understand | Single write bottleneck |
| Easy read scaling | Replication lag |
| Clear failover path | Slave can serve stale data |

---

## 👥 Master-Master (Multi-Master)

```mermaid
flowchart LR
    App1[App Region A]
    App2[App Region B]
    M1["Master 1"]
    M2["Master 2"]
    
    App1 --> |"Read/Write"| M1
    App2 --> |"Read/Write"| M2
    
    M1 <--> |"Replicate"| M2
```

### Conflict Resolution

When both masters modify the same row:

| Strategy | Description |
|----------|-------------|
| **Last Write Wins** | Use timestamps |
| **Origin Wins** | Prefer local changes |
| **Custom Merge** | Application logic |
| **Avoid Conflicts** | Partition writes by region |

---

## ⏱️ Sync vs Async Replication

```mermaid
sequenceDiagram
    participant App
    participant Master
    participant Replica
    
    Note over App, Replica: Synchronous
    App->>Master: Write
    Master->>Replica: Replicate
    Replica-->>Master: ACK
    Master-->>App: Committed ✅
    
    Note over App, Replica: Asynchronous
    App->>Master: Write
    Master-->>App: Committed ✅
    Master->>Replica: Replicate (later)
```

### Comparison

| Aspect | Synchronous | Asynchronous |
|--------|-------------|--------------|
| **Durability** | Strong (data on replica) | Weak (may lose data) |
| **Latency** | Higher (wait for replica) | Lower (immediate return) |
| **Availability** | Lower (replica must be up) | Higher (independent) |

---

## 📊 Replication Lag

The delay between master write and replica update.

```mermaid
flowchart LR
    Write["Write @ t=0"]
    Master["Master has data"]
    Lag["⏱️ Replication Lag"]
    Replica["Replica has data @ t=100ms"]
    
    Write --> Master --> Lag --> Replica
```

### Problems from Lag

1. **Read-your-writes:** User writes, then reads from replica, doesn't see change
2. **Monotonic reads:** User sees newer data, then older data on different replica

### Solutions

| Solution | Description |
|----------|-------------|
| **Read from master** | After write, read from master for X seconds |
| **Causal consistency** | Track "happens-before" relationships |
| **Session stickiness** | Route user to same replica |

---

## 🔄 Replication Topologies

### Chain Replication

```mermaid
flowchart LR
    M[Master] --> S1[Slave 1] --> S2[Slave 2] --> S3[Slave 3]
```

### Tree Replication

```mermaid
flowchart TB
    M[Master]
    S1[Slave 1]
    S2[Slave 2]
    S3[Slave 3]
    S4[Slave 4]
    
    M --> S1 & S2
    S1 --> S3
    S2 --> S4
```

### Ring Replication

```mermaid
flowchart LR
    M1[Node 1] --> M2[Node 2]
    M2 --> M3[Node 3]
    M3 --> M1
```

---

## 🚨 Failover

When master fails, promote a replica.

```mermaid
flowchart TB
    Normal["Normal Operation"]
    Failure["Master Fails ❌"]
    Detection["Detection\n(Heartbeat timeout)"]
    Election["Leader Election"]
    Promotion["Promote Replica to Master"]
    Reconfigure["Reconfigure other replicas"]
    
    Normal --> Failure --> Detection --> Election --> Promotion --> Reconfigure
```

### Failover Challenges

| Challenge | Description |
|-----------|-------------|
| **Split Brain** | Two nodes think they're master |
| **Data Loss** | Async replica may be behind |
| **Election** | How to choose new master? |

---

## 🧠 Interview Questions

1. **Q: Synchronous vs Asynchronous replication?**
   - **A:** Sync: Wait for replica ACK before commit (durability guaranteed). Async: Return immediately (faster but may lose data on failure).

2. **Q: What is Replication Lag?**
   - **A:** Time delay between master write and replica receiving the change. Causes stale reads. Can be milliseconds to seconds+.

3. **Q: How do you handle Split Brain?**
   - **A:** Use quorum (majority must agree), fencing (shut down old master via STONITH), or distributed consensus (Raft, Paxos).

4. **Q: Master-Slave vs Master-Master?**
   - **A:** Master-Slave: Simple, single write point. Master-Master: Multi-region writes, but conflict resolution is complex.

---
