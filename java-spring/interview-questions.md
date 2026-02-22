[🏠 Home](../README.md) | [⬅️ Java 18-21](./features/java18-21-features.md) | [➡️ Spring Boot Guide](./spring/spring-boot-guide.md)

# Java Interview Questions - Comprehensive Guide

A collection of frequently asked interview questions across all Java versions with detailed answers.

---

## Core Concepts

### Q1: Explain the Java Memory Model
**Answer:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    JVM MEMORY STRUCTURE                          │
├─────────────────────────────────────────────────────────────────┤
│  HEAP                          │  STACK (per thread)            │
│  ├── Young Generation          │  ├── Local variables           │
│  │   ├── Eden                  │  ├── Method calls               │
│  │   ├── Survivor 0            │  └── Primitive values           │
│  │   └── Survivor 1            │                                 │
│  └── Old Generation            │  METHOD AREA (Metaspace)        │
│      └── Long-lived objects    │  ├── Class metadata             │
│                                │  ├── Static variables           │
│                                │  └── Method bytecode            │
└─────────────────────────────────────────────────────────────────┘
```

---

### Q2: What is the difference between == and equals()?
```java
String s1 = new String("hello");
String s2 = new String("hello");
String s3 = "hello";
String s4 = "hello";

s1 == s2;        // false (different objects)
s1.equals(s2);   // true (same content)
s3 == s4;        // true (string pool optimization)
s3.equals(s4);   // true
```

---

### Q3: Explain Stream pipeline lazy evaluation
**Answer:** Intermediate operations (filter, map, etc.) are lazy - they don't execute until a terminal operation is called.

```java
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Nothing happens yet! Just builds the pipeline
Stream<String> stream = names.stream()
    .filter(n -> {
        System.out.println("Filtering: " + n);
        return n.startsWith("A");
    })
    .map(String::toUpperCase);

System.out.println("Pipeline created");

// NOW it executes
stream.collect(Collectors.toList());

// Output:
// Pipeline created
// Filtering: Alice
// Filtering: Bob
// Filtering: Charlie
```

---

### Q4: What is the diamond problem and how does Java solve it?
```java
interface A { default void greet() { System.out.println("A"); } }
interface B { default void greet() { System.out.println("B"); } }

// Compile error! Must override
class C implements A, B {
    @Override
    public void greet() {
        A.super.greet();  // Choose explicitly
        // or provide own implementation
    }
}
```

---

### Q5: Difference between Collection and Stream?

| Collection | Stream |
|-----------|--------|
| Stores elements | Doesn't store, processes |
| Eager evaluation | Lazy evaluation |
| Can iterate multiple times | Single use |
| External iteration (for loop) | Internal iteration |
| Mutable | Doesn't modify source |

---

## Java 8 Questions

### Q6: What are the main functional interfaces?
```java
Predicate<T>       // T → boolean     | test()
Function<T, R>     // T → R           | apply()
Consumer<T>        // T → void        | accept()
Supplier<T>        // () → T          | get()
BiFunction<T,U,R>  // (T, U) → R      | apply()
UnaryOperator<T>   // T → T           | apply()
BinaryOperator<T>  // (T, T) → T      | apply()
```

### Q7: Explain method reference types
```java
// 1. Static method reference
Function<String, Integer> f = Integer::parseInt;

// 2. Instance method of particular object
String str = "hello";
Supplier<Integer> s = str::length;

// 3. Instance method of arbitrary object (of a particular type)
Function<String, Integer> f2 = String::length;

// 4. Constructor reference
Supplier<ArrayList<String>> supplier = ArrayList::new;
```

### Q8: When to use parallelStream()?
**Use when:**
- Large datasets (>10,000 elements)
- Independent operations (no shared state)
- CPU-bound processing

**Avoid when:**
- Small datasets (overhead exceeds benefit)
- I/O-bound operations
- Order matters and is expensive to maintain
- Stateful operations (limit, sorted affect performance)

---

## Java 9-11 Questions

### Q9: Explain Java Module System benefits
1. **Strong encapsulation** - Internal APIs hidden
2. **Reliable configuration** - Missing modules detected at startup
3. **Custom JRE** - Include only needed modules (jlink)
4. **Better security** - Smaller attack surface
5. **Performance** - Faster class loading

### Q10: var keyword restrictions
```java
// ❌ Cannot use var
var x;                     // No initializer
var x = null;              // Type cannot be inferred
var x = {1, 2};            // Array initializer
class Foo { var x = 1; }   // Fields
void method(var x) {}      // Parameters
var f = () -> {};          // Lambdas
```

---

## Java 12-17 Questions

### Q11: Record vs Lombok @Data
| Record | @Data |
|--------|-------|
| Language feature | Library/annotation |
| Immutable | Mutable by default |
| Extends Record | Extends any class |
| Component accessors (name()) | Getter (getName()) |
| Final class | Can be extended |

### Q12: Explain sealed class benefits
```java
// 1. Exhaustive pattern matching
sealed interface Shape permits Circle, Rectangle { }

// Compiler knows all subtypes - no default needed!
double area = switch (shape) {
    case Circle c -> Math.PI * c.radius() * c.radius();
    case Rectangle r -> r.width() * r.height();
    // No default needed - exhaustive!
};

// 2. Domain modeling - express closed hierarchies
// 3. API stability - prevent unwanted extensions
```

### Q13: Pattern matching instanceof advantages
```java
// OLD - redundant cast
if (obj instanceof String) {
    String s = (String) obj;
    use(s);
}

// NEW - binding variable
if (obj instanceof String s) {
    use(s);  // Already typed!
}

// With conditions
if (obj instanceof String s && s.length() > 5) {
    // s is in scope and condition checked
}
```

---

## Java 21 Questions

### Q14: Explain Virtual Threads in depth
**Key points:**
- **Lightweight** - ~1KB vs ~1MB for platform threads
- **JVM-managed** - Not OS threads
- **Cheap blocking** - Automatically unmount from carrier
- **Millions possible** - Scale I/O-bound apps easily

```java
// Simple usage
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    // Submit 1 million tasks!
    IntStream.range(0, 1_000_000).forEach(i ->
        executor.submit(() -> {
            Thread.sleep(1000);  // Cheap!
            return i;
        })
    );
}
```

**Pinning (what to avoid):**
```java
// BAD - causes pinning
synchronized (lock) {
    blockingCall();  // Virtual thread stuck on carrier
}

// GOOD - allows unmounting
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    blockingCall();  // Can unmount
} finally {
    lock.unlock();
}
```

### Q15: Structured Concurrency pattern
```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User> user = scope.fork(() -> fetchUser(id));
    Subtask<Order> order = scope.fork(() -> fetchOrder(id));
    
    scope.join();           // Wait for all
    scope.throwIfFailed();  // Propagate first failure
    
    return new Response(user.get(), order.get());
}
// All subtasks share fate - if one fails, all cancel
```

---

## Advanced Questions

### Q16: Compare Optional handling approaches
```java
// orElse - ALWAYS evaluates default
optional.orElse(expensiveDefault());  // Called even if present!

// orElseGet - LAZY evaluation
optional.orElseGet(() -> expensiveDefault());  // Only if empty

// orElseThrow - Exception if empty
optional.orElseThrow(() -> new NoSuchElementException());

// Java 10+
optional.orElseThrow();  // NoSuchElementException by default
```

### Q17: Explain Collectors cascading
```java
// Grouping with downstream collectors
Map<String, Long> countByDept = employees.stream()
    .collect(groupingBy(Employee::getDept, counting()));

Map<String, Optional<Employee>> highestPaid = employees.stream()
    .collect(groupingBy(
        Employee::getDept,
        maxBy(comparing(Employee::getSalary))
    ));

// Multi-level grouping
Map<String, Map<String, List<Employee>>> byDeptAndCity = employees.stream()
    .collect(groupingBy(
        Employee::getDept,
        groupingBy(Employee::getCity)
    ));
```

### Q18: Thread-safe collections since Java 8
```java
// ConcurrentHashMap improvements (Java 8)
map.compute(key, (k, v) -> v == null ? 1 : v + 1);
map.computeIfAbsent(key, k -> new ArrayList<>());
map.merge(key, 1, Integer::sum);

// Parallel operations
map.forEach(1000, (k, v) -> process(k, v));  // Parallel if > 1000 elements
long count = map.reduceValuesToLong(1000, Long::parseLong, 0L, Long::sum);
```

---

## Coding Challenges

### Challenge 1: Implement custom Collector
```java
// Custom collector to join strings with prefix/suffix
Collector<String, StringJoiner, String> customJoiner =
    Collector.of(
        () -> new StringJoiner(", ", "[", "]"),     // Supplier
        StringJoiner::add,                          // Accumulator
        StringJoiner::merge,                        // Combiner
        StringJoiner::toString                      // Finisher
    );

List.of("a", "b", "c").stream().collect(customJoiner);  // "[a, b, c]"
```

### Challenge 2: Flatten nested Optional
```java
// Given: Optional<Optional<String>>
// Want: Optional<String>

Optional<Optional<String>> nested = Optional.of(Optional.of("value"));
Optional<String> flat = nested.flatMap(Function.identity());
```

### Challenge 3: Group and sort
```java
// Group employees by department, sort by salary within each group
Map<String, List<Employee>> result = employees.stream()
    .sorted(comparing(Employee::getSalary).reversed())
    .collect(groupingBy(Employee::getDepartment));
```
