#  Oracle Deep Dive

> Enterprise-grade relational database management system (RDBMS).

---

## 📋 Key Features

| Feature | Description |
|---------|-------------|
| **RAC** | Real Application Clusters (High Availability) |
| **PL/SQL** | Procedural extensions for SQL |
| **Data Guard** | Disaster recovery solution |
| **Partitioning** | Advanced table partitioning strategies |
| **Multitenant** | Pluggable databases (PDB) in a container (CDB) |

---

## 🏗️ Architecture

- **SGA (System Global Area)**: Shared memory structure (Buffer Cache, Shared Pool)
- **PGA (Program Global Area)**: Private memory for each server process
- **Background Processes**: DB Writer (DBWn), Log Writer (LGWR), Checkpoint (CKPT)

---

## 🚀 Use Cases

1. **Enterprise Applications**: ERP, CRM, Core Banking
2. **Large-Scale Transaction Processing**: Mission-critical OLTP
3. **Data Warehousing**: Complex analytics and reporting

---

## 📚 Resources

- [Oracle Database Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
