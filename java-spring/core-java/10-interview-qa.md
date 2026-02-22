[🏠 Home](../../README.md) | [⬅️ Concurrency Utilities](./09-concurrency-utilities.md)

# 📝 Java Internals Interview Q&A

> 30+ rapid-fire questions with answers

---

## 🏗️ JVM & Memory

| # | Question | Answer |
|---|----------|--------|
| 1 | JDK vs JRE vs JVM? | JDK = tools + JRE, JRE = JVM + libs, JVM = bytecode executor |
| 2 | What is bytecode? | Platform-independent `.class` file (interpreted by JVM) |
| 3 | Heap vs Stack? | Heap = objects (shared), Stack = local vars (per-thread) |
| 4 | What causes StackOverflowError? | Deep recursion (too many stack frames) |
| 5 | What causes OutOfMemoryError? | Heap full, Metaspace full, too many threads |
| 6 | What is Metaspace? | Class metadata area (native memory, Java 8+) |
| 7 | What is String Pool? | Cache for string literals (in Heap since Java 7) |
| 8 | What does intern() do? | Puts string into pool, returns pool reference |

---

## 🗑️ Garbage Collection

| # | Question | Answer |
|---|----------|--------|
| 9 | What is GC Root? | Starting points for reachability (stack vars, static vars) |
| 10 | Minor vs Major GC? | Minor = Young Gen (fast), Major = Old Gen (slow) |
| 11 | Eden → Survivor → Old? | Objects move from Eden to Survivor (if alive) to Old (long-lived) |
| 12 | Default GC in Java 11+? | G1 |
| 13 | When to use ZGC? | Low latency, huge heaps (multi-TB) |
| 14 | How to tune GC? | -Xms, -Xmx, -XX:MaxGCPauseMillis |

---

## ⚡ JIT & Performance

| # | Question | Answer |
|---|----------|--------|
| 15 | What is JIT? | Just-In-Time: compiles bytecode → native at runtime |
| 16 | C1 vs C2 compiler? | C1 = fast compile, C2 = aggressive optimization |
| 17 | What is method inlining? | Replace method call with method body |
| 18 | What is escape analysis? | Determines if object can be stack-allocated |

---

## 📦 Collections

| # | Question | Answer |
|---|----------|--------|
| 19 | ArrayList vs LinkedList? | Array = O(1) get, LinkedList = O(1) insert |
| 20 | HashMap load factor? | 0.75 (resize at 75% capacity) |
| 21 | How HashMap handles collision? | Chaining (linked list → tree after 8) |
| 22 | HashSet internally? | Uses HashMap with dummy values |
| 23 | TreeMap time complexity? | O(log n) - Red-Black Tree |
| 24 | ConcurrentHashMap vs HashMap? | CHM = thread-safe, bucket-level locking |

---

## 🧵 Multithreading

| # | Question | Answer |
|---|----------|--------|
| 25 | Thread states? | NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED |
| 26 | start() vs run()? | start() creates new thread, run() uses current |
| 27 | Runnable vs Callable? | Runnable = void, Callable = returns value + throws |
| 28 | wait() vs sleep()? | wait() releases lock, sleep() doesn't |
| 29 | Why use ExecutorService? | Thread reuse, task queue, controlled concurrency |

---

## 🔒 Concurrency

| # | Question | Answer |
|---|----------|--------|
| 30 | synchronized vs volatile? | sync = lock + visibility, volatile = visibility only |
| 31 | What is happens-before? | Memory visibility guarantee between threads |
| 32 | AtomicInteger uses? | CAS (Compare-And-Swap), lock-free |
| 33 | ReentrantLock vs synchronized? | Lock has tryLock, timeouts, fairness |
| 34 | CountDownLatch vs CyclicBarrier? | Latch = one-time, Barrier = reusable |
| 35 | What is deadlock? | Threads waiting for each other's locks |

---

## 🎯 Behavioral Tips

1. **Explain thought process**: "I'm considering HashMap because..."
2. **Draw diagrams**: Heap layout, thread states
3. **Give examples**: "For instance, String Pool prevents..."
4. **Mention trade-offs**: "HashMap is O(1) but not sorted..."
5. **Know defaults**: Load factor 0.75, initial capacity 16

---

## 🧠 Memory Hooks Recap

| Topic | Hook |
|-------|------|
| JVM Stack | Kitchen → Plate → Food |
| Heap Generations | ESO (Eden → Survivor → Old) |
| GC Algorithms | SPCGZ (Serial, Parallel, CMS, G1, ZGC) |
| Thread States | NRBWT |
| Collections | LSMQ (List, Set, Map, Queue) |
| Thread Safety | SVA (Synchronized, Volatile, Atomic) |

---

*Master these and you're interview-ready! 🚀*
