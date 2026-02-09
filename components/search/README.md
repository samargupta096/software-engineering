# Search Documentation 🔍

> Comprehensive learning resources for Elasticsearch and search technologies.

---

## 📚 Documentation Index

| Document | Level | Time | Description |
|----------|-------|------|-------------|
| [🚀 Learning Hub](./elasticsearch-deep-dive.md) | Beginner | 10 min | **Start here!** Overview, learning path, and navigation |
| [📖 Research Guide](./elasticsearch-research.md) | Intermediate | 45 min | Core concepts, Query DSL, aggregations, examples |
| [⚙️ Internals & Architecture](./elasticsearch-internals-architecture.md) | Advanced | 60 min | Deep internals, Lucene, memory, best practices |

---

## 🎯 Recommended Learning Paths

### Path 1: Quick Start (30 min)
```mermaid
graph LR
    A[Learning Hub] --> B[Research: Core Concepts]
    B --> C[Try Basic Queries]
    style A fill:#4CAF50,color:white
    style B fill:#2196F3,color:white
    style C fill:#FF9800,color:white
```

### Path 2: Full Deep Dive (2-3 hours)
```mermaid
graph LR
    A[Learning Hub] --> B[Research Guide]
    B --> C[Internals]
    C --> D[Best Practices]
    style A fill:#4CAF50,color:white
    style B fill:#2196F3,color:white
    style C fill:#9C27B0,color:white
    style D fill:#FF5722,color:white
```

---

## 🗂️ Topics Covered

### Fundamentals
- Cluster, Node, Index, Document, Shard, Replica
- How Elasticsearch stores and searches data
- Inverted index and full-text search

### Query DSL
- Match, Term, Bool, Range queries
- Aggregations (metrics, bucket, pipeline)
- Geo-spatial and nested queries

### Architecture & Internals
- Lucene integration and segment management
- Memory architecture (Heap vs OS cache)
- Transaction logs and durability
- Hot-Warm-Cold architecture

### Best Practices
- Shard sizing and allocation
- Query optimization
- Production deployment checklist

---

## 🔗 Quick Links

- [Official Elasticsearch Docs](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch: The Definitive Guide](https://www.elastic.co/guide/en/elasticsearch/guide/current/index.html)
- [Lucene in Action](https://www.manning.com/books/lucene-in-action)

---

> 💡 **Tip:** Click the badges at the top of each document to navigate between files.
