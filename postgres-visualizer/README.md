# PostgreSQL Internals — Interactive Visualizer

An interactive, single-page web application that teaches PostgreSQL internals through live, animated visualizations.

## 🎯 Sections

| # | Topic | Interactive Feature |
|---|-------|-------------------|
| 01 | Architecture Overview | Animated client → postmaster → backend diagram |
| 02 | Process Model | Spawn/kill backend processes dynamically |
| 03 | Shared Memory & Buffer Pool | Read/write page simulation with hit ratio tracking |
| 04 | Query Execution Pipeline | Step-through query stages with EXPLAIN output |
| 05 | MVCC | INSERT/UPDATE/DELETE with xmin/xmax visibility |
| 06 | WAL | Write → crash → recovery simulation |
| 07 | Indexing (B-Tree) | Build B-Tree, compare seq scan vs index scan |
| 08 | VACUUM & Dead Tuples | Bloat accumulation and vacuum cleanup |
| 09 | Transaction Isolation | Anomaly demos for each isolation level |
| 10 | Locks & Deadlocks | Lock conflict and deadlock detection simulation |
| 11 | Query Planner | Cost-based scan strategy comparison |
| 12 | Connection Pooling | With/without pooling resource comparison |
| 13 | Replication | Streaming replication with failover |
| 14 | Partitioning | Range/list/hash partition routing |
| 15 | TOAST | Oversized attribute storage visualization |

## 🚀 How to View

Simply open `index.html` in any modern browser:

```bash
# Option 1: Direct file open
open index.html

# Option 2: Local server
python3 -m http.server 8080
# Then visit http://localhost:8080
```

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Dark mode design with glassmorphism, animations
- **Vanilla JavaScript** — All interactive logic, no dependencies

## 📸 Design

- PostgreSQL-inspired color palette (deep blue #336791, teal accents)
- Premium dark mode with glassmorphism effects
- Smooth animations and micro-interactions
- Fully responsive layout
