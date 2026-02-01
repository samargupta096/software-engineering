# 📋 Quick Revision Cheatsheet for Barclays

> **Purpose:** Last-minute revision before the interview

---

## 🧮 DSA Patterns (Top 10)

| Pattern | Key Technique | Example Problem |
|---------|--------------|-----------------|
| Two Pointers | Start/end or slow/fast | Container With Most Water |
| Sliding Window | Fixed or variable window | Longest Substring Without Repeating |
| Binary Search | O(log n) search | Search in Rotated Array |
| BFS | Level-order, shortest path | Binary Tree Level Order |
| DFS | Pre/In/Post order | Validate BST |
| Dynamic Programming | Memo or tabulation | Longest Increasing Subsequence |
| HashMap | O(1) lookup | Two Sum |
| Stack | Monotonic stack | Next Greater Element |
| Heap | Top K elements | Kth Largest Element |
| Backtracking | Try all combinations | Permutations |

---

## ☕ Java Quick Reference

### OOP Pillars
```
Encapsulation → Private fields + getters/setters
Inheritance   → extends, super(), method overriding
Polymorphism  → Compile-time (overloading), Runtime (overriding)
Abstraction   → abstract class, interface
```

### Abstract vs Interface
| Feature | Abstract Class | Interface |
|---------|---------------|-----------|
| Methods | Can have concrete | All abstract (pre-Java 8) |
| Variables | Any type | public static final only |
| Inheritance | Single | Multiple |
| Constructor | Yes | No |
| When to use | IS-A relationship | CAN-DO capability |

### HashMap Internals
```
Initial Capacity: 16
Load Factor: 0.75
Threshold = 16 * 0.75 = 12 (resize after 12 entries)
Collision: LinkedList → TreeMap (after 8 nodes)
hashCode() → index: (n-1) & hash
```

### Immutable Class Recipe
```java
public final class Employee {              // 1. final class
    private final String name;             // 2. final fields
    private final List<String> skills;
    
    public Employee(String name, List<String> skills) {
        this.name = name;
        this.skills = new ArrayList<>(skills);  // 3. Deep copy
    }
    
    public List<String> getSkills() {
        return new ArrayList<>(skills);    // 4. Return copy
    }
}
```

### Thread Creation
```java
// 1. Extending Thread
class MyThread extends Thread { public void run() {...} }

// 2. Implementing Runnable
class MyRunnable implements Runnable { public void run() {...} }

// 3. Lambda (Java 8+)
new Thread(() -> System.out.println("Running")).start();

// 4. ExecutorService
ExecutorService executor = Executors.newFixedThreadPool(5);
executor.submit(() -> doWork());
```

### synchronized vs volatile
| synchronized | volatile |
|--------------|----------|
| Locks object/method | No locking |
| Ensures visibility + atomicity | Visibility only |
| Can cause deadlock | Thread-safe reads/writes |
| Use for compound actions | Use for flags/status |

---

## 🍃 Spring Boot Essentials

### Core Annotations
```java
@SpringBootApplication  // Main class
@RestController         // REST endpoints
@Service               // Business logic
@Repository            // Data access
@Component             // Generic bean
@Autowired             // Dependency injection
@Value("${prop}")      // Property injection
```

### REST Mapping
```java
@GetMapping("/users")          // Read
@PostMapping("/users")         // Create
@PutMapping("/users/{id}")     // Update
@DeleteMapping("/users/{id}")  // Delete
@PatchMapping("/users/{id}")   // Partial update
```

### Exception Handling
```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Error> handleNotFound(Exception e) {
        return ResponseEntity.status(404).body(new Error(e.getMessage()));
    }
}
```

---

## 🏗️ Microservices Patterns

| Pattern | Purpose | Tool |
|---------|---------|------|
| Service Discovery | Find services dynamically | Eureka |
| API Gateway | Single entry point | Spring Cloud Gateway |
| Circuit Breaker | Handle failures gracefully | Resilience4j |
| Config Server | Centralized configuration | Spring Cloud Config |
| Distributed Tracing | Track requests across services | Zipkin, Sleuth |

### Circuit Breaker States
```
CLOSED → OPEN → HALF_OPEN → CLOSED
(normal)  (failing)  (testing)  (recovered)
```

---

## 💾 SQL Quick Reference

### JOIN Types
```sql
INNER JOIN  → Only matching rows
LEFT JOIN   → All left + matching right
RIGHT JOIN  → All right + matching left
FULL JOIN   → All from both tables
CROSS JOIN  → Cartesian product
SELF JOIN   → Table joined with itself
```

### Window Functions
```sql
ROW_NUMBER()  → 1, 2, 3, 4...
RANK()        → 1, 2, 2, 4... (gaps after ties)
DENSE_RANK()  → 1, 2, 2, 3... (no gaps)
LAG(col, 1)   → Previous row value
LEAD(col, 1)  → Next row value
```

### Common Interview Queries

**Second Highest Salary:**
```sql
SELECT MAX(salary) FROM employees 
WHERE salary < (SELECT MAX(salary) FROM employees);
-- OR
SELECT salary FROM employees ORDER BY salary DESC LIMIT 1 OFFSET 1;
```

**Nth Highest Salary:**
```sql
SELECT DISTINCT salary FROM employees 
ORDER BY salary DESC LIMIT 1 OFFSET n-1;
```

**Duplicate Records:**
```sql
SELECT email, COUNT(*) FROM users 
GROUP BY email HAVING COUNT(*) > 1;
```

---

## 🔗 System Design Quick Reference

### RESHADED Framework
```
R - Requirements (Functional + Non-functional)
E - Estimations (QPS, Storage, Bandwidth)
S - Storage Schema (Database design)
H - High-level Design (Main components)
A - API Design (REST endpoints)
D - Detailed Design (Deep dive)
E - Error Handling (Failure scenarios)
D - Diagnostics (Monitoring, Scaling)
```

### Key Numbers to Remember
```
1 day = 86,400 seconds ≈ 100K seconds
1 month = 2.5M seconds
1 year = 30M seconds

1 KB = 1,000 bytes
1 MB = 1,000 KB
1 GB = 1,000 MB
1 TB = 1,000 GB
```

### CAP Theorem
```
C - Consistency (all nodes see same data)
A - Availability (system always responds)
P - Partition Tolerance (survives network splits)

Pick 2: CP or AP (P is required in distributed systems)
```

---

## ⚡ Big O Cheatsheet

| Complexity | Name | Example |
|------------|------|---------|
| O(1) | Constant | Array access, HashMap get |
| O(log n) | Logarithmic | Binary Search |
| O(n) | Linear | Array traversal |
| O(n log n) | Linearithmic | Merge Sort, Quick Sort |
| O(n²) | Quadratic | Bubble Sort, 2 nested loops |
| O(2ⁿ) | Exponential | Recursive Fibonacci |

---

## 🔐 Security Basics

### Authentication vs Authorization
```
Authentication → WHO are you? (Login)
Authorization  → WHAT can you do? (Permissions)
```

### JWT Structure
```
Header.Payload.Signature
(base64).(base64).(encrypted)
```

---

## ✨ Final Tips

> **Before entering:**
> - Take deep breaths
> - Review this cheatsheet
> - Remember: It's a conversation, not an interrogation

> **During interview:**
> - Think out loud
> - Ask clarifying questions
> - It's okay to say "Let me think about this"

> **For coding:**
> - Start with brute force
> - Discuss time/space complexity
> - Test with edge cases

---

**You're prepared! Go get that offer! 🚀**
