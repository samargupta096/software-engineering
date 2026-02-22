# 🐬 MySQL: Indexing, Sharding, Partitioning

> The world's most popular open-source database.

---

## 📋 Storage Engines

| Engine | Description | Use Case |
|--------|-------------|----------|
| **InnoDB** | Transactional, row-level locking, default | Most OLTP applications |
| **MyISAM** | Non-transactional, table-level locking | Specific read-heavy/legacy (deprecated) |

---

## 🏗️ Scaling Techniques

### 1. Indexing
- **B-Tree**: Default for most indexes
- **Hash**: Memory tables
- **Full-Text**: Text search

### 2. Partitioning
- **Range**: By date (e.g., logs/audit trails)
- **Hash**: Even distribution across partitions
- **List**: Explicit value lists (e.g., region_id)

### 3. Sharding (Horizontal Scaling)
- Distributing data across multiple database servers based on a shard key (e.g., `user_id`).
- Essential for massive scale (Facebook, Uber).

---

## 🚀 Replication

- **Master-Slave**: Writes to Master, Reads from Slaves (Async/Semi-Sync)
- **Group Replication**: Multi-master, synchronous

---

## 📚 Resources

- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
