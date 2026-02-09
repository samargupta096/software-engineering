# 🍃 MongoDB Deep Dive

> Flexible, document-oriented NoSQL database.

---

## 📋 Key Concepts

| Concept | Description |
|---------|-------------|
| **Document** | BSON object (Binary JSON) |
| **Collection** | Group of documents (like a Table) |
| **Database** | Container for collections |
| **_id** | Primary key (ObjectId by default) |

---

## 🏗️ Architecture

- **Replica Sets**: High availability with automatic failover (Primary-Secondary)
- **Sharding**: Horizontal scaling via Shard Keys and Mongos Router
- **Journaling**: Durability and crash recovery

---

## 🚀 Use Cases

1. **Content Management**: Flexible schema for varied content
2. **Catalogs**: E-commerce product catalogs with nested attributes
3. **IoT**: Rapid ingestion of sensor data
4. **Mobile Apps**: Natural mapping of objects to documents

---

## 📚 Resources

- [MongoDB Documentation](https://www.mongodb.com/docs/)
