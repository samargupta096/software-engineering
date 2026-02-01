[🏠 Home](../../README.md) | [🗄️ DBMS Roadmap](./00-roadmap.md) | [⬅️ Isolation Levels](./10-isolation-levels.md) | [➡️ SQL Commands](./12-sql-commands.md)

# 🔄 MVCC (Multi-Version Concurrency Control)

> How modern databases let readers and writers coexist without blocking.

---

## 📊 Quick Reference

| Concept | Description |
|---------|-------------|
| **MVCC** | Keep multiple versions of data |
| **Snapshot** | Point-in-time view of database |
| **Version Chain** | Linked list of row versions |
| **Garbage Collection** | Remove old versions (vacuuming) |

---

## 🤔 The Problem MVCC Solves

Traditional locking:
```
Reader waits for Writer → Slow!
Writer waits for Reader → Slow!
```

MVCC:
```
Reader reads old version → No wait!
Writer creates new version → No wait!
```

```mermaid
flowchart LR
    subgraph "Lock-Based"
        R1["Reader"] --> |"Blocked"| Data["Data"]
        W1["Writer"] --> |"Holds lock"| Data
    end
    
    subgraph "MVCC"
        R2["Reader"] --> V1["Version 1 (Old)"]
        W2["Writer"] --> V2["Version 2 (New)"]
    end
```

---

## 🏗️ How MVCC Works

Each row has hidden columns for versioning:

```mermaid
flowchart TB
    subgraph "Row Structure"
        Row["| ID | Name | Price | xmin | xmax |"]
        Xmin["xmin = Creating transaction ID"]
        Xmax["xmax = Deleting/updating transaction ID"]
    end
    
    Row --> Xmin
    Row --> Xmax
```

### PostgreSQL Example

| id | name | price | xmin | xmax |
|----|------|-------|------|------|
| 1 | Book | $10 | 100 | ∞ |

**After UPDATE (txn 200):**

| id | name | price | xmin | xmax |
|----|------|-------|------|------|
| 1 | Book | $10 | 100 | 200 | ← Old version |
| 1 | Book | $15 | 200 | ∞ | ← New version |

---

## 📸 Snapshot Isolation

Transaction sees a consistent snapshot from when it started.

```mermaid
sequenceDiagram
    participant T1 as T1 (Started: ts=100)
    participant DB
    participant T2 as T2 (Started: ts=150)
    
    Note over T1: Takes snapshot at ts=100
    T2->>DB: UPDATE price = 20
    T2->>DB: COMMIT (ts=150)
    T1->>DB: SELECT price
    DB-->>T1: Returns 10 (from snapshot!)
    Note over T1: T1 doesn't see T2's change
```

### Visibility Rules

A version is visible to transaction T if:
1. `xmin` is committed AND `xmin < T.start_ts`
2. `xmax` is uncommitted OR `xmax > T.start_ts`

```mermaid
flowchart TB
    Check["Is version visible?"]
    Check --> C1{"xmin committed?"}
    C1 --> |No| Hidden["Hidden ❌"]
    C1 --> |Yes| C2{"xmin < my start?"}
    C2 --> |No| Hidden
    C2 --> |Yes| C3{"xmax exists?"}
    C3 --> |No| Visible["Visible ✅"]
    C3 --> |Yes| C4{"xmax committed & < my start?"}
    C4 --> |Yes| Hidden
    C4 --> |No| Visible
```

---

## 🗑️ Garbage Collection (Vacuum)

Old versions accumulate. Must be cleaned up.

```mermaid
flowchart LR
    subgraph "Before Vacuum"
        V1["Version 1 (Old)"]
        V2["Version 2 (Old)"]
        V3["Version 3 (Current)"]
    end
    
    subgraph "After Vacuum"
        V4["Version 3 (Current)"]
    end
    
    V1 & V2 --> |"Removed"| Vacuum["VACUUM Process"]
    Vacuum --> V4
```

### PostgreSQL Vacuum

| Type | Description |
|------|-------------|
| **VACUUM** | Marks dead tuples as reusable |
| **VACUUM FULL** | Compacts table (rewrites) |
| **Autovacuum** | Background daemon |

**Why it matters:** Without vacuum, table bloats, queries slow down.

---

## 🆚 MVCC Implementations

### PostgreSQL

- Stores multiple physical copies
- xmin/xmax in each row
- Requires VACUUM for cleanup

### MySQL InnoDB

- Undo log for old versions
- Roll pointer in row header
- Purge thread for cleanup

```mermaid
flowchart TB
    subgraph "PostgreSQL"
        PG1["Row v1 (in table)"]
        PG2["Row v2 (in table)"]
        PG3["Row v3 (in table)"]
    end
    
    subgraph "MySQL InnoDB"
        MY1["Current Row (in table)"]
        MY2["Undo Log:\n- v2 delta\n- v1 delta"]
    end
```

---

## ⚔️ Write Conflicts

MVCC prevents read anomalies but writes can still conflict.

```mermaid
sequenceDiagram
    participant T1
    participant DB
    participant T2
    
    T1->>DB: Read row (version 1)
    T2->>DB: Read row (version 1)
    T1->>DB: UPDATE row (creates version 2)
    T2->>DB: UPDATE row
    Note over DB: Conflict! T2 modifying stale version
    
    alt First-Committer-Wins
        DB-->>T2: ERROR: could not serialize
    else Last-Writer-Wins
        DB-->>T2: Overwrites T1's change
    end
```

### Handling Write Conflicts

| Strategy | Description |
|----------|-------------|
| **First-Committer-Wins** | PostgreSQL SSI, abort later transaction |
| **Last-Writer-Wins** | Some NoSQL, accept data loss |
| **Application Retry** | Catch error, retry transaction |

---

## 📊 MVCC Benefits & Costs

| Benefits | Costs |
|----------|-------|
| ✅ Readers never block writers | ❌ Storage overhead (versions) |
| ✅ Writers never block readers | ❌ Vacuum/purge overhead |
| ✅ Consistent reads (snapshot) | ❌ Long transactions hold old versions |
| ✅ No deadlocks from reads | ❌ Write-write conflicts still possible |

---

## 🧠 Interview Questions

1. **Q: What is MVCC and why is it used?**
   - **A:** Multi-Version Concurrency Control keeps multiple versions of each row. This allows readers to see a consistent snapshot while writers create new versions. Result: Readers never block writers and vice versa.

2. **Q: How does PostgreSQL implement MVCC?**
   - **A:** Each row has `xmin` (creating txn) and `xmax` (deleting txn) hidden columns. Updates create new row versions. Old versions are cleaned by VACUUM.

3. **Q: What is the VACUUM command?**
   - **A:** Garbage collection in PostgreSQL. Removes old row versions that are no longer visible to any transaction. Without it, tables bloat.

4. **Q: Can MVCC prevent all anomalies?**
   - **A:** It prevents read anomalies (dirty reads, non-repeatable reads). But write-write conflicts (lost updates) require additional mechanisms like serializable isolation or application-level locking.

---
