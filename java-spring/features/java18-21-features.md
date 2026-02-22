[🏠 Home](../../README.md) | [⬅️ Java 12-17](./java12-17-features.md) | [➡️ Interview Questions](../interview-questions.md)

# Java 18-21 Features (Latest Java)

---

## Java 21: Virtual Threads (Project Loom) - LTS

### Why Was It Needed?

Traditional threads have significant overhead:
```
┌────────────────────────────────────────────────────────────────┐
│                    PLATFORM THREAD PROBLEM                     │
├────────────────────────────────────────────────────────────────┤
│  1 Platform Thread = ~1MB stack memory                         │
│  10,000 threads = ~10GB RAM just for stacks!                   │
│                                                                │
│  OS Thread Limit:                                              │
│  • Linux: ~32,000 threads per process                          │
│  • Context switching is expensive                              │
│                                                                │
│  For I/O-bound apps (web servers, DB connections):             │
│  • Thread-per-request model doesn't scale                      │
│  • Forced to use complex async/reactive programming            │
└────────────────────────────────────────────────────────────────┘
```

### The Solution - Virtual Threads

```java
// Creating Virtual Threads

// Method 1: Thread.startVirtualThread()
Thread.startVirtualThread(() -> {
    System.out.println("Hello from virtual thread!");
});

// Method 2: Thread.ofVirtual()
Thread vThread = Thread.ofVirtual()
    .name("my-virtual-thread")
    .start(() -> doWork());

// Method 3: ExecutorService (recommended for production)
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 100_000).forEach(i -> {
        executor.submit(() -> {
            Thread.sleep(Duration.ofSeconds(1));
            return i;
        });
    });
}  // Auto-closes, waits for completion
```

### Comparison: Platform vs Virtual Threads

```java
// Platform threads - 10,000 threads is pushing limits
try (var executor = Executors.newFixedThreadPool(200)) {
    // Limited by thread pool size
}

// Virtual threads - 1 million concurrent tasks is easy!
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        executor.submit(() -> {
            // Each task gets its own virtual thread
            // Blocking calls like I/O automatically yield
            Thread.sleep(Duration.ofSeconds(1));
            httpClient.send(request, bodyHandler);
            return result;
        });
    }
}

// Virtual threads: ~1KB vs Platform threads: ~1MB
// Can have millions of virtual threads!
```

### How Virtual Threads Work

```
┌─────────────────────────────────────────────────────────────────┐
│                 VIRTUAL THREADS ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Virtual Thread 1 ──┐                                          │
│   Virtual Thread 2 ──┼──▶ Carrier Thread (Platform Thread)     │
│   Virtual Thread 3 ──┘         │                                │
│                                │                                │
│   When Virtual Thread blocks:  ▼                                │
│   1. Unmounts from carrier   ╔═══════════════╗                  │
│   2. Carrier is free         ║  ForkJoinPool ║                  │
│   3. Another VT mounts       ╚═══════════════╝                  │
│                                                                 │
│   Blocking I/O is now cheap! No thread wasted waiting.          │
└─────────────────────────────────────────────────────────────────┘
```

### Practical Example: High-Concurrency Server

```java
public class VirtualThreadServer {
    public static void main(String[] args) throws Exception {
        // Create HTTP server with virtual threads
        var server = HttpServer.create(new InetSocketAddress(8080), 0);
        
        // Each request handled by virtual thread
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
        
        server.createContext("/api", exchange -> {
            // Blocking DB call - doesn't waste OS threads!
            String data = database.query("SELECT * FROM users");
            
            // Blocking HTTP call - still efficient!
            String externalData = httpClient.send(request, bodyHandler).body();
            
            exchange.sendResponseHeaders(200, response.length);
            exchange.getOutputStream().write(data.getBytes());
        });
        
        server.start();
    }
}
```

### Best Practices for Virtual Threads

```java
// ✅ DO: Use for I/O-bound operations
executor.submit(() -> {
    var data = Files.readString(path);        // File I/O
    var response = httpClient.send(request);  // Network I/O
    database.query(sql);                      // Database I/O
});

// ❌ DON'T: Use for CPU-bound operations
// Virtual threads don't help with CPU-intensive work
executor.submit(() -> {
    computeHash(largeData);  // CPU-bound - use platform threads
});

// ❌ AVOID: Synchronized blocks with virtual threads (can cause pinning)
synchronized (lock) {
    // Virtual thread gets "pinned" to carrier
    // Cannot unmount during blocking operations inside
}

// ✅ PREFER: ReentrantLock over synchronized
private final ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // Virtual thread can unmount if blocked here
} finally {
    lock.unlock();
}
```

---

## Java 21: Sequenced Collections

### Why Was It Needed?

```java
// Before Java 21 - Inconsistent APIs for first/last elements
List<String> list = new ArrayList<>();
list.get(0);                    // First
list.get(list.size() - 1);      // Last - verbose!

LinkedHashSet<String> set = new LinkedHashSet<>();
set.iterator().next();          // First - awkward
// Last element? Convert to array or stream? 😫

TreeMap<K, V> map = new TreeMap<>();
map.firstEntry();               // OK
map.lastEntry();                // OK but different from HashMap
```

### The Solution - Unified Interface

```java
// New interfaces in Java 21
public interface SequencedCollection<E> extends Collection<E> {
    SequencedCollection<E> reversed();
    void addFirst(E e);
    void addLast(E e);
    E getFirst();
    E getLast();
    E removeFirst();
    E removeLast();
}

public interface SequencedSet<E> 
    extends Set<E>, SequencedCollection<E> { }

public interface SequencedMap<K, V> extends Map<K, V> {
    SequencedMap<K, V> reversed();
    Map.Entry<K, V> firstEntry();
    Map.Entry<K, V> lastEntry();
    // ... more methods
}
```

### Usage Examples

```java
// Works with List, LinkedHashSet, TreeSet, etc.
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();     // "a"
list.getLast();      // "c"
list.addFirst("z");  // ["z", "a", "b", "c"]
list.removeLast();   // removes "c"

// Reversed view
List<String> reversed = list.reversed();
reversed.forEach(System.out::println);  // c, b, a, z

// LinkedHashSet
LinkedHashSet<Integer> set = new LinkedHashSet<>(List.of(1, 2, 3));
set.getFirst();  // 1
set.getLast();   // 3

// LinkedHashMap / TreeMap
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("a", 1);
map.put("b", 2);
map.firstEntry();  // a=1
map.lastEntry();   // b=2
map.pollFirstEntry();  // Removes and returns a=1
```

---

## Java 21: Pattern Matching for Switch (Finalized)

```java
// Complete pattern matching with switch
public String describe(Object obj) {
    return switch (obj) {
        case null -> "It's null";
        case String s -> "String of length " + s.length();
        case Integer i when i > 0 -> "Positive integer: " + i;
        case Integer i -> "Non-positive integer: " + i;
        case int[] arr -> "Int array of length " + arr.length;
        case Point(int x, int y) -> "Point at (" + x + ", " + y + ")";
        default -> "Unknown type";
    };
}

// Record patterns - deconstruct records directly
record Point(int x, int y) { }
record Line(Point start, Point end) { }

public double length(Object obj) {
    return switch (obj) {
        case Line(Point(var x1, var y1), Point(var x2, var y2)) -> 
            Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        default -> 0;
    };
}

// Guard patterns with 'when'
public String category(Integer value) {
    return switch (value) {
        case Integer i when i < 0 -> "negative";
        case Integer i when i == 0 -> "zero";
        case Integer i when i <= 100 -> "small positive";
        default -> "large positive";
    };
}
```

---

## Java 21: Record Patterns

```java
// Decompose records in instanceof and switch
record Pair<T, U>(T first, U second) { }

// Pattern matching with instanceof
if (obj instanceof Pair(String s, Integer i)) {
    System.out.println("String: " + s + ", Integer: " + i);
}

// Nested record patterns
record Outer(Pair<String, Integer> pair, String name) { }

Object obj = new Outer(new Pair<>("hello", 42), "test");

if (obj instanceof Outer(Pair(var s, var i), var n)) {
    System.out.println(s + ", " + i + ", " + n);
}

// In switch
String result = switch (obj) {
    case Outer(Pair(String s, Integer i), String n) when i > 0 ->
        "Positive: " + s + " " + i;
    case Outer(Pair(String s, Integer i), String n) ->
        "Non-positive: " + s + " " + i;
    default -> "Unknown";
};
```

---

## Java 20+: Scoped Values (Preview)

### Alternative to ThreadLocal for Virtual Threads

```java
// ThreadLocal stores per-thread data
// But with millions of virtual threads, this becomes expensive

// ScopedValue - immutable, automatically scoped
private static final ScopedValue<User> CURRENT_USER = ScopedValue.newInstance();

void handleRequest(Request request) {
    User user = authenticate(request);
    
    // Bind value for this scope
    ScopedValue.where(CURRENT_USER, user)
        .run(() -> {
            processRequest(request);  // Can access CURRENT_USER
            callService();            // Still accessible
        });
    // Value automatically cleared after scope ends
}

void processRequest(Request request) {
    User user = CURRENT_USER.get();  // Access bound value
    // use user...
}
```

---

## Interview Questions

### Q1: Virtual Threads vs Platform Threads?

| Virtual Threads | Platform Threads |
|-----------------|------------------|
| ~1KB memory | ~1MB memory |
| Millions possible | Limited (thousands) |
| Best for I/O-bound | Best for CPU-bound |
| Managed by JVM | Managed by OS |
| Cheap blocking | Expensive blocking |

### Q2: When NOT to use Virtual Threads?
1. **CPU-bound tasks** - No benefit, use platform threads
2. **With synchronized blocks** - Causes "pinning"
3. **Pooling virtual threads** - Anti-pattern! Create per-task
4. **Long-running computations** - No yielding opportunity

### Q3: What is thread pinning?
When a virtual thread cannot unmount from its carrier:
- Inside `synchronized` block during blocking
- During native method calls

Solution: Use `ReentrantLock` instead of `synchronized`.

### Q4: Explain Sequenced Collections hierarchy
```
SequencedCollection
├── SequencedSet
│   ├── LinkedHashSet
│   ├── TreeSet
│   └── SortedSet
└── List
    ├── ArrayList
    └── LinkedList

SequencedMap
├── LinkedHashMap
├── TreeMap
└── SortedMap
```

### Q5: What is Structured Concurrency?
```java
// Treats related tasks as a unit
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<String> user = scope.fork(() -> fetchUser());
    Subtask<Integer> order = scope.fork(() -> fetchOrder());
    
    scope.join();           // Wait for both
    scope.throwIfFailed();  // Propagate errors
    
    return new Response(user.get(), order.get());
}
// All subtasks complete or fail together
```

---

## Summary: Java Evolution At a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                    JAVA VERSION HIGHLIGHTS                       │
├─────────┬───────────────────────────────────────────────────────┤
│ Java 8  │ Functional programming: Lambda, Stream, Optional      │
│ Java 9  │ Modularity: JPMS, JShell                              │
│ Java 10 │ Type inference: var keyword                           │
│ Java 11 │ HTTP Client, String improvements (LTS)                │
│ Java 14 │ Switch expressions, Records preview                   │
│ Java 16 │ Records, Pattern matching instanceof                  │
│ Java 17 │ Sealed classes (LTS)                                  │
│ Java 21 │ Virtual threads, Pattern matching, Sequenced (LTS)    │
└─────────┴───────────────────────────────────────────────────────┘
```
