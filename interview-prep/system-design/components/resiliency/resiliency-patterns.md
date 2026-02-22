# Resiliency Patterns in Distributed Systems

How to build systems that survive failure. "Everything fails all the time." — Werner Vogels.

---

## 1. Circuit Breaker Pattern

**Problem**: If Service A calls Service B, and Service B is down, Service A shouldn't keep waiting and consuming threads. It should "fail fast".

### The 3 States
1.  **CLOSED** (Normal): Request flows through. We count failures.
2.  **OPEN** (Tripped): Failure threshold reached (e.g., 50% errors). Requests fail *immediately* without calling B.
3.  **HALF-OPEN** (Testing): After a `waitDuration`, let a few requests through.
    - If success -> Go to **CLOSED**.
    - If fail -> Go back to **OPEN**.

**Tools**: Resilience4j (Java/Spring), Polly (.NET).

---

## 2. Rate Limiting

**Problem**: Protect your service from being overwhelmed by too many requests (DoS or noisy neighbor).

### Algorithms

#### Token Bucket
- **Concept**: Bucket holds `N` tokens. Refill `R` tokens/sec.
- **Request**: Needs 1 token to proceed.
- **Burst**: Allowed (up to bucket size).
- **Best for**: Allow short bursts but cap average rate.

#### Leaky Bucket
- **Concept**: Requests enter queue. Processed at fixed rate.
- **Request**: If queue full, drop.
- **Burst**: Smooths out traffic. No bursts.
- **Best for**: Writing to a database/queue with fixed capacity.

#### Sliding Window Log
- **Concept**: Log timestamp of each request. Count logs in last window (e.g., 1 min).
- **Pros**: Very accurate.
- **Cons**: High memory usage.

### Distributed Rate Limiting
Local memory limits don't work well in a cluster. Use **Redis** with Lua scripts to maintain global counters atomically.

---

## 3. Bulkhead Pattern

**Concept**: Inspired by ships. Partition your system so a failure in one part doesn't sink the whole ship.

**Implementation**:
- Isolate Thread Pools.
- **Example**:
    - `ThreadPool-A` for User Service calls.
    - `ThreadPool-B` for Analytics Service calls.
    - If Analytics Service hangs, `ThreadPool-B` fills up, but `ThreadPool-A` is unaffected. Users can still login.

---

## 4. Retry & Timeout Patterns

### Timeouts
**Always** set a timeout.
- Connection Timeout: Time to establish connection (TCP handshake).
- Read/Socket Timeout: Time waiting for data.
- **Rule**: Timeout should be shorter than the Circuit Breaker timeout.

### Retries
Retry transient failures (Network blip, 503). **Do NOT** retry persistent failures (400 Bad Request, 401 Auth).

#### Strategies
1.  **Exponential Backoff**: Wait 1s, then 2s, then 4s, 8s...
    - Prevents hammering a struggling service.
2.  **Jitter**: Add random noise to the wait time (e.g., `wait = backoff + random(0, 100ms)`).
    - Prevents **Thundering Herd** problem where all clients retry at the exact same millisecond.

---

## 5. Idempotency

If you retry a **write** operation (POST/PUT), you might execute it twice.
- **Solution**: Idempotency Keys.
- Client generates GUID `requestId`.
- Server checks: "Did I already process `requestId`?"
    - Yes: Return cached 200 OK.
    - No: Process and save ID.

---

## 6. Summary: The Resiliency Stack

Layer these patterns for maximum robustness:

1.  **Timeout**: The baseline.
2.  **Retry**: For transient glitches.
3.  **Circuit Breaker**: For sustained outages.
4.  **Bulkhead**: For resource isolation.
5.  **Rate Limiter**: For traffic control.
