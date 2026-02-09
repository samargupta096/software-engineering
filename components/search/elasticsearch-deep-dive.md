# 🔍 Elasticsearch Deep Dive

> Distributed, RESTful search and analytics engine.

---

## 📋 Key Concepts

| Concept | Description |
|---------|-------------|
| **Index** | Collection of documents (like a DB table) |
| **Document** | JSON object storing data |
| **Shard** | Horizontal partition of an index |
| **Replica** | Copy of a shard for high availability |
| **Node** | Single server instance |
| **Cluster** | Collection of nodes |

---

## 🏗️ Architecture

- **Master Node**: Cluster management
- **Data Node**: Storage and query execution
- **Ingest Node**: Pre-processing pipeline
- **Coordinator Node**: Request routing

---

## 📝 Common Use Cases

1. **Full-Text Search**: E-commerce product search
2. **Log Analytics**: ELK Stack (Elasticsearch, Logstash, Kibana)
3. **Metrics**: Infrastructure monitoring
4. **Security**: SIEM (Security Information and Event Management)

---

## 📚 Resources

- [Official Documentation](https://www.elastic.co/guide/index.html)
