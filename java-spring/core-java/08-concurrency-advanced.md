[🏠 Home](../../README.md) | [⬅️ Multithreading](./07-multithreading-basics.md) | [➡️ Concurrency Utilities](./09-concurrency-utilities.md)

# 🔒 Concurrency Advanced

> Thread safety and memory visibility

---

## 🧠 Memory Hook

> **"SVA"** = Synchronized, Volatile, Atomic (3 ways to thread safety)
> 
> **"HB"** = Happens-Before (memory visibility guarantee)

---

## 📊 The Problem: Visibility

```java
// Thread 1
running = true;

// Thread 2
while (running) {  // May see stale value forever!
    doWork();
}
```

Without proper synchronization, Thread 2 might **never** see the updated value.

---

## 🔧 synchronized Keyword ⭐

Provides **mutual exclusion** + **visibility**.

### Method Level
```java
public synchronized void increment() {
    count++;  // Only one thread at a time
}

// Static synchronized = locks on Class object
public static synchronized void staticMethod() { }
```

### Block Level (Preferred)
```java
private final Object lock = new Object();

public void increment() {
    synchronized (lock) {
        count++;
    }
}
```

### Intrinsic Lock (Monitor)
```java
synchronized (this) {
    // Acquires lock on 'this' object
    // Other threads wait
}
// Releases lock automatically
```

---

## ⚡ volatile Keyword

Provides **visibility** only (no atomicity).

```java
private volatile boolean running = true;

// Thread 1 writes
running = false;

// Thread 2 reads - guaranteed to see new value
while (running) { }
```

### When to Use
- ✅ Simple flags (stop signal)
- ✅ One writer, multiple readers
- ❌ Compound operations (i++)

```java
// WRONG: Not atomic
volatile int count = 0;
count++;  // Read + Add + Write = 3 operations!

// RIGHT: Use AtomicInteger instead
AtomicInteger count = new AtomicInteger(0);
count.incrementAndGet();
```

---

## 🔢 Atomic Classes

Lock-free thread-safe operations using **CAS** (Compare-And-Swap).

```java
AtomicInteger counter = new AtomicInteger(0);

counter.incrementAndGet();       // ++count
counter.getAndIncrement();       // count++
counter.addAndGet(5);            // count += 5
counter.compareAndSet(10, 20);   // if == 10, set to 20

// Other atomic classes
AtomicLong, AtomicBoolean, AtomicReference<V>
AtomicIntegerArray, AtomicLongArray
LongAdder  // Better for high contention
```

### CAS Algorithm
```
1. Read current value
2. Compute new value
3. If current still matches → update (success)
   Else → retry from step 1
```

---

## 🔐 Lock Interface (java.util.concurrent.locks)

More flexible than `synchronized`.

### ReentrantLock
```java
Lock lock = new ReentrantLock();

lock.lock();
try {
    // Critical section
} finally {
    lock.unlock();  // ALWAYS in finally!
}

// Try lock (non-blocking)
if (lock.tryLock(1, TimeUnit.SECONDS)) {
    try { /* work */ } finally { lock.unlock(); }
}
```

### ReadWriteLock
Multiple readers OR one writer.

```java
ReadWriteLock rwLock = new ReentrantReadWriteLock();
Lock readLock = rwLock.readLock();
Lock writeLock = rwLock.writeLock();

// Multiple threads can read simultaneously
readLock.lock();
try { return data; } finally { readLock.unlock(); }

// Only one thread can write
writeLock.lock();
try { data = newValue; } finally { writeLock.unlock(); }
```

### synchronized vs Lock

| Feature | synchronized | Lock |
|---------|--------------|------|
| Automatic unlock | ✅ | ❌ (need finally) |
| Try lock | ❌ | ✅ |
| Timed wait | ❌ | ✅ |
| Fairness | ❌ | ✅ (optional) |
| Multiple conditions | ❌ | ✅ |

---

## 📖 Happens-Before Relationship

Guarantees that memory writes by one thread are visible to another.

```
Happens-Before Rules:
1. Program order: Within thread, earlier → later
2. Monitor lock: unlock() → subsequent lock()
3. Volatile: write → subsequent read
4. Thread start: start() → run()
5. Thread join: Thread terminates → join() returns
6. Transitive: A→B and B→C implies A→C
```

---

## 🗂️ Thread-Safe Collections

| Collection | Thread-Safe Alternative |
|------------|------------------------|
| ArrayList | CopyOnWriteArrayList |
| HashSet | CopyOnWriteArraySet, ConcurrentHashMap.newKeySet() |
| HashMap | ConcurrentHashMap |
| TreeMap | ConcurrentSkipListMap |
| Queue | ConcurrentLinkedQueue, LinkedBlockingQueue |

### ConcurrentHashMap
```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.put("A", 1);
map.putIfAbsent("B", 2);
map.compute("A", (k, v) -> v + 1);  // Atomic update
map.merge("A", 1, Integer::sum);    // Atomic merge
```

---

## 💡 Interview Flash Cards

| Question | Answer |
|----------|--------|
| synchronized vs volatile? | sync = lock + visibility, volatile = visibility only |
| What is happens-before? | Memory visibility guarantee between threads |
| CAS vs Lock? | CAS = optimistic (retry), Lock = pessimistic (block) |
| ReentrantLock vs synchronized? | Lock has tryLock, timeouts, fairness |
| What is a race condition? | Multiple threads access shared data, at least one writes |
| What is ConcurrentHashMap segment? | Bucket-level locking (Java 8+: node-level) |

---

## ⚡ Key Points

- ⭐ `synchronized` = mutual exclusion + visibility
- ⭐ `volatile` = visibility only (no compound operations)
- 🔥 Use `AtomicInteger` for lock-free counters
- 💡 Always unlock in `finally` block
- 💡 Prefer `ConcurrentHashMap` over `Collections.synchronizedMap()`

---

*Next: [Concurrency Utilities →](./09-concurrency-utilities.md)*
