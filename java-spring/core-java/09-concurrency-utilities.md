[🏠 Home](../../README.md) | [⬅️ Concurrency Advanced](./08-concurrency-advanced.md) | [➡️ Interview Q&A](./10-interview-qa.md)

# 🛠️ Concurrency Utilities

> High-level synchronization tools

---

## 🧠 Memory Hook

> **"CSCP"** = CountDownLatch, Semaphore, CyclicBarrier, Phaser

---

## 📊 Synchronizers Overview

| Class | Purpose | Reusable? |
|-------|---------|-----------|
| CountDownLatch | Wait for N events | No |
| CyclicBarrier | N threads wait for each other | Yes |
| Semaphore | Limit concurrent access | Yes |
| Phaser | Flexible phased tasks | Yes |

---

## 🚦 CountDownLatch

Wait for N events to complete.

```java
CountDownLatch latch = new CountDownLatch(3);

// Worker threads
executor.submit(() -> { doWork(); latch.countDown(); });
executor.submit(() -> { doWork(); latch.countDown(); });
executor.submit(() -> { doWork(); latch.countDown(); });

// Main thread waits
latch.await();  // Blocks until count reaches 0
System.out.println("All tasks done!");
```

**Use Case**: Wait for all services to start.

---

## 🚧 CyclicBarrier

N threads wait for each other at a barrier.

```java
CyclicBarrier barrier = new CyclicBarrier(3, () -> {
    System.out.println("All arrived, continuing...");
});

// Each thread
executor.submit(() -> {
    doWork();
    barrier.await();  // Wait for others
    continueWork();
});
```

**Use Case**: Parallel algorithms with sync points.

---

## 🎫 Semaphore

Limit concurrent access to a resource.

```java
Semaphore semaphore = new Semaphore(3);  // 3 permits

executor.submit(() -> {
    semaphore.acquire();  // Block if no permits
    try {
        accessResource();
    } finally {
        semaphore.release();
    }
});
```

**Use Case**: Connection pool, rate limiting.

---

## ⚡ CompletableFuture ⭐

Async programming made easy (Java 8+).

### Basic Usage
```java
CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
    return fetchData();  // Runs in ForkJoinPool
});

String result = future.get();  // Blocks
```

### Chaining
```java
CompletableFuture.supplyAsync(() -> "Hello")
    .thenApply(s -> s + " World")        // Transform
    .thenApply(String::toUpperCase)
    .thenAccept(System.out::println);    // Consume
// Output: HELLO WORLD
```

### Combining
```java
CompletableFuture<String> f1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> f2 = CompletableFuture.supplyAsync(() -> "World");

// Combine two futures
f1.thenCombine(f2, (s1, s2) -> s1 + " " + s2)
  .thenAccept(System.out::println);

// Wait for all
CompletableFuture.allOf(f1, f2).join();

// Wait for any
CompletableFuture.anyOf(f1, f2).thenAccept(System.out::println);
```

### Error Handling
```java
CompletableFuture.supplyAsync(() -> riskyOperation())
    .exceptionally(ex -> "Default")      // On error
    .thenAccept(System.out::println);

// Or handle both
.handle((result, ex) -> {
    if (ex != null) return "Error: " + ex.getMessage();
    return result;
});
```

---

## 📦 BlockingQueue

Thread-safe queue for producer-consumer.

```java
BlockingQueue<Task> queue = new LinkedBlockingQueue<>(100);

// Producer
queue.put(task);     // Blocks if full

// Consumer
Task t = queue.take();  // Blocks if empty
```

| Method | Blocks? | Use When |
|--------|---------|----------|
| put/take | Yes | Okay to wait |
| offer/poll | No (returns false/null) | Can't wait |
| offer(e, time) | Timed | Limited wait |

---

## 💡 Interview Flash Cards

| Question | Answer |
|----------|--------|
| CountDownLatch vs CyclicBarrier? | Latch = one-time, Barrier = reusable |
| What is Semaphore? | Limits concurrent access (N permits) |
| CompletableFuture vs Future? | CF has chaining, combining, error handling |
| BlockingQueue producer-consumer? | Producer → put(), Consumer → take() |
| How to run task asynchronously? | CompletableFuture.supplyAsync(() → ...) |

---

## ⚡ Quick Reference

```java
// Wait for all tasks
CountDownLatch latch = new CountDownLatch(n);
latch.countDown();  // Worker calls
latch.await();      // Main waits

// Sync point
CyclicBarrier barrier = new CyclicBarrier(n);
barrier.await();  // All threads wait

// Limit access
Semaphore sem = new Semaphore(n);
sem.acquire(); try { } finally { sem.release(); }

// Async pipeline
CompletableFuture.supplyAsync(() -> fetch())
    .thenApply(this::transform)
    .thenAccept(this::consume);
```

---

*Next: [Interview Q&A →](./10-interview-qa.md)*
