# System Design Interview Guide for Barclays 🏗️

> **Focus:** Scalable system design, Banking domain, Fintech patterns

---

## 📋 Table of Contents

1. [System Design Framework](#system-design-framework)
2. [URL Shortener (Frequently Asked)](#url-shortener)
3. [Payment Processing System](#payment-processing-system)
4. [Rate Limiter](#rate-limiter)
5. [Notification Service](#notification-service)
6. [Real-time Dashboard](#real-time-dashboard)
7. [Key Trade-offs](#key-trade-offs)

---

## 🎯 System Design Framework

### RESHADED Framework (8 Steps)

| Step | Focus | Time |
|------|-------|------|
| **R**equirements | Clarify functional & non-functional requirements | 3-5 min |
| **E**stimation | Calculate scale (QPS, storage, bandwidth) | 2-3 min |
| **S**torage Schema | Design data model (SQL/NoSQL, tables) | 3-4 min |
| **H**igh-level Design | Draw main components | 5-7 min |
| **A**PI Design | Define REST endpoints | 2-3 min |
| **D**etailed Design | Deep dive into 2-3 components | 8-10 min |
| **E**rror Handling | Failure scenarios, retries | 2-3 min |
| **D**iagnostic/Scaling | Monitoring, scaling strategies | 2-3 min |

---

## 🔗 URL Shortener (Frequently Asked at Barclays)

### 1. Requirements Clarification

**Functional:**
- Shorten long URLs to short codes
- Redirect short URLs to original
- Custom short codes (optional)
- Analytics (click count, optional)

**Non-Functional:**
- High availability
- Low latency (<100ms redirect)
- URLs should not be predictable

### 2. Estimations

```
Write:Read ratio = 1:100 (read-heavy)

Assumptions:
- 100M new URLs/month
- 10B redirects/month

Write QPS: 100M / (30 * 24 * 3600) ≈ 40 URLs/sec
Read QPS: 10B / (30 * 24 * 3600) ≈ 4000 reads/sec

Storage (5 years):
- 100M * 12 * 5 = 6B URLs
- Each entry: ~500 bytes
- Total: 6B * 500 = 3 TB
```

### 3. Storage Schema

```sql
CREATE TABLE urls (
    id BIGINT PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    long_url TEXT NOT NULL,
    user_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    click_count BIGINT DEFAULT 0
);

CREATE INDEX idx_short_code ON urls(short_code);
```

### 4. High-Level Design

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│ Load        │────▶│ Application │
│             │     │ Balancer    │     │ Servers     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
                    ▼                          ▼                          ▼
            ┌─────────────┐          ┌─────────────┐            ┌─────────────┐
            │   Cache     │          │  Database   │            │ Key Gen     │
            │   (Redis)   │          │ (PostgreSQL)│            │ Service     │
            └─────────────┘          └─────────────┘            └─────────────┘
```

### 5. API Design

```
POST /api/v1/shorten
Request:  { "long_url": "https://example.com/very-long-path" }
Response: { "short_url": "https://short.ly/abc123" }

GET /{short_code}
Response: 301 Redirect to long_url

GET /api/v1/stats/{short_code}
Response: { "short_code": "abc123", "clicks": 1000, "created_at": "..." }
```

### 6. Detailed Design

#### Key Generation Approaches

| Approach | Pros | Cons |
|----------|------|------|
| Random + Check DB | Simple | Collision checks at scale |
| Counter + Base62 | No collisions | Predictable, single point |
| Pre-generated Keys | Fast, no collision | Requires key management |
| Hash (MD5/SHA) | Deterministic | Long, need truncation |

**Recommended: Pre-generated Key Service**

```java
// Key Generation Service
public class KeyGenerationService {
    private final BlockingQueue<String> keyPool;
    private static final String ALPHABET = 
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    
    public String getUniqueKey() {
        return keyPool.take(); // Pre-generated, guaranteed unique
    }
}
```

#### Caching Strategy

```java
// Check cache first (Redis)
String longUrl = redis.get(shortCode);
if (longUrl == null) {
    longUrl = database.findByShortCode(shortCode);
    redis.setex(shortCode, 3600, longUrl); // Cache for 1 hour
}
return redirect(longUrl);
```

### 7. Error Handling

- **URL not found:** Return 404
- **Rate limiting:** Return 429 Too Many Requests
- **Database failure:** Serve from cache, return cached response
- **Cache miss during DB failure:** Return 503 Service Unavailable

### 8. Scaling Considerations

- **Horizontal scaling:** Stateless app servers behind LB
- **Database sharding:** Shard by short_code hash
- **Cache cluster:** Redis Cluster for distributed caching
- **CDN:** For static assets and redirection caching

---

## 💳 Payment Processing System (Banking Domain)

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway                                   │
│              (Authentication, Rate Limiting)                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ Payment       │        │ Transaction   │        │ Notification  │
│ Gateway       │        │ Service       │        │ Service       │
└───────────────┘        └───────────────┘        └───────────────┘
        │                          │                          │
        │                          ▼                          │
        │                ┌───────────────┐                    │
        │                │ Fraud         │                    │
        │                │ Detection     │                    │
        │                └───────────────┘                    │
        │                          │                          │
        ▼                          ▼                          ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ External      │        │ Transaction   │        │ Message       │
│ Banks/PSPs    │        │ Database      │        │ Queue (Kafka) │
└───────────────┘        └───────────────┘        └───────────────┘
```

### Key Design Decisions

#### 1. Idempotency (Crucial for Payments)

```java
public class PaymentService {
    
    public PaymentResponse processPayment(PaymentRequest request) {
        // Check idempotency key to prevent duplicate processing
        String idempotencyKey = request.getIdempotencyKey();
        
        PaymentResponse existingResponse = cache.get(idempotencyKey);
        if (existingResponse != null) {
            return existingResponse; // Return cached result
        }
        
        // Process payment with distributed lock
        try (DistributedLock lock = lockService.acquire(idempotencyKey)) {
            // Double-check after acquiring lock
            existingResponse = cache.get(idempotencyKey);
            if (existingResponse != null) {
                return existingResponse;
            }
            
            PaymentResponse response = processNewPayment(request);
            cache.setex(idempotencyKey, 86400, response); // Cache for 24h
            return response;
        }
    }
}
```

#### 2. Transaction States

```
INITIATED → PENDING → PROCESSING → SUCCESS/FAILED
                         ↓
                     REVERSED
```

#### 3. Saga Pattern for Distributed Transactions

```java
// Choreography-based Saga
@Service
public class PaymentSaga {
    
    @Transactional
    public void processPayment(PaymentRequest request) {
        // Step 1: Validate account
        accountService.validateBalance(request);
        
        // Step 2: Hold funds
        String holdId = accountService.holdFunds(request);
        
        try {
            // Step 3: External transfer
            bankService.transfer(request);
            
            // Step 4: Confirm hold
            accountService.confirmHold(holdId);
            
            // Step 5: Notify
            eventPublisher.publish(new PaymentSuccessEvent(request));
            
        } catch (Exception e) {
            // Compensating transaction
            accountService.releaseHold(holdId);
            eventPublisher.publish(new PaymentFailedEvent(request, e));
            throw e;
        }
    }
}
```

---

## 🚦 Rate Limiter

### Algorithms Comparison

| Algorithm | Pros | Cons | Use Case |
|-----------|------|------|----------|
| Token Bucket | Allows bursts, smooth | Memory per user | API rate limiting |
| Leaky Bucket | Smooth rate | No burst handling | Network traffic |
| Fixed Window | Simple | Boundary issues | Basic limiting |
| Sliding Window | Accurate | More complex | Accurate limiting |

### Token Bucket Implementation

```java
public class TokenBucketRateLimiter {
    private final int capacity;
    private final int refillRate; // tokens per second
    private double tokens;
    private long lastRefillTime;
    
    public synchronized boolean allowRequest() {
        refill();
        
        if (tokens >= 1) {
            tokens -= 1;
            return true;
        }
        
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        double tokensToAdd = (now - lastRefillTime) / 1000.0 * refillRate;
        tokens = Math.min(capacity, tokens + tokensToAdd);
        lastRefillTime = now;
    }
}
```

### Redis-based Distributed Rate Limiter

```java
public boolean isAllowed(String userId, int limit, int windowSecs) {
    String key = "rate_limit:" + userId;
    long now = System.currentTimeMillis();
    
    // Use Redis sorted set for sliding window
    jedis.zremrangeByScore(key, 0, now - windowSecs * 1000);
    long count = jedis.zcard(key);
    
    if (count < limit) {
        jedis.zadd(key, now, String.valueOf(now));
        jedis.expire(key, windowSecs);
        return true;
    }
    
    return false;
}
```

---

## 🔔 Notification Service

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Event Producer  │────▶│  Kafka Topic    │────▶│ Notification    │
│ (Any Service)   │     │ (notifications) │     │ Consumer        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┼───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
                ┌───────────────┐            ┌───────────────┐            ┌───────────────┐
                │ Email Service │            │ SMS Gateway   │            │ Push Service  │
                │ (SendGrid)    │            │ (Twilio)      │            │ (FCM/APNS)    │
                └───────────────┘            └───────────────┘            └───────────────┘
```

### Key Components

```java
@Service
public class NotificationService {
    
    private final Map<NotificationType, NotificationHandler> handlers;
    
    public void send(NotificationRequest request) {
        // Get user preferences
        UserPreferences prefs = userService.getPreferences(request.getUserId());
        
        // Filter by user preferences
        List<NotificationType> channels = prefs.getEnabledChannels();
        
        for (NotificationType channel : channels) {
            NotificationHandler handler = handlers.get(channel);
            
            // Async send with retry
            CompletableFuture.runAsync(() -> {
                try {
                    handler.send(request);
                } catch (Exception e) {
                    // Add to retry queue
                    retryQueue.add(request, channel);
                }
            });
        }
    }
}
```

---

## 📊 Real-time Dashboard

### Architecture for Real-time Analytics

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Transaction     │────▶│  Kafka          │────▶│ Stream          │
│ Events          │     │  (raw events)   │     │ Processing      │
└─────────────────┘     └─────────────────┘     │ (Flink/Spark)   │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ Time-Series DB  │
                                                │ (InfluxDB/      │
                                                │  TimescaleDB)   │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ WebSocket       │
                                                │ Server          │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │ Dashboard UI    │
                                                │ (React)         │
                                                └─────────────────┘
```

---

## ⚖️ Key Trade-offs

### SQL vs NoSQL

| Criteria | SQL (PostgreSQL) | NoSQL (MongoDB/DynamoDB) |
|----------|------------------|--------------------------|
| **Use When** | Complex queries, transactions | High write throughput, flexible schema |
| **ACID** | Strong | Eventual (typically) |
| **Scaling** | Vertical (primarily) | Horizontal |
| **Schema** | Fixed | Flexible |
| **Joins** | Native | Application-level |
| **Examples** | User accounts, payments | Logs, sessions, analytics |

### Synchronous vs Asynchronous

| Type | Use When | Example |
|------|----------|---------|
| **Sync** | Immediate response needed | Login, get balance |
| **Async** | Can tolerate delay | Email, notifications, reports |

### Push vs Pull

| Type | Pros | Cons |
|------|------|------|
| **Push** | Real-time updates | Connection overhead |
| **Pull** | Simple, stateless | Latency, wasted requests |
| **Long-polling** | Balance of both | Connection timeout management |
| **WebSocket** | True real-time | More complex |

### Consistency vs Availability (CAP)

| System | Choice | Example |
|--------|--------|---------|
| Banking Transactions | Consistency | Account balance must be accurate |
| Social Media Feed | Availability | Slight delay in posts is acceptable |
| Shopping Cart | Availability | Better to lose cart than deny access |

---

## 📝 Interview Tips

> [!TIP]
> **Always Clarify:**
> - Expected scale (users, requests/sec)
> - Read vs Write ratio
> - Latency requirements
> - Consistency requirements

> [!IMPORTANT]
> **For Banking/Fintech Questions:**
> - Emphasize idempotency
> - Discuss audit logging
> - Mention compliance (PCI-DSS for payments)
> - Address data encryption (at rest & in transit)

> [!NOTE]
> **Common Follow-ups:**
> - "How would you handle failures?"
> - "What if traffic increases 10x?"
> - "How do you ensure data consistency?"

---

**Good luck with your Barclays interview! 🍀**
