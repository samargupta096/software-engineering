# Java & Microservices Interview Questions

## ☕ Core Java Questions (Senior Level)

### Q1: HashMap vs ConcurrentHashMap

| Aspect | HashMap | ConcurrentHashMap |
|--------|---------|-------------------|
| Thread-safe | No | Yes (Node-level locks) |
| Null key/value | Allowed | Not allowed |
| Use case | Single-threaded | Multi-threaded access |

### Q2: CompletableFuture vs Future

- **Future**: Blocking with `get()`, no chaining
- **CompletableFuture**: Non-blocking, supports `thenApply`, `thenCompose`, `exceptionally`

```java
CompletableFuture.supplyAsync(() -> fetchData())
    .thenApplyAsync(data -> transform(data))
    .exceptionally(ex -> handleError(ex));
```

### Q3: Java Memory Model & Happens-Before

- **Volatile writes** happen-before subsequent reads
- **Synchronized unlock** happens-before subsequent lock
- **Thread.start()** happens-before actions in started thread

### Q4: G1 Garbage Collector

- Default since Java 9
- Divides heap into regions
- Prioritizes regions with most garbage
- Key phases: Initial Mark → Concurrent Marking → Remark → Cleanup

### Q5: Stream API

- **Intermediate** (lazy): `filter`, `map`, `flatMap`, `sorted`
- **Terminal** (eager): `collect`, `forEach`, `reduce`, `count`

---

## 🔧 Microservices Questions

### Q6: Circuit Breaker Pattern

States: **CLOSED** → **OPEN** (failures) → **HALF-OPEN** (timeout) → test → CLOSED/OPEN

```java
@CircuitBreaker(name = "paymentService", fallbackMethod = "fallback")
public Payment process(Request req) { return client.call(req); }
```

### Q7: Distributed Transactions - Saga Pattern

**Choreography**: Services publish/subscribe events
**Orchestration**: Central coordinator manages flow

Each service: local transaction → publish event
On failure: compensating transactions rollback

### Q8: API Gateway Responsibilities

1. Request Routing
2. Authentication/Authorization (JWT validation)
3. Rate Limiting
4. Load Balancing
5. Request/Response Transformation
6. Circuit Breaking
7. Caching

### Q9: Distributed Tracing

- **Trace ID**: Entire request flow
- **Span ID**: Single operation
- Tools: Jaeger, Zipkin, AWS X-Ray
- Propagation via headers: `traceparent` (W3C), `X-B3-*` (Zipkin)

### Q10: Service-to-Service Auth

1. **JWT Propagation** - Forward user token
2. **OAuth2 Client Credentials** - Service tokens
3. **Mutual TLS** - Certificate-based (via Istio)

---

## 🏗️ System Design Questions

### Q11: Real-time Transaction Streaming

```
Sources → Kafka → Stream Processor (Flink) → Fraud Detection/Alerts
                                           → Rules Engine
                                           → Data Lake
```

Key: Exactly-once semantics, windowed aggregations, dead letter queues

### Q12: Rate Limiter Design

- **Token Bucket** or **Sliding Window** algorithm
- Redis for distributed rate limiting
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📝 Practice Problems

1. **Thread-Safe Singleton**: Use Initialization-on-demand holder idiom
2. **LRU Cache**: HashMap + Doubly Linked List for O(1) operations
3. **Distributed Lock**: Redis SETNX with TTL

---

## 💡 Remember

- Discuss trade-offs explicitly
- Consider NAB's scale (millions of transactions)
- Emphasize observability and security
- Connect answers to banking domain

