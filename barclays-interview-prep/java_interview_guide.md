# Core Java Interview Guide for Barclays ☕

> **Target Role:** Software Engineer / Senior Software Engineer  
> **Focus:** Deep dive into Core Java concepts frequently asked at Barclays

---

## 📋 Table of Contents

1. [OOP Concepts](#oop-concepts)
2. [Collections Framework](#collections-framework)
3. [Multithreading & Concurrency](#multithreading--concurrency)
4. [Java Memory Model](#java-memory-model)
5. [Exception Handling](#exception-handling)
6. [Java 8+ Features](#java-8-features)
7. [Design Patterns](#design-patterns)
8. [Common Coding Questions](#common-coding-questions)

---

## 🎯 OOP Concepts

### 1. Four Pillars of OOP

#### Encapsulation
```java
public class BankAccount {
    private double balance; // Hidden from outside
    private String accountNumber;
    
    // Controlled access through methods
    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
        }
    }
    
    public double getBalance() {
        return balance;
    }
}
```

#### Inheritance
```java
// Parent class
public class Employee {
    protected String name;
    protected double salary;
    
    public void work() {
        System.out.println("Working...");
    }
}

// Child class
public class Developer extends Employee {
    private String programmingLanguage;
    
    @Override
    public void work() {
        System.out.println("Writing code in " + programmingLanguage);
    }
}
```

#### Polymorphism
```java
// Compile-time (Method Overloading)
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
    public int add(int a, int b, int c) { return a + b + c; }
}

// Runtime (Method Overriding)
public class Animal {
    public void speak() { System.out.println("Some sound"); }
}

public class Dog extends Animal {
    @Override
    public void speak() { System.out.println("Bark!"); }
}

// Usage
Animal animal = new Dog(); // Upcasting
animal.speak(); // Output: Bark! (Runtime polymorphism)
```

#### Abstraction
```java
// Abstract Class
public abstract class Shape {
    protected String color;
    
    public abstract double area(); // Must be implemented
    
    public void display() { // Can have concrete methods
        System.out.println("Color: " + color);
    }
}

// Interface (100% abstraction before Java 8)
public interface Drawable {
    void draw(); // public abstract by default
    
    // Java 8+: default methods
    default void print() {
        System.out.println("Printing...");
    }
}
```

### 2. Abstract Class vs Interface

| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Methods | Abstract + Concrete | Abstract (default/static in Java 8+) |
| Variables | Any type | public static final only |
| Constructor | ✅ Yes | ❌ No |
| Multiple Inheritance | ❌ Single | ✅ Multiple |
| Access Modifiers | Any | public only (methods) |
| When to Use | Common base + some implementation | Contract/capability |

### 3. Method Overloading vs Overriding

```java
// Overloading Rules:
// - Same method name
// - Different parameters (number, type, or order)
// - Return type can be different
// - Can have different access modifiers
// - Can throw different exceptions

// Overriding Rules:
// - Same method signature (name + parameters)
// - Return type: same or covariant (subtype)
// - Access: same or more permissive
// - Exceptions: same, subset, or none (not broader)
// - Cannot override static, final, or private methods
```

---

## 📦 Collections Framework

### 1. Collections Hierarchy

```
                    Iterable
                       |
                   Collection
                  /    |    \
               Set   List  Queue
              / |      |      |
         HashSet   ArrayList  PriorityQueue
        TreeSet   LinkedList  Deque
       LinkedHashSet
       
                     Map
                   /  |  \
             HashMap TreeMap LinkedHashMap
            ConcurrentHashMap Hashtable
```

### 2. HashMap Internal Working

```java
/**
 * HashMap Structure:
 * - Array of buckets (Node<K,V>[])
 * - Each bucket is a linked list (or tree if size > 8)
 * 
 * Operations:
 * 1. put(key, value):
 *    - Calculate hash: key.hashCode() ^ (h >>> 16)
 *    - Find bucket index: hash & (n-1) where n = array length
 *    - If bucket empty, add new node
 *    - If collision, traverse list/tree using equals()
 *    
 * 2. Resize (when size > threshold):
 *    - threshold = capacity * loadFactor (default 0.75)
 *    - Double capacity and rehash all entries
 */

// Custom key class must override both
public class Employee {
    private int id;
    private String name;
    
    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
    
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Employee employee = (Employee) obj;
        return id == employee.id && Objects.equals(name, employee.name);
    }
}
```

### 3. HashMap vs ConcurrentHashMap vs Hashtable

| Feature | HashMap | ConcurrentHashMap | Hashtable |
|---------|---------|-------------------|-----------|
| Thread-safe | ❌ | ✅ (segment locking) | ✅ (whole map lock) |
| Null key/value | 1 null key, many null values | ❌ | ❌ |
| Performance | Fastest (single-threaded) | High (concurrent) | Slow (synchronized) |
| Iterator | Fail-fast | Fail-safe | Fail-fast |
| Java Version | 1.2 | 1.5 | 1.0 (Legacy) |

### 4. When to Use Which Collection?

```java
// List - Ordered, allows duplicates
List<String> arrayList = new ArrayList<>();    // Fast random access O(1)
List<String> linkedList = new LinkedList<>();  // Fast insert/delete O(1)

// Set - Unique elements
Set<String> hashSet = new HashSet<>();         // O(1) lookup, unordered
Set<String> treeSet = new TreeSet<>();         // O(log n), sorted
Set<String> linkedHashSet = new LinkedHashSet<>(); // O(1), insertion order

// Map - Key-Value pairs
Map<String, Integer> hashMap = new HashMap<>();
Map<String, Integer> treeMap = new TreeMap<>();    // Sorted by keys
Map<String, Integer> linkedHashMap = new LinkedHashMap<>(); // Insertion order

// Queue
Queue<Integer> priorityQueue = new PriorityQueue<>(); // Min-heap by default
Deque<Integer> arrayDeque = new ArrayDeque<>(); // Stack or Queue operations
```

---

## 🔄 Multithreading & Concurrency

### 1. Creating Threads

```java
// Method 1: Extend Thread class
class MyThread extends Thread {
    @Override
    public void run() {
        System.out.println("Thread running: " + Thread.currentThread().getName());
    }
}

// Method 2: Implement Runnable (preferred)
class MyRunnable implements Runnable {
    @Override
    public void run() {
        System.out.println("Runnable running");
    }
}

// Method 3: Callable with Future (returns value)
class MyCallable implements Callable<Integer> {
    @Override
    public Integer call() throws Exception {
        return 42;
    }
}

// Method 4: Lambda (Java 8+)
Thread lambdaThread = new Thread(() -> {
    System.out.println("Lambda thread");
});

// Usage
public static void main(String[] args) {
    // Thread
    new MyThread().start();
    
    // Runnable
    new Thread(new MyRunnable()).start();
    
    // Callable
    ExecutorService executor = Executors.newSingleThreadExecutor();
    Future<Integer> future = executor.submit(new MyCallable());
    Integer result = future.get(); // Blocking call
    executor.shutdown();
}
```

### 2. Synchronization

```java
public class Counter {
    private int count = 0;
    
    // Method 1: Synchronized method
    public synchronized void increment() {
        count++;
    }
    
    // Method 2: Synchronized block (more granular)
    private final Object lock = new Object();
    
    public void incrementWithBlock() {
        synchronized (lock) {
            count++;
        }
    }
    
    // Method 3: ReentrantLock (more control)
    private final ReentrantLock reentrantLock = new ReentrantLock();
    
    public void incrementWithLock() {
        reentrantLock.lock();
        try {
            count++;
        } finally {
            reentrantLock.unlock();
        }
    }
}
```

### 3. wait(), notify(), notifyAll()

```java
public class ProducerConsumer {
    private Queue<Integer> queue = new LinkedList<>();
    private int capacity = 5;
    
    public synchronized void produce(int value) throws InterruptedException {
        while (queue.size() == capacity) {
            wait(); // Release lock and wait
        }
        queue.add(value);
        System.out.println("Produced: " + value);
        notifyAll(); // Wake up all waiting threads
    }
    
    public synchronized int consume() throws InterruptedException {
        while (queue.isEmpty()) {
            wait();
        }
        int value = queue.poll();
        System.out.println("Consumed: " + value);
        notifyAll();
        return value;
    }
}
```

### 4. Volatile vs Synchronized

```java
/**
 * volatile:
 * - Visibility guarantee only
 * - No atomicity (read-modify-write not atomic)
 * - Lighter than synchronized
 * - Use for flags, status indicators
 */
private volatile boolean running = true;

/**
 * synchronized:
 * - Visibility + Atomicity
 * - Mutual exclusion
 * - Heavier (lock acquisition)
 * - Use for compound operations
 */
```

### 5. Deadlock Prevention

```java
// Deadlock occurs when:
// 1. Mutual Exclusion
// 2. Hold and Wait
// 3. No Preemption
// 4. Circular Wait

// Prevention: Always acquire locks in the same order
public class DeadlockDemo {
    private final Object lock1 = new Object();
    private final Object lock2 = new Object();
    
    // Both methods acquire locks in same order
    public void method1() {
        synchronized (lock1) {
            synchronized (lock2) {
                // Critical section
            }
        }
    }
    
    public void method2() {
        synchronized (lock1) { // Same order as method1
            synchronized (lock2) {
                // Critical section
            }
        }
    }
}
```

---

## 💾 Java Memory Model

### 1. Memory Areas

```
┌─────────────────────────────────────────────────┐
│                     JVM Memory                   │
├─────────────────────────────────────────────────┤
│  Method Area (Metaspace in Java 8+)             │
│  - Class metadata, static variables             │
│  - Shared across all threads                    │
├─────────────────────────────────────────────────┤
│  Heap                                           │
│  - Objects, instance variables                  │
│  - Shared across all threads                    │
│  ┌──────────────┬──────────────────────────┐   │
│  │ Young Gen    │      Old Generation      │   │
│  │ Eden│S0│S1   │                          │   │
│  └──────────────┴──────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  Stack (per thread)                             │
│  - Method frames, local variables               │
│  - Primitive values, object references          │
├─────────────────────────────────────────────────┤
│  PC Register (per thread)                       │
│  Native Method Stack (per thread)               │
└─────────────────────────────────────────────────┘
```

### 2. Garbage Collection

```java
/**
 * GC Types:
 * 
 * 1. Serial GC (-XX:+UseSerialGC)
 *    - Single threaded
 *    - Suitable for small applications
 * 
 * 2. Parallel GC (-XX:+UseParallelGC)
 *    - Multiple threads for minor GC
 *    - Good for throughput
 * 
 * 3. CMS (Concurrent Mark Sweep) - Deprecated
 *    - Low pause times
 *    - Concurrent with application
 * 
 * 4. G1 GC (-XX:+UseG1GC) - Default since Java 9
 *    - Region-based
 *    - Predictable pause times
 *    - Good for large heaps
 * 
 * 5. ZGC (-XX:+UseZGC) - Java 11+
 *    - Sub-millisecond pauses
 *    - Scalable to TB heaps
 */
```

### 3. Memory Leak in Java

```java
// Common causes:
// 1. Unclosed resources
try (Connection conn = DriverManager.getConnection(url)) {
    // Use connection
} // Automatically closed

// 2. Static collections holding references
public class Cache {
    private static final Map<String, Object> cache = new HashMap<>();
    
    public void add(String key, Object value) {
        cache.put(key, value); // Never removed = leak
    }
}

// 3. Listeners not removed
button.addActionListener(listener);
// Must call: button.removeActionListener(listener);

// 4. Inner class holding outer class reference
public class Outer {
    private byte[] data = new byte[10_000_000];
    
    public class Inner { // Holds reference to Outer
        public void doSomething() { }
    }
}
```

---

## ⚠️ Exception Handling

### 1. Exception Hierarchy

```
             Throwable
            /         \
       Error          Exception
         |           /         \
  OutOfMemoryError  RuntimeException  IOException
  StackOverflow     NullPointer       FileNotFound
                    ArrayIndexOutOf   SQLException
                    ClassCast
                    IllegalArgument
```

### 2. Checked vs Unchecked Exceptions

```java
// Checked - Must be handled or declared
public void readFile() throws IOException { // Declared
    FileReader file = new FileReader("test.txt");
}

public void readFileSafe() {
    try {
        FileReader file = new FileReader("test.txt");
    } catch (FileNotFoundException e) { // Handled
        e.printStackTrace();
    }
}

// Unchecked (RuntimeException) - No requirement to handle
public void divide(int a, int b) {
    int result = a / b; // May throw ArithmeticException
}
```

### 3. try-with-resources (Java 7+)

```java
// Old way
BufferedReader br = null;
try {
    br = new BufferedReader(new FileReader("file.txt"));
    // Use br
} finally {
    if (br != null) {
        br.close();
    }
}

// Modern way - Automatic resource management
try (BufferedReader br = new BufferedReader(new FileReader("file.txt"))) {
    // Use br
} // Automatically closed
```

### 4. Custom Exception

```java
public class InsufficientBalanceException extends Exception {
    private double balance;
    private double amount;
    
    public InsufficientBalanceException(String message, double balance, double amount) {
        super(message);
        this.balance = balance;
        this.amount = amount;
    }
    
    public double getBalance() { return balance; }
    public double getAmount() { return amount; }
}

// Usage
public void withdraw(double amount) throws InsufficientBalanceException {
    if (amount > balance) {
        throw new InsufficientBalanceException(
            "Insufficient funds", balance, amount
        );
    }
    balance -= amount;
}
```

---

## ✨ Java 8+ Features

### 1. Lambda Expressions

```java
// Before Java 8
Comparator<String> comparator = new Comparator<String>() {
    @Override
    public int compare(String s1, String s2) {
        return s1.compareTo(s2);
    }
};

// Java 8+
Comparator<String> comparator = (s1, s2) -> s1.compareTo(s2);

// Method reference
Comparator<String> comparator = String::compareTo;
```

### 2. Streams API

```java
List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

// Filter, map, collect
List<Integer> evenSquares = numbers.stream()
    .filter(n -> n % 2 == 0)     // Keep even numbers
    .map(n -> n * n)              // Square them
    .collect(Collectors.toList()); // [4, 16, 36, 64, 100]

// Reduce
int sum = numbers.stream()
    .reduce(0, Integer::sum); // 55

// GroupBy
Map<Boolean, List<Integer>> partitioned = numbers.stream()
    .collect(Collectors.partitioningBy(n -> n % 2 == 0));
// {false=[1, 3, 5, 7, 9], true=[2, 4, 6, 8, 10]}

// FlatMap
List<List<Integer>> nested = Arrays.asList(
    Arrays.asList(1, 2),
    Arrays.asList(3, 4)
);
List<Integer> flat = nested.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList()); // [1, 2, 3, 4]
```

### 3. Optional

```java
// Avoid NullPointerException
public Optional<User> findUserById(int id) {
    User user = userRepository.findById(id);
    return Optional.ofNullable(user);
}

// Usage
Optional<User> userOpt = findUserById(1);

// Check and get
if (userOpt.isPresent()) {
    User user = userOpt.get();
}

// orElse
User user = userOpt.orElse(new User("Default"));

// orElseThrow
User user = userOpt.orElseThrow(() -> new UserNotFoundException("User not found"));

// map and flatMap
String email = userOpt
    .map(User::getEmail)
    .orElse("no-email@example.com");
```

### 4. CompletableFuture

```java
// Async execution
CompletableFuture<String> future = CompletableFuture
    .supplyAsync(() -> fetchDataFromAPI())
    .thenApply(data -> processData(data))
    .thenApply(result -> formatOutput(result))
    .exceptionally(ex -> "Error: " + ex.getMessage());

String result = future.join(); // Block and get result

// Combine multiple futures
CompletableFuture<String> future1 = CompletableFuture.supplyAsync(() -> "Hello");
CompletableFuture<String> future2 = CompletableFuture.supplyAsync(() -> "World");

CompletableFuture<String> combined = future1
    .thenCombine(future2, (s1, s2) -> s1 + " " + s2); // "Hello World"
```

---

## 🏗️ Design Patterns

### 1. Singleton Pattern

```java
// Thread-safe Singleton using double-checked locking
public class Singleton {
    private static volatile Singleton instance;
    
    private Singleton() { }
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// Better: Enum Singleton
public enum DatabaseConnection {
    INSTANCE;
    
    private Connection connection;
    
    DatabaseConnection() {
        // Initialize connection
    }
    
    public Connection getConnection() {
        return connection;
    }
}
```

### 2. Factory Pattern

```java
public interface Vehicle {
    void drive();
}

public class Car implements Vehicle {
    @Override public void drive() { System.out.println("Driving car"); }
}

public class Bike implements Vehicle {
    @Override public void drive() { System.out.println("Riding bike"); }
}

public class VehicleFactory {
    public static Vehicle createVehicle(String type) {
        return switch (type.toLowerCase()) {
            case "car" -> new Car();
            case "bike" -> new Bike();
            default -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}
```

### 3. Builder Pattern

```java
public class User {
    private final String firstName;
    private final String lastName;
    private final int age;
    private final String email;
    
    private User(Builder builder) {
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;
        this.age = builder.age;
        this.email = builder.email;
    }
    
    public static class Builder {
        private String firstName;
        private String lastName;
        private int age;
        private String email;
        
        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }
        
        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }
        
        public Builder age(int age) {
            this.age = age;
            return this;
        }
        
        public Builder email(String email) {
            this.email = email;
            return this;
        }
        
        public User build() {
            return new User(this);
        }
    }
}

// Usage
User user = new User.Builder()
    .firstName("John")
    .lastName("Doe")
    .age(30)
    .email("john@example.com")
    .build();
```

---

## 💻 Common Coding Questions

### 1. Make a Class Immutable

```java
public final class ImmutableEmployee {
    private final String name;
    private final int id;
    private final List<String> skills;
    private final Date joiningDate;
    
    public ImmutableEmployee(String name, int id, List<String> skills, Date joiningDate) {
        this.name = name;
        this.id = id;
        this.skills = new ArrayList<>(skills); // Defensive copy
        this.joiningDate = new Date(joiningDate.getTime()); // Defensive copy
    }
    
    public String getName() { return name; }
    public int getId() { return id; }
    
    public List<String> getSkills() {
        return new ArrayList<>(skills); // Return copy
    }
    
    public Date getJoiningDate() {
        return new Date(joiningDate.getTime()); // Return copy
    }
}
```

### 2. Find Duplicates in Array

```java
public List<Integer> findDuplicates(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    List<Integer> duplicates = new ArrayList<>();
    
    for (int num : nums) {
        if (!seen.add(num)) {
            duplicates.add(num);
        }
    }
    
    return duplicates;
}
```

### 3. Check if String is Palindrome

```java
public boolean isPalindrome(String s) {
    String cleaned = s.toLowerCase().replaceAll("[^a-z0-9]", "");
    int left = 0, right = cleaned.length() - 1;
    
    while (left < right) {
        if (cleaned.charAt(left) != cleaned.charAt(right)) {
            return false;
        }
        left++;
        right--;
    }
    
    return true;
}
```

### 4. Remove Duplicates from List

```java
// Using Set
public List<Integer> removeDuplicates(List<Integer> list) {
    return new ArrayList<>(new LinkedHashSet<>(list)); // Preserves order
}

// Using Streams
public List<Integer> removeDuplicatesStream(List<Integer> list) {
    return list.stream()
        .distinct()
        .collect(Collectors.toList());
}
```

---

## ✅ Quick Review Checklist

- [ ] OOP: 4 pillars, Abstract vs Interface, Overloading vs Overriding
- [ ] Collections: HashMap internals, HashMap vs ConcurrentHashMap
- [ ] Threads: Creating threads, synchronized, wait/notify, volatile
- [ ] Memory: Heap vs Stack, GC types, memory leaks
- [ ] Exceptions: Checked vs Unchecked, try-with-resources
- [ ] Java 8: Lambdas, Streams, Optional, CompletableFuture
- [ ] Patterns: Singleton, Factory, Builder

---

**Best of luck with your Barclays interview! 🍀**
