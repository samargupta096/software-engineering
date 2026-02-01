[🏠 Home](../../README.md) | [⬅️ Networking Fundamentals](../networking-fundamentals.md) | [➡️ Architecture](./01-architecture.md)

# 🗄️ DBMS Masterclass Roadmap

> A complete curriculum to master Database Management Systems, from internals to distributed architecture.

---

## 🚦 Status Legend
*   ✅ **Completed** - Detailed guide available
*   🔲 **Pending** - To be created

---

## 📚 Module 1: The Fundamentals
*Core concepts every engineer must know.*

| Topic | Key Concepts | Status |
| :--- | :--- | :--- |
| **01. DBMS Architecture** | 3-Tier Architecture, Data Independence (Physical/Logical), Data Models (Relational, Document, Graph) | ✅ [Link](./01-architecture.md) |
| **02. ER Modeling** | Entities, Attributes, Relationships (1:1, 1:N, M:N), Cardinality, Weak Entities | ✅ [Link](./02-er-modeling.md) |
| **03. Relational Model** | Keys (Primary, Candidate, Foreign, Composite), Referential Integrity, Constraints | ✅ [Link](./03-relational-model.md) |
| **04. Normalization** | Anomalies (Insert/Update/Delete), 1NF, 2NF, 3NF, BCNF, Denormalization tradeoffs | ✅ [Link](./04-normalization.md) |

## ⚙️ Module 2: Storage & Indexing
*How data effectively sits on the disk.*

| Topic | Key Concepts | Status |
| :--- | :--- | :--- |
| **05. Storage Internals** | Pages, Blocks, Heap Files, Slotted Page Structure, Row vs Column Store | ✅ [Link](./05-storage-internals.md) |
| **06. Indexing (B-Trees)** | Clustered vs Non-Clustered, B-Tree vs B+ Tree, Index Selectivity, Covering Index | ✅ [Link](./06-indexing-btree.md) |
| **07. Advanced Indexing** | Hash Index, Bitmap Index, LSM Trees (for Write-Heavy), Spatial Index | ✅ [Link](./07-advanced-indexing.md) |

## ⚡ Module 3: Transactions & Concurrency
*The "Hard Parts" of databases.*

| Topic | Key Concepts | Status |
| :--- | :--- | :--- |
| **08. ACID Properties** | Atomicity (WAL), Consistency, Isolation, Durability | ✅ [Link](./08-acid-properties.md) |
| **09. Concurrency Control** | Lock-Based (2PL), Deadlocks (Detection/Prevention), Granularity (Row/Table/Page) | ✅ [Link](./09-concurrency-control.md) |
| **10. Isolation Levels** | Read Uncommitted, Read Committed, Repeatable Read, Serializable, Phantom Reads | ✅ [Link](./10-isolation-levels.md) |
| **11. MVCC** | Multi-Version Concurrency Control (how Postgres/MySQL avoid readers blocking writers) | ✅ [Link](./11-mvcc.md) |

## 🛠️ Module 4: SQL & Optimization
*Practical querying skills.*

| Topic | Key Concepts | Status |
| :--- | :--- | :--- |
| **12. SQL Commands** | DDL, DML, DCL, TCL, Window Functions (`RANK`, `LEAD`), CTEs | ✅ [Link](./12-sql-commands.md) |
| **13. Joins Deep Dive** | Nested Loop, Hash Join, Sort-Merge Join, Outer/Cross Joins | ✅ [Link](./13-joins.md) |
| **14. Query Optimization** | Explain Plan, Cost-based Optimization, Index Merging, Sargable Queries | ✅ [Link](./14-query-optimization.md) |

## ☁️ Module 5: Advanced & Distributed
*Modern database architecture.*

| Topic | Key Concepts | Status |
| :--- | :--- | :--- |
| **15. Scaling** | Vertical vs Horizontal, Sharding (Strategies & Challenges), Partitioning | ✅ [Link](./15-scaling.md) |
| **16. Replication** | Master-Slave, Master-Master, Sync vs Async, Quorums | ✅ [Link](./16-replication.md) |
| **17. NoSQL Types** | Key-Value (Redis), Document (Mongo), Wide-Column (Cassandra), Graph (Neo4j) | ✅ [Link](./17-nosql-types.md) |
| **18. CAP & PACELC** | Theorem trade-offs, Eventual Consistency, Tunable Consistency | ✅ [Link](./18-cap-theorem.md) |

---

## 🧠 Common Interview Questions

### Basic
1.  **Delete vs Truncate vs Drop?**
    *   *Delete*: DML, slow, logs rows. *Truncate*: DDL, fast, resets page. *Drop*: Removes table structure.
2.  **Difference between Primary Key and Unique Key?**
    *   PK cannot be NULL, only one per table. Unique Key allows one NULL (usually), multiple allowed.
3.  **What is a Foreign Key?**
    *   Enforces referential integrity between two tables.

### Intermediate
4.  **Explain ACID.**
    *   *Atomicity*: All or nothing. *Consistency*: DB valid before/after. *Isolation*: Transactions don't interfere. *Durability*: Saved forever.
5.  **Index vs Clustered Index?**
    *   *Clustered*: Sorts the physical data rows (only 1 per table). *Non-Clustered*: Separate structure pointing to rows.
6.  **What is a Deadlock?**
    *   Txn A holds Lock X, needs Y. Txn B holds Lock Y, needs X. Cycle.

### Advanced
7.  **How does MVCC work?**
    *   System keeps multiple versions of a row. Readers read "old" version while Writer creates "new" version. No locking needed for reads.
8.  **B-Tree vs LSM Tree?**
    *   *B-Tree*: Read optimized (MySQL). *LSM*: Write optimized (Cassandra/RocksDB), appends to memory buffer then flushes.
9.  **Isolation Levels vs Anomalies?**
    *   *Dirty Read*: Reading uncommitted data.
    *   *Non-Repeatable Read*: Value changes between two reads in same txn.
    *   *Phantom Read*: New rows appear between two range queries.

---
