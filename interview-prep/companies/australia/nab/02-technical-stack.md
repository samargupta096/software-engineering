# NAB Technical Stack & Ada Platform

## 🏗️ Ada Cloud Data Platform

Ada is NAB's **target-state cloud data platform** - the central focus of this role.

### Ada Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA CONSUMERS                           │
│    (Business Users, Analytics Teams, ML/AI Applications)       │
├─────────────────────────────────────────────────────────────────┤
│                      VISUALIZATION LAYER                        │
│                         Power BI                                │
├─────────────────────────────────────────────────────────────────┤
│                    PROCESSING & ANALYTICS                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    DATABRICKS                            │   │
│  │  • ETL Processing    • Machine Learning                  │   │
│  │  • Analytics         • Generative AI                     │   │
│  │  • Databricks SQL    • Unity Catalog (Governance)        │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     DATA INGESTION LAYER                        │
│  ┌──────────────────┐  ┌──────────────────────────────────┐    │
│  │     Fivetran     │  │     Custom Java Services         │    │
│  │  (Real-time ETL) │  │  (APIs, Microservices)           │    │
│  └──────────────────┘  └──────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                     CLOUD INFRASTRUCTURE                        │
│                      Amazon Web Services (AWS)                  │
│         (S3, EC2, RDS/PostgreSQL, Lambda, etc.)                │
├─────────────────────────────────────────────────────────────────┤
│                       DATA SOURCES                              │
│    (Core Banking, Transactions, Customer Data, etc.)            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Cloud Infrastructure** | AWS | Hosting, compute, storage |
| **Data Processing** | Databricks | ETL, analytics, ML |
| **Data Ingestion** | Fivetran | Real-time data movement |
| **Visualization** | Power BI | Dashboards, reporting |
| **Governance** | Unity Catalog | Lineage, access control, masking |
| **Backend Services** | Java Microservices | APIs, data services |
| **Database** | PostgreSQL | Operational data storage |

---

## ☕ Java Technology Stack

### Core Java Skills Required

| Area | Technologies |
|------|--------------|
| **Java Version** | Java 11+ (likely Java 17 or 21) |
| **Frameworks** | Spring Boot, Spring Cloud |
| **Build Tools** | Maven/Gradle |
| **API Development** | REST APIs, OpenAPI/Swagger |
| **ORM** | JPA/Hibernate |
| **Testing** | JUnit 5, Mockito, Integration Tests |

### Spring Ecosystem Components

```
Spring Boot (Core)
    ├── Spring Web (REST APIs)
    ├── Spring Data JPA (Database Access)
    ├── Spring Security (Authentication/Authorization)
    ├── Spring Cloud Config (Externalized Configuration)
    ├── Spring Cloud Gateway (API Gateway)
    ├── Spring Cloud Sleuth (Distributed Tracing)
    └── Spring Actuator (Health & Metrics)
```

---

## 🔧 Microservices Architecture at NAB

### Architecture Patterns Used

1. **API Gateway Pattern** - Single entry point for all services
2. **Service Discovery** - Dynamic service registration (Eureka/Consul)
3. **Circuit Breaker** - Resilience4j for fault tolerance
4. **Event-Driven** - Kafka for async communication
5. **CQRS** - Command Query Responsibility Segregation
6. **Saga Pattern** - Distributed transaction management

### Communication Patterns

```
Synchronous:
  • REST APIs (HTTP/HTTPS)
  • gRPC (for internal services)

Asynchronous:
  • Apache Kafka (Event Streaming)
  • AWS SQS (Message Queues)
  • Event Sourcing
```

### Observability Stack

| Aspect | Tools |
|--------|-------|
| **Logging** | ELK Stack (Elasticsearch, Logstash, Kibana) |
| **Metrics** | Prometheus, Grafana |
| **Tracing** | Jaeger/Zipkin, OpenTelemetry |
| **APM** | Dynatrace/New Relic |

---

## ☁️ AWS Services to Know

### Likely AWS Services Used

| Category | Services |
|----------|----------|
| **Compute** | EC2, ECS, EKS, Lambda |
| **Database** | RDS (PostgreSQL), DynamoDB |
| **Storage** | S3, EBS |
| **Networking** | VPC, API Gateway, Route 53, ELB |
| **Security** | IAM, Secrets Manager, KMS |
| **Messaging** | SQS, SNS, Kinesis |
| **DevOps** | CodePipeline, CodeBuild, CloudFormation |

### AWS Well-Architected Framework Pillars
1. Operational Excellence
2. Security
3. Reliability
4. Performance Efficiency
5. Cost Optimization
6. Sustainability

---

## 🗃️ PostgreSQL Knowledge

### Topics to Review

1. **SQL Fundamentals**
   - Complex queries with JOINs
   - Window functions (ROW_NUMBER, RANK, LEAD/LAG)
   - CTEs (Common Table Expressions)
   - Subqueries and correlated subqueries

2. **Performance Optimization**
   - EXPLAIN ANALYZE
   - Index types (B-tree, Hash, GIN, GiST)
   - Query optimization techniques
   - Connection pooling (PgBouncer)

3. **Advanced Features**
   - JSONB data type
   - Partitioning
   - Stored procedures (PL/pgSQL)
   - Triggers and constraints

### Sample Interview Question
```sql
-- Find the top 3 customers by transaction volume per month
WITH monthly_transactions AS (
    SELECT 
        customer_id,
        DATE_TRUNC('month', transaction_date) as month,
        COUNT(*) as txn_count,
        SUM(amount) as total_amount
    FROM transactions
    GROUP BY customer_id, DATE_TRUNC('month', transaction_date)
),
ranked AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY month ORDER BY total_amount DESC) as rank
    FROM monthly_transactions
)
SELECT * FROM ranked WHERE rank <= 3;
```

---

## 🔄 DevOps & CI/CD

### Practices to Be Familiar With

| Practice | Tools/Concepts |
|----------|----------------|
| **Version Control** | Git, GitFlow, Feature Branching |
| **CI/CD** | Jenkins, GitLab CI, AWS CodePipeline |
| **Containerization** | Docker, Docker Compose |
| **Orchestration** | Kubernetes, EKS |
| **IaC** | Terraform, CloudFormation |
| **Monitoring** | CloudWatch, Prometheus |

### Deployment Strategies
- Blue-Green Deployment
- Canary Releases
- Rolling Updates
- Feature Flags

---

## 📊 Data Engineering Concepts

### Key Areas from JD

1. **Dimensional Data Modeling**
   - Star Schema
   - Snowflake Schema
   - Fact and Dimension Tables

2. **Data Pipeline Patterns**
   - Batch Processing
   - Stream Processing
   - Change Data Capture (CDC)

3. **Data Quality**
   - Data Validation
   - Data Lineage
   - Master Data Management

---

## 💡 Interview Tip

> When discussing technical architecture, frame your answers around NAB's goals:
> - **"Right data → Right customer → Right time → Right cost"**
> - Emphasize **cloud-native**, **resilient**, and **performant** solutions
> - Connect your experience to building **reusable data assets**

