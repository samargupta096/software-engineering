# Data Engineering & AWS Interview Questions

## 📊 Data Engineering Concepts

### Q1: Dimensional Data Modeling

**Star Schema vs Snowflake Schema**

| Aspect | Star Schema | Snowflake Schema |
|--------|-------------|------------------|
| Dimension tables | Denormalized | Normalized |
| Query performance | Faster | Slower (more joins) |
| Storage | More redundancy | Less redundancy |
| ETL complexity | Simpler | Complex |

**Fact Table Types:**
- **Transaction Facts** - Individual events
- **Snapshot Facts** - Periodic snapshots
- **Accumulating Facts** - Track process milestones

### Q2: Data Pipeline Patterns

**Batch vs Stream Processing:**
- **Batch**: Daily/hourly, high throughput, higher latency
- **Stream**: Real-time, continuous, lower latency

**ETL vs ELT:**
- **ETL**: Transform before loading (traditional)
- **ELT**: Load first, transform in data warehouse (modern)

### Q3: Change Data Capture (CDC)

Captures database changes for replication/streaming:
- **Log-based CDC**: Read database transaction logs
- **Trigger-based CDC**: Database triggers write changes
- **Query-based CDC**: Compare snapshots (slower)

Tools: Debezium, AWS DMS, Fivetran (used at NAB)

### Q4: Data Quality & Governance

Key practices:
- Data validation at ingestion
- Schema enforcement
- Data lineage tracking (Unity Catalog at NAB)
- Access control and masking
- Alerting on quality issues

---

## ☁️ AWS Services Questions

### Q5: Core AWS Services

| Service | Purpose | Use Case |
|---------|---------|----------|
| EC2 | Compute | Application servers |
| S3 | Object Storage | Data lake storage |
| RDS | Managed DB | PostgreSQL databases |
| Lambda | Serverless | Event-driven processing |
| ECS/EKS | Containers | Microservices deployment |
| SQS/SNS | Messaging | Async communication |
| Kinesis | Streaming | Real-time data ingestion |

### Q6: AWS Well-Architected Framework

**6 Pillars:**
1. Operational Excellence - Monitoring, automation
2. Security - IAM, encryption, compliance
3. Reliability - Fault tolerance, recovery
4. Performance Efficiency - Right-sizing, caching
5. Cost Optimization - Reserved instances, rightsizing
6. Sustainability - Environmental impact

### Q7: High Availability Patterns

- Multi-AZ deployments
- Auto Scaling Groups
- Load Balancers (ALB/NLB)
- Route 53 health checks
- Cross-region replication

### Q8: Security Best Practices

- **IAM**: Least privilege, role-based access
- **KMS**: Encryption at rest
- **TLS/SSL**: Encryption in transit
- **VPC**: Network isolation
- **Secrets Manager**: Credential management
- **CloudTrail**: Audit logging

---

## 🔧 SQL & PostgreSQL Questions

### Q9: Window Functions

```sql
-- Running total
SELECT 
    date,
    amount,
    SUM(amount) OVER (ORDER BY date) as running_total
FROM transactions;

-- Top 3 per category
SELECT * FROM (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY category ORDER BY amount DESC) as rn
    FROM products
) ranked WHERE rn <= 3;
```

### Q10: Query Optimization

- **EXPLAIN ANALYZE**: Understand query plan
- **Indexes**: B-tree, GIN (for JSONB), partial indexes
- **Partitioning**: Range, list, hash partitions
- **Connection Pooling**: PgBouncer

### Q11: Common Table Expressions (CTEs)

```sql
WITH monthly_agg AS (
    SELECT 
        DATE_TRUNC('month', txn_date) as month,
        SUM(amount) as total
    FROM transactions
    GROUP BY 1
)
SELECT 
    month,
    total,
    LAG(total) OVER (ORDER BY month) as prev_month
FROM monthly_agg;
```

---

## 🎯 NAB-Specific Context

### Ada Platform Technologies

- **Databricks**: ETL, ML, analytics
- **Fivetran**: Real-time data ingestion
- **AWS**: Cloud infrastructure
- **Power BI**: Visualization

### Key JD Requirements

1. Build reusable data assets
2. Create resilient data pipelines
3. Ensure data quality and governance
4. Enable real-time analytics

### Sample Interview Question

> "Design a real-time customer 360 data pipeline for NAB that aggregates data from multiple sources (transactions, interactions, products) into a unified view."

**Approach:**
1. Ingest via Fivetran/Kafka
2. Process with Databricks streaming
3. Store in Delta Lake
4. Unity Catalog for governance
5. Power BI for dashboards

