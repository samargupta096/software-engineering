GC Roots are starting points like stack variables and static fields used to determine object reachability. Minor GC cleans the Young Generation, while Major GC cleans the Old Generation. Objects move from Eden to Survivor to Old based on their lifespan. G1 is the default GC in Java 11+, offering balanced performance. For low-latency large heap systems, ZGC is preferred. GC tuning involves configuring heap size and pause time goals.

Pattern matching reduces casting boilerplate. Sealed classes restrict inheritance and improve domain modeling. Records provide a concise way to define immutable data carriers. Together, they enable safer, more expressive, and maintainable object-oriented design in modern Java.

@Transactional manages database transactions using AOP proxies and thread-bound transaction context. @Async executes methods in a separate thread using a TaskExecutor. Since transactions are stored in ThreadLocal, they do not propagate to async methods, which can cause unexpected behavior if not handled properly.

Saga pattern manages distributed transactions across microservices using a sequence of local transactions with compensating actions. Orchestration uses a central controller to manage flow, while choreography uses event-driven communication between services. Saga ensures eventual consistency without using distributed two-phase commit.

volatile guarantees visibility but not mutual exclusion.

2️⃣ transient
📌 Purpose

Prevents variable from being serialized.

3️⃣ synchronized
📌 Purpose

Ensures only one thread can execute a block/method at a time.

The volatile keyword ensures visibility of variable changes across threads but does not provide atomicity. The transient keyword prevents a field from being serialized. The synchronized keyword provides mutual exclusion and visibility. Final prevents modification, static makes a member class-level, and abstract defines incomplete behavior for inheritance.

Mockito is a Java mocking framework used for unit testing by mocking dependencies and verifying interactions. PowerMockito extends Mockito to mock static, private, and final methods, but it relies on bytecode manipulation and is generally discouraged in modern development. With recent Mockito versions supporting static mocking, PowerMockito is rarely needed.

There are multiple ways to implement Singleton in Java, including eager initialization, lazy initialization, synchronized method, double-checked locking, Bill Pugh pattern, and enum-based Singleton. The enum-based implementation is considered the safest because it is thread-safe, serialization-safe, and protects against reflection attacks.

After a rebase, commit hashes change because Git rewrites history. Since the local branch no longer matches the remote branch, Git rejects a normal push. A force push is required to overwrite the remote history, preferably using --force-with-lease to avoid overwriting others' work.

🔁 Step-by-Step Flow
1️⃣ Producer sends schema to Registry

If new → registry assigns ID

2️⃣ Producer serializes message

Message contains schema ID (not full schema)

Schema stored centrally

3️⃣ Consumer reads schema ID

Fetches schema from registry

Deserializes message safely

Kafka Schema Registry is a centralized service that manages and validates message schemas for Kafka topics. It ensures schema compatibility and safe evolution, preventing breaking changes between producers and consumers. Messages contain a schema ID, and the actual schema is fetched from the registry during serialization and deserialization.

Access JWT tokens do not need to be stored in the database because they are self-contained and validated using a digital signature. However, refresh tokens should be stored in the database to allow revocation, rotation, and session control.

To secure an API in Spring Boot, we typically use Spring Security with stateless JWT authentication. A custom JWT filter validates the token on each request and sets the authentication in the SecurityContext. Role-based authorization is configured at URL or method level. In production, we disable sessions, enforce HTTPS, use short-lived access tokens, and manage refresh tokens securely.

HashMap stores key-value pairs in an array of buckets. It calculates the index using hashCode and bitwise AND. If collisions occur, entries are stored in a linked list, and when the list size exceeds 8, it converts into a Red-Black Tree for O(log n) performance. Resize happens when size exceeds capacity × load factor (default 0.75).

In DynamoDB, the partition key determines data distribution and must have high cardinality to avoid hot partitions. The sort key allows multiple items under the same partition key and enables range queries. GSIs allow querying using different keys, while LSIs provide alternate sort keys for the same partition key. Single table design stores multiple entity types in one table and is optimized based on access patterns instead of relational joins.

I’ve used SQS for decoupled asynchronous processing, SNS for fan-out messaging, S3 for file storage with presigned URLs, Secrets Manager for credential rotation, Parameter Store for configuration management, and ALB for path-based routing in microservices deployed on ECS/EKS.    

JFrog Artifactory is a universal artifact repository manager used to store and manage build artifacts like JARs and Docker images. In Java projects, it centralizes dependency management, supports snapshot and release repositories, and integrates with CI/CD pipelines to ensure reproducible and secure builds.

Argo CD detects changes using a reconciliation loop. It periodically polls the Git repository or receives webhook notifications, fetches the latest commit, and compares the desired Kubernetes manifests with the live cluster state. If differences are found, it marks the application OutOfSync and optionally auto-syncs to restore the desired state.

Rolling deployment gradually updates instances with zero downtime. Blue-Green uses two identical environments and switches traffic instantly. Canary exposes a small percentage of users to the new version to reduce risk. Feature flags allow runtime control of features without redeployment.

Istio is a service mesh for Kubernetes that manages service-to-service communication using Envoy sidecar proxies. It provides advanced traffic management, mTLS security, observability, and fault injection without changing application code.

A service mesh is an infrastructure layer that manages service-to-service communication in microservices architectures. It uses sidecar proxies to provide traffic management, mTLS security, observability, and resilience without modifying application code.

What is SSL Termination?

SSL termination is the process of decrypting HTTPS traffic at a load balancer or proxy instead of inside the application server.    
Client → HTTPS → Load Balancer (decrypt) → HTTP → Service

Benefits:

Reduces load on application servers
Simplifies certificate management
Enables centralized security policies
Improves performance


AWS provides Application Load Balancer (Layer 7), Network Load Balancer (Layer 4), Gateway Load Balancer for security appliances, and Classic Load Balancer which is legacy. ALB is best for microservices and HTTP routing, while NLB is ideal for high-performance TCP workloads.

AWS Lambda is a serverless compute service that executes code in response to events and automatically scales based on demand. It is ideal for event-driven workloads, asynchronous processing, and lightweight APIs. However, Java Lambdas may face cold start latency, which can be mitigated using provisioned concurrency or optimized runtime configurations.

RDS Proxy decouples Lambda concurrency from database connection limits by managing connection pooling centrally.

The Lambda + RDS problem occurs because Lambda scales per request, potentially creating thousands of concurrent database connections, while RDS supports a limited number. This can exhaust connections and cause failures. The recommended solution is to use RDS Proxy for connection pooling, limit Lambda concurrency, or switch to DynamoDB for fully serverless scalability.


SQS visibility timeout is the duration for which a message remains invisible to other consumers after being received. It prevents duplicate processing while allowing retry if the consumer fails. If the message is not deleted before the timeout expires, it becomes visible again and can be processed by another consumer.

ECS is AWS’s container orchestration service that allows running Docker containers either on EC2 or Fargate. EKS is AWS’s managed Kubernetes service, offering full Kubernetes capabilities with AWS-managed control plane. CloudWatch is AWS’s monitoring service used for collecting logs, metrics, and alarms across services like ECS, EKS, and Lambda.

In Kubernetes, Deployment manages stateless pods and rolling updates, Service exposes pods via stable networking, ConfigMap and Secret manage configuration, and Ingress handles HTTP routing. Helm is a package manager that templates Kubernetes manifests and simplifies deployment across environments.

A Target Group in ELB is a logical grouping of backend resources such as EC2 instances, IPs, or Lambda functions that receive traffic from a Load Balancer. It performs health checks and enables advanced routing strategies like blue-green and canary deployments.

Kubernetes architecture consists of a control plane and worker nodes. The control plane includes the API server, scheduler, controller manager, and etcd, which manage cluster state. Worker nodes run kubelet, container runtime, and kube-proxy to execute containers and handle networking. Kubernetes follows a reconciliation model where it continuously ensures the desired state matches the actual state.

Enum in Java is a type-safe way to represent a fixed set of constants. Unlike simple constants, enums are full classes that can contain fields, methods, and behavior. They improve readability, prevent invalid values, and are commonly used for status values, roles, event types, and strategy-like implementations.


| Object      | Purpose           |
| ----------- | ----------------- |
| Pod         | Runs container    |
| Deployment  | Manages pods      |
| Service     | Exposes pods      |
| Ingress     | HTTP routing      |
| ConfigMap   | App config        |
| Secret      | Sensitive config  |
| StatefulSet | Stateful apps     |
| DaemonSet   | Node-level agents |
| Job         | One-time task     |



---------------------- AWS Interview Practical Questions----------------------
Perfect 🔥
You’re asking for **similar real-world AWS interview traps** like *Lambda + RDS problem*.

Below are **high-probability senior-level AWS scenario questions** with short architect-style answers.

---

# 🔥 1️⃣ API Gateway + Lambda Suddenly Returns 502

### ❓ What could be wrong?

Possible causes:

* Lambda timeout
* Lambda memory exhaustion
* Incorrect IAM role
* VPC misconfiguration (NAT missing)

### 🎯 Interview Angle

If Lambda is inside VPC and needs internet:

* Must configure NAT Gateway.

---

# 🔥 2️⃣ SQS Messages Not Being Deleted

### ❓ Why are messages reappearing?

Because:

* Consumer didn’t delete message
* Visibility timeout too short
* Processing longer than timeout

### 🎯 Fix

Increase:

```text
Visibility Timeout
```

Or delete message manually after success.

---

# 🔥 3️⃣ DynamoDB Throttling Under Load

### ❓ Why?

* Hot partition
* Low provisioned capacity
* Poor partition key design

### 🎯 Fix

* Improve partition key distribution
* Use on-demand mode
* Add GSI carefully

---

# 🔥 4️⃣ ECS Tasks Keep Restarting

### ❓ Possible causes?

* Failing health checks
* Out of memory
* Container crash
* ALB health check misconfigured

---

# 🔥 5️⃣ ALB Returns 504 Gateway Timeout

### ❓ Why?

* Backend not responding
* Security group misconfiguration
* Target group unhealthy
* App timeout longer than ALB timeout

---

# 🔥 6️⃣ High Lambda Cost Suddenly

### ❓ Why?

* Infinite recursion
* SQS retry loop
* Large memory allocation
* Excessive invocations

---

# 🔥 7️⃣ RDS CPU 100%

### ❓ Why?

* Missing indexes
* Too many connections
* Slow queries
* No read replicas

---

# 🔥 8️⃣ SNS → SQS → Lambda Processing Duplicates

### ❓ Why?

Because:

* At-least-once delivery
* Lambda retry
* Consumer not idempotent

---

# 🔥 9️⃣ S3 Public Data Leak

### ❓ Why?

* Public bucket policy
* Object ACL open
* Missing Block Public Access

---

# 🔥 🔟 EKS Pods CrashLoopBackOff

### ❓ Why?

* Bad config
* Secrets missing
* Wrong liveness/readiness probes
* Insufficient resources

---

# 🔥 1️⃣1️⃣ CloudWatch Logs Missing

### ❓ Why?

* IAM role missing logging permission
* Log group not created
* Lambda timeout before logging

---

# 🔥 1️⃣2️⃣ API Latency High in Production

### ❓ Investigate:

* ALB latency
* Lambda cold start
* RDS slow query
* Network latency
* Auto-scaling lag

---

# 🔥 1️⃣3️⃣ Auto Scaling Not Triggering

### ❓ Why?

* Wrong metric
* Cooldown too long
* No alarm configured
* Target tracking misconfigured

---

# 🔥 1️⃣4️⃣ Secrets Manager Rotation Failing

### ❓ Why?

* Lambda rotation function error
* IAM permission missing
* DB credentials incorrect

---

# 🔥 1️⃣5️⃣ Kafka on EC2 Keeps Losing Messages

### ❓ Why?

* replication.factor=1
* acks=1
* Unclean leader election enabled

---

# 🔥 1️⃣6️⃣ Multi-AZ RDS Still Has Downtime

### ❓ Why?

Multi-AZ ensures HA, not zero downtime.

Failover still takes ~30–60 seconds.

---

# 🔥 1️⃣7️⃣ High DynamoDB Cost

### ❓ Why?

* Scan instead of Query
* Too many GSIs
* Provisioned capacity too high

---

# 🔥 1️⃣8️⃣ API Gateway Rate Limiting Needed

### ❓ How?

* Usage plan
* API key
* Throttling settings
* WAF integration

---

# 🔥 1️⃣9️⃣ Lambda in VPC Very Slow

### ❓ Why?

* ENI attachment delay
* Cold start inside VPC slower
* NAT overhead

---

# 🔥 2️⃣0️⃣ How to Design High Availability in AWS?

Answer:

* Multi-AZ
* Auto scaling
* Load balancer
* Stateless services
* Health checks
* Backup strategy

---

# 🎯 Senior-Level Pattern

Most AWS production failures relate to:

* Scaling mismatch
* Networking misconfig
* IAM misconfig
* Concurrency spikes
* Improper retry handling
* Lack of idempotency

---

# 🎯 30-Second Interview Summary

> In AWS production systems, most real-world issues stem from concurrency scaling, misconfigured networking, improper IAM roles, or lack of resilience patterns like retries, idempotency, and circuit breakers.

---

# 🚀 If You Want Next

* 🔥 30 AWS troubleshooting deep scenarios (with debugging steps)
* 🔥 Full AWS architecture mock interview
* 🔥 Design Uber using AWS
* 🔥 Cost optimization interview questions
* 🔥 AWS + Java backend system design

Tell me which level 🚀
