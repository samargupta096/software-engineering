# 📅 AWS Developer Associate (DVA-C02) Master Study Plan

This comprehensive guide is designed to take you from concepts to exam-ready in **10 days**. It consolidates high-yield topics, a structured daily schedule, and deep dives into the most critical exam domains.

---

## 🎯 Exam Overview
- **Exam Code:** DVA-C02
- **Focus:** Building, deploying, and debugging cloud-native applications.
- **Passing Score:** 720/1000

| Domain | Weightage | Key Services |
| :--- | :--- | :--- |
| **1. Development with AWS Services** | **32%** | SDK, Lambda, DynamoDB, API Gateway, Step Functions, SQS/SNS |
| **2. Security** | **26%** | IAM, Cognito, KMS, Secrets Manager, STS |
| **3. Deployment** | **22%** | CloudFormation, SAM, CDK, CodePipeline, Elastic Beanstalk |
| **4. Troubleshooting & Monitoring** | **20%** | CloudWatch, X-Ray, CloudTrail |

---

## 🗓️ 10-Day High-Intensity Study Schedule

### Phase 1: The Core (Compute & Auth)
* **Day 1: IAM & SDK Fundamentals**
    *   **Focus:** IAM Roles vs Users, AssumeRole (STS), SDK Default Retry Behavior (Exponential Backoff), AuthN vs AuthZ.
    *   *Lab:* create a script using `boto3` to list S3 buckets using a specific profile.
* **Day 2: Serverless Compute (Lambda)**
    *   **Focus:** Execution Model, Cold Starts, Concurrency (Provisioned vs Reserved), Versions & Aliases, Layers.
    *   *Deep Dive:* VPC Access (needs NAT Gateway for internet).
* **Day 3: API Gateway & Orchestration**
    *   **Focus:** API Gateway Intents (REST vs HTTP), Integration Types (Proxy vs Non-Proxy), Throttling, Caching.
    *   **Workflow:** Step Functions (Standard vs Express) vs EventBridge (Choreography).

### Phase 2: Data & Storage
* **Day 4: DynamoDB Deep Dive** (🔥 **High Probability**)
    *   **Focus:** Partition Key Selection, LSI vs GSI, Query vs Scan, DAX, TTL, Streams.
    *   *Math:* RCU/WCU calculations (4KB read, 1KB write).
* **Day 5: S3 & Caching**
    *   **Focus:** Storage Classes, Encryption (SSE-S3, SSE-KMS, SSE-C), Presigned URLs, CloudFront (OAI/OAC).

### Phase 3: Integration & Messaging
* **Day 6: Decoupling Applications**
    *   **Focus:** SQS (Standard vs FIFO, Visibility Timeout, Long Polling), SNS (Fan-out pattern), Kinesis (Shards, Firehose).

### Phase 4: Developer Tools & Security
* **Day 7: CI/CD & IaC**
    *   **Focus:** CodeCommit, CodeBuild (`buildspec.yml`), CodeDeploy (`appspec.yml`), CodePipeline.
    *   **IaC:** CloudFormation (Resources, Parameters, Outputs), SAM (`template.yaml`), CDK.
* **Day 8: Security Deep Dive**
    *   **Focus:** KMS (Envelope Encryption), Secrets Manager (Rotation) vs Parameter Store, Cognito (User Pools vs Identity Pools).

### Phase 5: Monitoring & Review
* **Day 9: Observability**
    *   **Focus:** CloudWatch (Logs, Metrics, Alarms), X-Ray (Traces, Annotations vs Metadata), OpenSearch.
* **Day 10: Final Polish**
    *   **Action:** Review "Top 30 Questions" below and take a full mock exam.

---

## 🧠 Domain 1 Deep Dive: Development (32%)

### Mind Map: Building on AWS
*   **Architectural Patterns**:
    *   **Fan-out**: SNS Topic -> Multiple SQS Queues. (Reliability)
    *   **Orchestration**: Step Functions (Central Controller).
    *   **Choreography**: EventBridge (Decentralized events).
*   **Idempotency**: Safely retrying requests without side effects.
*   **Fault Tolerance**: retries + Exponential Backoff + Jitter.

### Master Exam Table
| Area | Service | Exam Trick / Keyword | Memory Hook |
| :--- | :--- | :--- | :--- |
| **Messaging** | **SQS** | "Decouple", "Buffer", "Throttle protection" | "Queue = Buffer" |
| **Pub/Sub** | **SNS** | "Fan-out", "Notification", "Push" | "One → Many" |
| **Events** | **EventBridge** | "SaaS integration", "Schema Registry", "Choreography" | "Event Bus" |
| **Workflow** | **Step Functions** | "Orchestrate", "Long-running", "Human approval" | "State Machine" |
| **Serverless** | **Lambda** | "15 min limit", "Stateless", "/tmp" | "No Brain (Stateless)" |
| **NoSQL** | **DynamoDB** | "Key-value", "Millisecond latency", "Hot partition" | "Query > Scan" |
| **Cache** | **ElastiCache/DAX** | "Microsecond latency", "In-memory" | "Cache Reads" |
| **Storage** | **S3** | "Object", "Static Website", "Presigned URL" | "Infinite Bucket" |

---

## 🔥 Top 30 MOST-REPEATED Domain 1 Questions

1.  **Q: Why are serverless apps designed to be stateless?**
    *   *A: Environments are ephemeral and can be destroyed anytime.*
2.  **Q: Best pattern to reduce tight coupling?**
    *   *A: Event-driven architecture using messaging (SQS/SNS).*
3.  **Q: Which service enables fan-out?**
    *   *A: SNS with multiple subscribers (SQS/Lambda).*
4.  **Q: What is idempotency?**
    *   *A: Ability to retry a request multiple times without duplicate side effects.*
5.  **Q: Lambda + SQS failure handling?**
    *   *A: Message is returned to queue, retried, then sent to DLQ if max receives exceeded.*
6.  **Q: Increasing Lambda memory also increases...?**
    *   *A: CPU allocation and Network bandwidth.*
7.  **Q: Which invocation type retries automatically in code?**
    *   *A: Asynchronous invocation (Twice: immediate, then after wait).*
8.  **Q: Why use exponential backoff?**
    *   *A: To prevent overwhelming downstream services during outages.*
9.  **Q: What does jitter solve?**
    *   *A: Prevents "thundering herd" (simultaneous retries striking at once).*
10. **Q: Why discourage DynamoDB Scan?**
    *   *A: Reads entire table, consumes massive RCUs, slow.*
11. **Q: What is a high-cardinality key?**
    *   *A: A key with many unique values (e.g., UserID). Prevents hot partitions.*
12. **Q: DynamoDB default consistency?**
    *   *A: Eventually consistent.*
13. **Q: When use strong consistency?**
    *   *A: When reading your own write immediately is mandatory (Banking).*
14. **Q: Purpose of Lambda Destinations?**
    *   *A: Route execution results (Success/Failure) to other services without writing custom code.*
15. **Q: Why can't VPC Lambda access the internet?**
    *   *A: It has no public IP. Needs a NAT Gateway in a public subnet.*
16. **Q: Caching strategy: loads only on miss?**
    *   *A: Lazy loading.*
17. **Q: Write-through caching?**
    *   *A: Cache updated simultaneously when DB is updated. Data is never stale.*
18. **Q: Purpose of TTL in caching?**
    *   *A: Automatic eviction to prevent stale data.*
19. **Q: GSI vs LSI?**
    *   *A: GSI = New Partition Key (Anytime). LSI = Same Partition Key (Creation time only).*
20. **Q: Benefit of async messaging?**
    *   *A: Decouples failures. If consumer dies, producer doesn't know/care.*
21. **Q: Service for choreography?**
    *   *A: EventBridge.*
22. **Q: Service for orchestration?**
    *   *A: Step Functions.*
23. **Q: Ephemeral storage for Lambda?**
    *   *A: `/tmp` (Max 10GB).*
24. **Q: Real-time streaming service?**
    *   *A: Kinesis Data Streams.*
25. **Q: Why are DLQs important?**
    *   *A: Isolate "poison pill" messages for debugging manual intervention.*
26. **Q: Low latency CRUD at scale?**
    *   *A: DynamoDB Query.*
27. **Q: How does Lambda scale?**
    *   *A: By creating concurrent execution environments.*
28. **Q: Benefit of loose coupling?**
    *   *A: Fault isolation (Blast radius reduction).*
29. **Q: Pattern for payment retries?**
    *   *A: Idempotency (Token-based).*
30. **Q: Async over sync for background jobs?**
    *   *A: Higher scalability and better user experience (Non-blocking).*

---

## ⚡ Tricky Scenarios & "Gotchas"

### 1. Lambda & SQS Performance
**Scenario:** SQS queue receiving 80 msgs/sec. Lambda takes 45s to process. How to keep up?
*   ❌ *Wrong:* Enable Provisioned Concurrency.
*   ✅ *Right:* **Increase Lambda Concurrency Limit** (Reserved). Tune **Batch Size**. Ensure **Visibility Timeout** > Processing Time (set to ~6x processing time or at least > 45s).

### 2. API Gateway 502 Errors
**Scenario:** Lambda works directly, but API Gateway returns 502 Bad Gateway.
*   ✅ *Cause:* **Malformed Response**. When using Proxy Integration, Lambda *must* return a specific JSON format: `{ "statusCode": 200, "body": "..." }`. If you return just a string or XML, API Gateway crashes with 502.

### 3. Lambda Permissions for SQS
**Scenario:** "Function's execution role does not have permissions to call SendMessage".
*   ✅ *Fix:* Attach a policy to the **Lambda Execution Role** allowing `sqs:SendMessage` on the specific **Queue ARN**. (Principle of Least Privilege).

### 4. Traffic Shifting (Canary)
**Scenario:** Shift 10% traffic to new version for 5 minutes, then 100%.
*   ✅ *Solution:* Use **Lambda Aliases** with **Weighted Routing** (Canary Deployment) in CodeDeploy.

### 5. Private Lambda Internet Access
**Scenario:** Lambda in Private Subnet needs to call DynamoDB and Google.com.
*   ✅ *DynamoDB:* Use **VPC Gateway Endpoint** (Keeps traffic on AWS network, free).
*   ✅ *Google.com:* Use **NAT Gateway** in a Public Subnet (Allows egress to internet).
