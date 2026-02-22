[🏠 Home](../README.md) | [⬅️ Terraform Project](../devops/terraform/terraform-real-world-project.md) | [➡️ AWS CDK](./aws-cdk-guide.md)

# ☁️ AWS Services Deep Dive

> Comprehensive guide to AWS services with diagrams, use cases, and architecture patterns

---

## 📋 Quick Reference: Service Categories

| Category | Services | Use Case |
| :--- | :--- | :--- |
| **Compute** | Lambda, ECS, EKS, Beanstalk, EC2 | Run code & applications |
| **Storage** | S3, EBS, EFS | Store files & data |
| **Networking** | VPC, ELB, API Gateway, Route 53 | Network & traffic |
| **Messaging** | SQS, SNS, EventBridge | Async communication |
| **Orchestration** | Step Functions | Workflow automation |
| **Monitoring** | CloudWatch, X-Ray | Observability |
| **IaC** | CDK, CloudFormation | Infrastructure as Code |

---

## 📊 AWS Services Interaction Map

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            AWS ARCHITECTURE OVERVIEW                          │
└──────────────────────────────────────────────────────────────────────────────┘

  👤 User
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────────────┐
│  Route 53   │────▶│ CloudFront  │────▶│        Application Load Balancer     │
│    (DNS)    │     │    (CDN)    │     │              (ALB)                   │
└─────────────┘     └─────────────┘     └─────────────────────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────┐
                    │                                   │                       │
                    ▼                                   ▼                       ▼
            ┌─────────────┐                     ┌─────────────┐         ┌─────────────┐
            │   Lambda    │                     │     ECS     │         │     EC2     │
            │ (Serverless)│                     │ (Containers)│         │    (VMs)    │
            └─────────────┘                     └─────────────┘         └─────────────┘
                    │                                   │                       │
                    └───────────────────────────────────┼───────────────────────┘
                                                        │
                    ┌───────────────────────────────────┼───────────────────────┐
                    │                                   │                       │
                    ▼                                   ▼                       ▼
            ┌─────────────┐                     ┌─────────────┐         ┌─────────────┐
            │     S3      │                     │     RDS     │         │  DynamoDB   │
            │  (Storage)  │                     │    (SQL)    │         │  (NoSQL)    │
            └─────────────┘                     └─────────────┘         └─────────────┘
```

---

## 1️⃣ Amazon S3 (Simple Storage Service)

### What is S3?

> Object storage with unlimited capacity, 99.999999999% (11 nines) durability

```text
┌─────────────────────────────────────────────────────────┐
│                    S3 BUCKET STRUCTURE                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   📦 my-app-bucket                                       │
│       │                                                  │
│       ├── 📁 images/                                     │
│       │       ├── logo.png                               │
│       │       └── banner.jpg                             │
│       │                                                  │
│       ├── 📁 videos/                                     │
│       │       └── intro.mp4                              │
│       │                                                  │
│       └── 📁 data/                                       │
│               └── users.json                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 📊 Storage Classes Comparison

| Class | Use Case | Retrieval | Cost |
| :--- | :--- | :--- | :--- |
| **S3 Standard** | Frequently accessed | Immediate | 💰💰💰 |
| **S3 IA** | Infrequent access | Immediate | 💰💰 |
| **S3 Glacier** | Archive (minutes) | 1-5 minutes | 💰 |
| **S3 Glacier Deep** | Long-term archive | 12 hours | 💰 (cheapest) |
| **S3 Intelligent** | Unknown patterns | Auto-tiered | Variable |

### Use Case 1: Static Website Hosting

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      STATIC WEBSITE ON S3                                 │
└──────────────────────────────────────────────────────────────────────────┘

  👤 User ────▶ CloudFront (CDN) ────▶ S3 Bucket
                     │                    │
                     │                    ├── index.html
                     │                    ├── styles.css
               (Caches content           ├── app.js
                at edge)                 └── images/
```

### Use Case 2: Data Lake Architecture

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATA LAKE ON S3                                   │
└──────────────────────────────────────────────────────────────────────────┘

  DATA SOURCES              INGESTION              S3 DATA LAKE           ANALYTICS
 ┌───────────┐                                   ┌──────────────┐
 │ App Logs  │─────┐                             │  Raw Zone    │
 └───────────┘     │     ┌─────────────┐         ├──────────────┤       ┌─────────┐
                   ├────▶│  Kinesis    │────────▶│ Processed    │──────▶│ Athena  │
 ┌───────────┐     │     │  Firehose   │         ├──────────────┤       └─────────┘
 │IoT Devices│─────┤     └─────────────┘         │  Curated     │       ┌─────────┐
 └───────────┘     │                             └──────────────┘   ───▶│Redshift │
                   │     ┌─────────────┐               │                └─────────┘
 ┌───────────┐     │     │  AWS Glue   │               │                ┌─────────┐
 │ Database  │─────┴────▶│   (ETL)     │───────────────┘            ───▶│QuickSight
 └───────────┘           └─────────────┘                                └─────────┘
```

### S3 Event Triggers

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         S3 EVENT TRIGGERS                                 │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                    ┌───▶│     Lambda      │───▶ Process Image
                    │    │   (Function)    │
                    │    └─────────────────┘
  ┌──────────┐      │
  │    S3    │──────┼───▶┌─────────────────┐
  │  Bucket  │      │    │      SNS        │───▶ Send Notification
  │          │      │    │    (Topic)      │
  └──────────┘      │    └─────────────────┘
       │            │
   (Events:         └───▶┌─────────────────┐
    - Created)           │      SQS        │───▶ Queue for Processing
    - Deleted)           │    (Queue)      │
                         └─────────────────┘
```

---

## 2️⃣ AWS Lambda

### What is Lambda?

> Serverless compute - run code without managing servers. Pay only for execution time.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         LAMBDA ARCHITECTURE                               │
└──────────────────────────────────────────────────────────────────────────┘

   TRIGGERS                    LAMBDA                       OUTPUTS
   ────────                    ──────                       ───────

 ┌─────────────┐           ┌─────────────┐           ┌─────────────┐
 │ API Gateway │──────────▶│             │──────────▶│  DynamoDB   │
 └─────────────┘           │             │           └─────────────┘
                           │   λ Lambda  │
 ┌─────────────┐           │   Function  │           ┌─────────────┐
 │  S3 Event   │──────────▶│             │──────────▶│     S3      │
 └─────────────┘           │  (Your Code)│           └─────────────┘
                           │             │
 ┌─────────────┐           │   Runtime:  │           ┌─────────────┐
 │ SQS Message │──────────▶│  Node.js    │──────────▶│     SNS     │
 └─────────────┘           │  Python     │           └─────────────┘
                           │  Java       │
 ┌─────────────┐           │             │           ┌─────────────┐
 │  CloudWatch │──────────▶│             │──────────▶│     SQS     │
 │   (Cron)    │           │             │           └─────────────┘
 └─────────────┘           └─────────────┘
```

### 📊 Lambda Limits & Pricing

| Aspect | Limit/Info |
|--------|------------|
| **Memory** | 128 MB - 10 GB |
| **Timeout** | Max 15 minutes |
| **Package Size** | 50 MB (zip), 250 MB (unzipped) |
| **Concurrency** | 1000 (soft limit) |
| **Pricing** | $0.20 per 1M requests |
| **Free Tier** | 1M requests/month |

### Use Case 1: REST API Backend

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      SERVERLESS REST API                                  │
└──────────────────────────────────────────────────────────────────────────┘

  👤 Client
      │
      ▼
 ┌──────────────┐
 │ API Gateway  │
 └──────────────┘
        │
        ├── GET /users ───────▶ λ listUsers ─────┐
        │                                        │
        ├── POST /users ──────▶ λ createUser ────┼────▶ ┌──────────────┐
        │                                        │      │   DynamoDB   │
        ├── GET /users/:id ───▶ λ getUser ───────┤      │    (NoSQL)   │
        │                                        │      └──────────────┘
        └── DELETE /users/:id ▶ λ deleteUser ────┘
```

### Use Case 2: Image Processing Pipeline

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      IMAGE PROCESSING PIPELINE                            │
└──────────────────────────────────────────────────────────────────────────┘

  📱 User Upload
        │
        ▼
  ┌────────────┐     ┌────────────┐     ┌────────────────┐
  │API Gateway │────▶│  Lambda    │────▶│ S3 Raw Bucket  │
  │            │     │ (Upload)   │     │                │
  └────────────┘     └────────────┘     └────────────────┘
                                               │
                                         (S3 Event Trigger)
                                               │
                                               ▼
                                        ┌────────────┐
                                        │  Lambda    │
                                        │ (Process)  │
                                        └────────────┘
                                               │
                     ┌─────────────────────────┼─────────────────────────┐
                     │                         │                         │
                     ▼                         ▼                         ▼
              ┌────────────┐           ┌────────────┐            ┌────────────┐
              │ Thumbnail  │           │  Compress  │            │  Metadata  │
              └────────────┘           └────────────┘            └────────────┘
                     │                         │                         │
                     ▼                         ▼                         ▼
              ┌─────────────────────────────────────┐            ┌────────────┐
              │        S3 Processed Bucket          │            │  DynamoDB  │
              └─────────────────────────────────────┘            └────────────┘
```

### Use Case 3: Scheduled Tasks (Cron)

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULED LAMBDA                                  │
└──────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────┐           ┌────────────┐
  │  CloudWatch Events │──────────▶│   Lambda   │
  │  (rate: 1 hour)    │           │            │
  └────────────────────┘           └────────────┘
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
                     ▼                   ▼                   ▼
              ┌────────────┐      ┌────────────┐      ┌────────────┐
              │  Cleanup   │      │  Generate  │      │   Sync     │
              │  Old Data  │      │  Reports   │      │  External  │
              └────────────┘      └────────────┘      └────────────┘
```

---

## 3️⃣ AWS Step Functions

### What is Step Functions?

> Visual workflow orchestration for coordinating multiple AWS services

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                      STEP FUNCTION WORKFLOW                               │
└──────────────────────────────────────────────────────────────────────────┘

                              ┌─────────┐
                              │  START  │
                              └────┬────┘
                                   │
                                   ▼
                            ┌────────────┐
                            │  Validate  │
                            │   Input    │
                            └─────┬──────┘
                                  │
                                  ▼
                            ┌────────────┐
                      ┌─────│ Payment OK?│─────┐
                      │     └────────────┘     │
                      │ Yes                    │ No
                      ▼                        ▼
               ┌────────────┐          ┌────────────┐
               │  Process   │          │   Notify   │
               │   Order    │          │  Failure   │
               └─────┬──────┘          └─────┬──────┘
                     │                       │
          ┌─────────┬┴────────┐              │
          ▼         ▼         ▼              │
     ┌─────────┐ ┌─────────┐ ┌─────────┐     │
     │ Update  │ │  Send   │ │ Update  │     │
     │Inventory│ │  Email  │ │Analytics│     │
     └────┬────┘ └────┬────┘ └────┬────┘     │
          │          │           │           │
          └──────────┴───────────┴───────────┤
                                             ▼
                                       ┌──────────┐
                                       │   END    │
                                       └──────────┘
```

### Step Function States

| State Type | Purpose | Example |
|------------|---------|---------|
| **Task** | Execute a Lambda or service | `InvokePaymentLambda` |
| **Choice** | Branching logic | `if amount > 1000` |
| **Parallel** | Run tasks concurrently | Process multiple files |
| **Wait** | Pause execution | Wait for human approval |
| **Pass** | Transform data | Add fields to payload |
| **Fail/Succeed** | End workflow | Mark complete/failed |

### Step Functions vs Lambda

| Aspect | Lambda Only | Step Functions |
|--------|-------------|----------------|
| **Timeout** | 15 min max | Up to 1 year |
| **Error Handling** | Manual retry logic | Built-in retries |
| **State** | Stateless | Maintains state |
| **Visualization** | None | Visual workflow |
| **Debugging** | CloudWatch logs | Visual execution history |
| **Cost** | Per invocation | Per state transition |

---

## 4️⃣ AWS CDK (Cloud Development Kit)

### What is CDK?

> Define cloud infrastructure using TypeScript, Python, Java, or C#

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CDK WORKFLOW                                     │
└──────────────────────────────────────────────────────────────────────────┘

  TypeScript Code          CloudFormation           AWS Resources
  ───────────────          ──────────────           ─────────────

  ┌────────────┐    cdk    ┌────────────┐   cdk    ┌────────────┐
  │  app.ts    │──synth───▶│   JSON/    │─deploy──▶│   Lambda   │
  │            │           │   YAML     │          │   S3, etc  │
  └────────────┘           └────────────┘          └────────────┘
```

### CDK vs Other IaC Tools

| Tool | Language | Learning Curve | Flexibility |
|------|----------|----------------|-------------|
| **CDK** | TS, Python, Java | 🟡 Medium | 🟢 High |
| **CloudFormation** | YAML/JSON | 🔴 High | 🟢 High |
| **Terraform** | HCL | 🟡 Medium | 🟢 High |
| **SAM** | YAML | 🟢 Low | 🟡 Medium |
| **Serverless** | YAML | 🟢 Low | 🟡 Medium |

### CDK TypeScript Example: API with Lambda

```typescript
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class MyApiStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string) {
    super(scope, id);

    // DynamoDB Table
    const table = new dynamodb.Table(this, 'UsersTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    // Lambda Function
    const handler = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
      },
    });

    // Grant Lambda access to DynamoDB
    table.grantReadWriteData(handler);

    // API Gateway
    new apigateway.LambdaRestApi(this, 'Api', {
      handler: handler,
    });
  }
}
```

### CDK Project Structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CDK PROJECT STRUCTURE                                │
└──────────────────────────────────────────────────────────────────────────┘

  my-cdk-app/
  │
  ├── bin/
  │   └── app.ts              ← Entry point
  │
  ├── lib/
  │   ├── network-stack.ts    ← VPC, Subnets
  │   ├── data-stack.ts       ← RDS, DynamoDB
  │   └── api-stack.ts        ← Lambda, API Gateway
  │
  ├── lambda/
  │   └── handler.ts          ← Lambda code
  │
  └── test/
      └── app.test.ts         ← Unit tests


  STACK DEPENDENCIES:
  
  NetworkStack ───▶ DataStack ───▶ ApiStack
```

---

## 5️⃣ Amazon VPC (Virtual Private Cloud)

### What is VPC?

> Isolated virtual network for your AWS resources

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           VPC ARCHITECTURE                                │
└──────────────────────────────────────────────────────────────────────────┘

  ☁️ Internet
       │
       ▼
 ┌───────────────────────────────────────────────────────────────────────┐
 │  Internet Gateway                                                      │
 └───────────────────────────────────────────────────────────────────────┘
       │
       │
 ┌─────┴───────────────────────── VPC (10.0.0.0/16) ─────────────────────┐
 │                                                                        │
 │  ┌────────────────────────┐    ┌────────────────────────┐              │
 │  │  Availability Zone 1   │    │  Availability Zone 2   │              │
 │  │                        │    │                        │              │
 │  │  ┌──────────────────┐  │    │  ┌──────────────────┐  │              │
 │  │  │ 🌐 Public Subnet │  │    │  │ 🌐 Public Subnet │  │              │
 │  │  │   10.0.1.0/24    │  │    │  │   10.0.3.0/24    │  │              │
 │  │  │                  │  │    │  │                  │  │              │
 │  │  │  ┌────────────┐  │  │    │  │  ┌────────────┐  │  │              │
 │  │  │  │    ALB     │  │  │    │  │  │    NAT     │  │  │              │
 │  │  │  └────────────┘  │  │    │  │  │  Gateway   │  │  │              │
 │  │  └──────────────────┘  │    │  │  └────────────┘  │  │              │
 │  │           │            │    │  └──────────────────┘  │              │
 │  │           ▼            │    │           │            │              │
 │  │  ┌──────────────────┐  │    │  ┌──────────────────┐  │              │
 │  │  │ 🔒 Private Subnet│  │    │  │ 🔒 Private Subnet│  │              │
 │  │  │   10.0.2.0/24    │  │    │  │   10.0.4.0/24    │  │              │
 │  │  │                  │  │    │  │                  │  │              │
 │  │  │  ┌────────────┐  │  │    │  │  ┌────────────┐  │  │              │
 │  │  │  │ ECS Tasks  │  │  │    │  │  │ ECS Tasks  │  │  │              │
 │  │  │  └────────────┘  │  │    │  │  └────────────┘  │  │              │
 │  │  └──────────────────┘  │    │  └──────────────────┘  │              │
 │  └────────────────────────┘    └────────────────────────┘              │
 │                                                                        │
 └────────────────────────────────────────────────────────────────────────┘
```

### VPC Components

| Component | Purpose | Cost |
|-----------|---------|------|
| **Subnet** | IP range within VPC | Free |
| **Internet Gateway** | Internet access for public subnets | Free |
| **NAT Gateway** | Internet access for private subnets | 💰💰 ~$32/month |
| **Security Group** | Instance-level firewall | Free |
| **NACL** | Subnet-level firewall | Free |
| **VPC Endpoint** | Private access to AWS services | Variable |

### Security Group vs NACL

| Aspect | Security Group | NACL |
|--------|---------------|------|
| **Level** | Instance | Subnet |
| **State** | Stateful | Stateless |
| **Rules** | Allow only | Allow & Deny |
| **Evaluation** | All rules | In order |
| **Default** | Deny all inbound | Allow all |

### 3-Tier Architecture in VPC

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      3-TIER ARCHITECTURE                                  │
└──────────────────────────────────────────────────────────────────────────┘

  ☁️ Internet
       │
       ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       PUBLIC TIER (Web)                               │
  │  ┌─────────────────────────────────────────────────────────────────┐ │
  │  │                   Application Load Balancer                      │ │
  │  └─────────────────────────────────────────────────────────────────┘ │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       PRIVATE TIER (App)                              │
  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
  │  │  ECS Task 1  │     │  ECS Task 2  │     │  ECS Task 3  │         │
  │  └──────────────┘     └──────────────┘     └──────────────┘         │
  └──────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │                       PRIVATE TIER (Data)                             │
  │  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐         │
  │  │ RDS Primary  │────▶│ RDS Replica  │     │ ElastiCache  │         │
  │  └──────────────┘     └──────────────┘     └──────────────┘         │
  └──────────────────────────────────────────────────────────────────────┘
```

---

## 6️⃣ Amazon ECS (Elastic Container Service)

### What is ECS?

> Managed container orchestration service for Docker containers

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ECS ARCHITECTURE                                  │
└──────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                           ECS CLUSTER                                   │
  │                                                                        │
  │   SERVICES                                                             │
  │   ┌─────────────────────────┐    ┌─────────────────────────┐          │
  │   │    Web Service (3x)     │    │   Worker Service (2x)   │          │
  │   └─────────────────────────┘    └─────────────────────────┘          │
  │              │                              │                          │
  │              ▼                              ▼                          │
  │   TASKS (Containers)                                                   │
  │   ┌────────┐ ┌────────┐ ┌────────┐  ┌────────┐ ┌────────┐            │
  │   │ Task 1 │ │ Task 2 │ │ Task 3 │  │ Task 1 │ │ Task 2 │            │
  │   └────────┘ └────────┘ └────────┘  └────────┘ └────────┘            │
  │                                                                        │
  │   COMPUTE OPTIONS                                                      │
  │   ┌──────────────────────┐    ┌──────────────────────┐                │
  │   │      Fargate         │    │        EC2           │                │
  │   │   (Serverless)       │    │   (Self-managed)     │                │
  │   └──────────────────────┘    └──────────────────────┘                │
  └────────────────────────────────────────────────────────────────────────┘
```

### ECS vs EKS Comparison

| Aspect | ECS | EKS |
|--------|-----|-----|
| **Orchestrator** | AWS proprietary | Kubernetes |
| **Learning Curve** | 🟢 Lower | 🔴 Higher |
| **Portability** | AWS only | Multi-cloud |
| **Cost** | Free (Fargate pricing) | $0.10/hour/cluster + compute |
| **Community** | AWS docs | Huge K8s community |
| **Best For** | AWS-native apps | K8s expertise, multi-cloud |

### ECS CI/CD Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ECS CI/CD PIPELINE                                │
└──────────────────────────────────────────────────────────────────────────┘

  Developer ───▶ GitHub ───▶ CodeBuild ───▶ ECR Registry
                  (Code)      (Build)        (Docker Images)
                                                   │
                                                   ▼
                                            ┌─────────────────┐
                                            │   ECS Service   │
                              ┌─────────────┴─────────────────┴───────────┐
                              │                                           │
                              │   ┌─────────┐ ┌─────────┐ ┌─────────┐   │
                              │   │Task v2🟢│ │Task v2🟢│ │Task v1🔵│   │
                              │   └─────────┘ └─────────┘ └─────────┘   │
                              │                                           │
                              │        (Rolling / Blue-Green Deploy)      │
                              └───────────────────────────────────────────┘
```

---

## 7️⃣ Amazon EKS (Elastic Kubernetes Service)

### What is EKS?

> Managed Kubernetes service - run K8s without managing control plane

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EKS ARCHITECTURE                                  │
└──────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │                    CONTROL PLANE (AWS Managed)                          │
  │                                                                        │
  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
  │  │ API Server │  │   etcd     │  │ Scheduler  │  │ Controller │       │
  │  └────────────┘  └────────────┘  └────────────┘  │  Manager   │       │
  │                                                   └────────────┘       │
  └────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    DATA PLANE (Your Nodes)                              │
  │                                                                        │
  │  ┌─────────────────────────┐    ┌─────────────────────────┐           │
  │  │    Node Group 1         │    │   Node Group 2 (Spot)   │           │
  │  │  ┌────────┐ ┌────────┐  │    │  ┌────────┐ ┌────────┐  │           │
  │  │  │ Node 1 │ │ Node 2 │  │    │  │ Node 3 │ │ Node 4 │  │           │
  │  │  └────────┘ └────────┘  │    │  └────────┘ └────────┘  │           │
  │  └─────────────────────────┘    └─────────────────────────┘           │
  └────────────────────────────────────────────────────────────────────────┘
```

### EKS Node Options

| Option | Management | Cost | Best For |
|--------|------------|------|----------|
| **Managed Node Groups** | AWS manages | EC2 pricing | Most workloads |
| **Self-Managed Nodes** | You manage | EC2 pricing | Custom AMIs |
| **Fargate** | Serverless | Per pod | Burstable, simple |

### EKS Networking & Integration

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      EKS VPC CNI & ALB INGRESS                            │
└──────────────────────────────────────────────────────────────────────────┘

       Internet
          │
          ▼
   ┌─────────────┐
   │     ALB     │  (Managed by AWS LB Controller)
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │Worker Node  │
   │(EC2 Instance)
   │             │
   │ ┌─────────┐ │  (VPC CNI assigns real VPC IPs to Pods)
   │ │  Pod 1  │ │  IP: 10.0.1.5 (Directly routable)
   │ └─────────┘ │
   │             │
   │ ┌─────────┐ │
   │ │  Pod 2  │ │  IP: 10.0.1.6
   │ └─────────┘ │
   └─────────────┘
```

> **Key Concepts:**
> * **VPC CNI Plugin**: Pods get real IP addresses from the VPC network overlay, allowing direct access.
> * **AWS Load Balancer Controller**: A pod that watches for Ingress resources and automatically provisions AWS ALBs.

---

## 8️⃣ Amazon SNS (Simple Notification Service)

### What is SNS?

> Pub/Sub messaging for decoupling microservices and sending notifications

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SNS PUB/SUB PATTERN                                  │
└──────────────────────────────────────────────────────────────────────────┘

                         APPLICATION
                              │
                              ▼
                    ┌─────────────────┐
                    │    SNS Topic    │
                    │ (order-events)  │
                    └─────────────────┘
                              │
         ┌──────────┬─────────┼─────────┬──────────┐
         │          │         │         │          │
         ▼          ▼         ▼         ▼          ▼
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
    │  SQS   │ │  SQS   │ │ Lambda │ │  HTTP  │ │ Email  │
    │ Queue1 │ │ Queue2 │ │        │ │Endpoint│ │        │
    └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

### SNS vs SQS

| Aspect | SNS | SQS |
|--------|-----|-----|
| **Pattern** | Pub/Sub | Queue |
| **Delivery** | Push to all subscribers | Pull by consumers |
| **Persistence** | No (unless to SQS) | Yes (up to 14 days) |
| **Use Case** | Fan-out, notifications | Task queues, decoupling |
| **Ordering** | FIFO available | FIFO available |

### Fan-Out Pattern: SNS + SQS

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      FAN-OUT PATTERN                                      │
└──────────────────────────────────────────────────────────────────────────┘

  Order Service
       │
       ▼
  ┌──────────┐
  │SNS Topic │
  └──────────┘
       │
       ├────────────────┬────────────────┐
       │                │                │
       ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │   SQS    │    │   SQS    │    │   SQS    │
  │ (Email)  │    │(Inventory│    │(Analytics│
  └──────────┘    └──────────┘    └──────────┘
       │                │                │
       ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │  Lambda  │    │  Lambda  │    │  Lambda  │
  │ (Email)  │    │(Inventory│    │(Analytics│
  └──────────┘    └──────────┘    └──────────┘
```

---

## 9️⃣ Amazon SQS (Simple Queue Service)

### What is SQS?

> Fully managed message queue for decoupling and scaling microservices

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         SQS QUEUE PATTERN                                 │
└──────────────────────────────────────────────────────────────────────────┘

  PRODUCERS                    SQS QUEUE                    CONSUMERS
  ─────────                    ─────────                    ─────────

  ┌──────────┐              ┌─────────────┐              ┌──────────┐
  │Service A │──────────────│  ┌─────┐    │──────────────│ Worker 1 │
  └──────────┘              │  │Msg 1│    │              └──────────┘
                            │  ├─────┤    │
  ┌──────────┐              │  │Msg 2│    │              ┌──────────┐
  │Service B │──────────────│  ├─────┤    │──────────────│ Worker 2 │
  └──────────┘              │  │Msg 3│    │              └──────────┘
                            │  └─────┘    │
                            └─────────────┘
```

### SQS Queue Types

| Feature | Standard Queue | FIFO Queue |
|---------|---------------|------------|
| **Throughput** | Unlimited | 300/s (batch: 3000) |
| **Ordering** | Best-effort | Strict FIFO |
| **Delivery** | At-least-once | Exactly-once |
| **Cost** | Lower | Higher |
| **Use Case** | High volume | Transactions |

### SQS + Lambda Integration

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SQS + LAMBDA PATTERN                                 │
└──────────────────────────────────────────────────────────────────────────┘

  API Gateway ───▶ Lambda (API) ───▶ SQS Queue
                                         │
                                         │ (Event Source Mapping)
                                         │
                                         ▼
                                  ┌─────────────┐
                                  │   Lambda    │
                                  │  (Worker)   │
                                  └─────────────┘
                                    │         │
                                    ▼         ▼
                              ┌─────────┐ ┌─────────┐
                              │   DLQ   │ │Database │
                              │(Failures│ │         │
                              └─────────┘ └─────────┘
```

---

## 🔟 Amazon CloudWatch

### What is CloudWatch?

> Monitoring and observability service for AWS resources and applications

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      CLOUDWATCH OVERVIEW                                  │
└──────────────────────────────────────────────────────────────────────────┘

  DATA SOURCES                 CLOUDWATCH                  ACTIONS
  ────────────                 ──────────                  ───────

  ┌──────────┐               ┌─────────────┐             ┌──────────┐
  │EC2 Metrics│─────────────▶│   Metrics   │────────────▶│   SNS    │
  └──────────┘               └─────────────┘             │(Notify)  │
                                                         └──────────┘
  ┌──────────┐               ┌─────────────┐             ┌──────────┐
  │Lambda Logs│─────────────▶│    Logs     │────────────▶│Auto Scale│
  └──────────┘               └─────────────┘             └──────────┘
                                                         
  ┌──────────┐               ┌─────────────┐             ┌──────────┐
  │ECS Metrics│─────────────▶│   Alarms    │────────────▶│  Lambda  │
  └──────────┘               └─────────────┘             │ Trigger  │
                                                         └──────────┘
  ┌──────────┐               ┌─────────────┐
  │ Custom   │─────────────▶│ Dashboards  │
  │ Metrics  │               └─────────────┘
  └──────────┘
```

### CloudWatch Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Metrics** | Numerical data points | CPU utilization, request count |
| **Logs** | Text log data | Application logs, access logs |
| **Alarms** | Trigger on thresholds | CPU > 80% for 5 min |
| **Dashboards** | Visualization | Ops dashboard |
| **Insights** | Query logs | Error patterns |

### Alarm Flow

```
  CPU > 80% for 5 min
         │
         ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  CloudWatch │────▶│     SNS     │────▶│   Email     │
  │    Alarm    │     │    Topic    │     │   Slack     │
  └─────────────┘     └─────────────┘     │   Lambda    │
                                          └─────────────┘
```

---

## 1️⃣1️⃣ API Gateway

### What is API Gateway?

> Fully managed service for creating, publishing, and securing APIs

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY FEATURES                                 │
└──────────────────────────────────────────────────────────────────────────┘

  CLIENTS                     API GATEWAY                   BACKENDS
  ───────                     ───────────                   ────────

  ┌──────────┐            ┌─────────────────┐            ┌──────────┐
  │  Web App │───────────▶│  Authentication │───────────▶│  Lambda  │
  └──────────┘            │  Rate Limiting  │            └──────────┘
                          │  Caching        │            
  ┌──────────┐            │  Request        │            ┌──────────┐
  │Mobile App│───────────▶│  Transform      │───────────▶│   HTTP   │
  └──────────┘            │  Logging        │            │ Endpoint │
                          └─────────────────┘            └──────────┘
  ┌──────────┐                                           ┌──────────┐
  │   IoT    │───────────────────────────────────────────▶│   AWS    │
  └──────────┘                                           │ Services │
                                                         └──────────┘
```

### API Gateway Types

| Type | Protocol | Use Case | Pricing |
|------|----------|----------|---------|
| **REST API** | REST | Full features | $3.50/million |
| **HTTP API** | REST | Simpler, cheaper | $1.00/million |
| **WebSocket** | WebSocket | Real-time, chat | By messages |

---

## 1️⃣2️⃣ Elastic Load Balancing (ELB)

### Load Balancer Types

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER TYPES                                  │
└──────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │  ALB (Application Load Balancer)     │  Layer 7 (HTTP/HTTPS)          │
  │  - Path-based routing                │  Best for: Web apps            │
  │  - Host-based routing                │                                │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │  NLB (Network Load Balancer)         │  Layer 4 (TCP/UDP)             │
  │  - Ultra-low latency                 │  Best for: Gaming, IoT         │
  │  - Static IP                         │                                │
  └────────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────────┐
  │  GLB (Gateway Load Balancer)         │  Layer 3 (IP)                  │
  │  - Network traffic inspection        │  Best for: Firewalls           │
  └────────────────────────────────────────────────────────────────────────┘
```

### ALB Path-Based Routing

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      ALB ROUTING RULES                                    │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────┐
  👤 Client ────────────▶│     ALB      │
                         └──────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
     /api/* │            /images/*         /* (default)
            │                   │                   │
            ▼                   ▼                   ▼
     ┌────────────┐      ┌────────────┐      ┌────────────┐
     │ API Service│      │   Static   │      │  Web App   │
     │   Target   │      │   Files    │      │   Target   │
     │   Group    │      │   Target   │      │   Group    │
     └────────────┘      └────────────┘      └────────────┘
```

---

## 1️⃣3️⃣ AWS Elastic Beanstalk

### What is Beanstalk?

> PaaS for deploying web apps without managing infrastructure

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      BEANSTALK ARCHITECTURE                               │
└──────────────────────────────────────────────────────────────────────────┘

                         YOUR CODE
                            │
                            ▼
                    ┌───────────────┐
                    │  EB CLI /     │
                    │    Console    │
                    └───────────────┘
                            │
                            ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    BEANSTALK ENVIRONMENT                                │
  │                                                                        │
  │  AWS MANAGED:                                                          │
  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐          │
  │  │    ELB     │ │    ASG     │ │    EC2     │ │    SG      │          │
  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘          │
  │                                                                        │
  │  OPTIONAL:                                                             │
  │  ┌────────────┐ ┌────────────┐                                        │
  │  │    RDS     │ │ElastiCache │                                        │
  │  └────────────┘ └────────────┘                                        │
  └────────────────────────────────────────────────────────────────────────┘
```

### Deployment Options

| Strategy | Downtime | Rollback | Speed |
|----------|----------|----------|-------|
| **All at once** | Yes | Manual | Fast |
| **Rolling** | Minimal | Manual | Slow |
| **Rolling with batch** | Minimal | Manual | Medium |
| **Immutable** | No | Quick | Slow |
| **Blue/Green** | No | Quick | Medium |

---

## 🏗️ Common Architecture Patterns

### Pattern 1: Serverless Web App

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      SERVERLESS WEB APP                                   │
└──────────────────────────────────────────────────────────────────────────┘

  👤 User
     │
     ├────▶ CloudFront ────▶ S3 (Static Website)
     │         │
     │         ▼
     │      (index.html, app.js, styles.css)
     │
     └────▶ API Gateway ────▶ Lambda ────▶ DynamoDB
                │
                ▼
             Cognito
          (Authentication)
```

### Pattern 2: Container Microservices

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    CONTAINER MICROSERVICES                                │
└──────────────────────────────────────────────────────────────────────────┘

  👤 User
     │
     ▼
  ┌──────────┐
  │   ALB    │
  └──────────┘
       │
       ├──────────────┬──────────────┐
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │  User   │   │  Order  │   │ Payment │    (ECS Services)
  │ Service │   │ Service │   │ Service │
  └─────────┘   └─────────┘   └─────────┘
       │              │              │
       ▼              ▼              ▼
  ┌─────────┐   ┌─────────┐   ┌─────────┐
  │   RDS   │   │  Redis  │   │   SQS   │
  └─────────┘   └─────────┘   └─────────┘
```

### Pattern 3: Event-Driven Processing

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EVENT-DRIVEN PROCESSING                                │
└──────────────────────────────────────────────────────────────────────────┘

  DATA SOURCES             STREAM              PROCESS              STORE
  ────────────             ──────              ───────              ─────

  ┌──────────┐                                ┌──────────┐
  │API Gateway│─────┐                         │  Lambda  │
  └──────────┘     │     ┌──────────┐         │Transform │
                   ├────▶│ Kinesis  │────────▶└──────────┘
  ┌──────────┐     │     │ Streams  │              │
  │ IoT Core │─────┘     └──────────┘              ▼
  └──────────┘                               ┌──────────┐    ┌──────────┐
                                             │ Firehose │───▶│    S3    │
                                             └──────────┘    │Data Lake │
                                                             └──────────┘
                                                                  │
                                             ┌──────────────────────┘
                                             ▼
                                       ┌──────────┐    ┌──────────┐
                                       │  Athena  │───▶│QuickSight│
                                       │ (Query)  │    │(Dashboard│
                                       └──────────┘    └──────────┘
```

---

## 📊 Service Selection Guide

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SERVICE SELECTION GUIDE                                │
└──────────────────────────────────────────────────────────────────────────┘

  WHAT DO YOU NEED TO RUN?
  ────────────────────────
  
  Functions/Small Code  ─────────────▶  Lambda
  Containers (Simple)   ─────────────▶  ECS Fargate
  Containers (K8s)      ─────────────▶  EKS
  Full Control (VMs)    ─────────────▶  EC2
  Web Apps (Easy)       ─────────────▶  Beanstalk
  
  
  WHAT DO YOU NEED TO STORE?
  ──────────────────────────
  
  Files/Objects         ─────────────▶  S3
  Relational Data       ─────────────▶  RDS
  Key-Value/NoSQL       ─────────────▶  DynamoDB
  Caching               ─────────────▶  ElastiCache
  
  
  HOW DO SERVICES COMMUNICATE?
  ────────────────────────────
  
  Task Queue            ─────────────▶  SQS
  Fan-out/Pub-Sub       ─────────────▶  SNS
  Real-time Stream      ─────────────▶  Kinesis
  Event-Driven          ─────────────▶  EventBridge
```

---

## 💡 Cost Optimization Tips

| Service | Tip |
|---------|-----|
| **Lambda** | Optimize memory for best price/performance |
| **S3** | Use lifecycle policies, Intelligent Tiering |
| **EC2** | Reserved Instances, Spot for non-critical |
| **RDS** | Reserved, right-size instances |
| **NAT Gateway** | Use VPC endpoints to avoid NAT costs |
| **Data Transfer** | Use CloudFront, minimize cross-region |

---

## 📚 Key Takeaways

```
┌─────────────────────────────────────────────────────────────────┐
│                    AWS SERVICES CHEAT SHEET                      │
├─────────────────────────────────────────────────────────────────┤
│ 🖥️ COMPUTE: Lambda (serverless), ECS/EKS (containers)          │
│ 💾 STORAGE: S3 (objects), EBS (block), EFS (file)              │
│ 🔒 NETWORK: VPC (isolation), ALB (routing), NAT (private out)  │
│ 📨 MESSAGING: SQS (queue), SNS (pub/sub)                       │
│ 🔄 ORCHESTRATION: Step Functions for workflows                  │
│ 📊 MONITORING: CloudWatch for everything                        │
│ 🛠️ IaC: CDK for infrastructure as TypeScript/Python            │
└─────────────────────────────────────────────────────────────────┘
```

---

*Last Updated: January 2026*
