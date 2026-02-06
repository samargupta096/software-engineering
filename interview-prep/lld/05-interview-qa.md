[🏠 Home](../README.md) | [⬅️ Common Designs](./04-common-designs/10-snake-ladder.md)

# 📝 LLD Interview Questions & Answers

> Comprehensive Q&A for low-level design interviews

---

## 🧱 OOP Fundamentals

### Q1: What is the difference between abstraction and encapsulation?

**Answer:**

| Aspect | Abstraction | Encapsulation |
|--------|-------------|---------------|
| Focus | Hides **complexity** | Hides **data** |
| How | Interfaces, abstract classes | Private fields, getters/setters |
| Purpose | Show "what" not "how" | Protect internal state |

**Example:**
```java
// Abstraction - you see what it does
public interface PaymentProcessor {
    void processPayment(double amount);
}

// Encapsulation - data is protected
public class BankAccount {
    private double balance; // Hidden
    public void deposit(double amount) { balance += amount; }
}
```

---

### Q2: When should you use composition over inheritance?

**Answer:**
- Use **composition** for "HAS-A" relationships (Car HAS-A Engine)
- Use **inheritance** for "IS-A" relationships (Dog IS-A Animal)

**Prefer composition because:**
1. More flexible (can change at runtime)
2. Avoids fragile base class problem
3. Better encapsulation
4. Easier to test

```java
// ❌ Inheritance (tightly coupled)
public class Car extends Engine { }

// ✅ Composition (loosely coupled)
public class Car {
    private Engine engine;  // Can swap engine types
}
```

---

### Q3: Explain method overloading vs overriding.

| Aspect | Overloading | Overriding |
|--------|------------|------------|
| When | Compile-time | Runtime |
| Where | Same class | Subclass |
| Signature | Different parameters | Same signature |
| Return type | Can differ | Must be same/covariant |

---

## 🏛️ SOLID Principles

### Q4: Give a real-world example of SRP violation and how to fix it.

**Violation:**
```java
public class UserService {
    public void registerUser(User user) { }
    public void sendWelcomeEmail(User user) { }  // Wrong!
    public void generatePDF(User user) { }       // Wrong!
}
```

**Fix:**
```java
public class UserService { void registerUser(User user) { } }
public class EmailService { void sendWelcomeEmail(User user) { } }
public class PDFGenerator { void generatePDF(User user) { } }
```

---

### Q5: How does the Factory pattern help with OCP?

**Answer:** Factory pattern lets you add new types without modifying existing code.

```java
// Without Factory - must modify this method for new types
public Vehicle create(String type) {
    if (type.equals("car")) return new Car();
    if (type.equals("bike")) return new Bike();
    // Adding truck requires modifying this code!
}

// With Factory - just add new factory
public interface VehicleFactory {
    Vehicle create();
}
public class TruckFactory implements VehicleFactory {
    public Vehicle create() { return new Truck(); }
}
```

---

### Q6: What is the Liskov Substitution Principle? Give a violation example.

**Definition:** Subtypes must be substitutable for their base types.

**Violation:**
```java
class Rectangle {
    void setWidth(int w) { width = w; }
    void setHeight(int h) { height = h; }
}

class Square extends Rectangle {
    void setWidth(int w) { width = w; height = w; } // Changes behavior!
}

// This breaks:
Rectangle r = new Square();
r.setWidth(5);
r.setHeight(10);
// Expected area: 50, Actual: 100 (both are 10)
```

---

## 🎨 Design Patterns

### Q7: Singleton vs Static Class?

| Aspect | Singleton | Static Class |
|--------|-----------|--------------|
| Instance | One object | No instance |
| Inheritance | Can extend | Cannot |
| Interface | Can implement | Cannot |
| State | Can have mutable state | Stateless preferred |
| Testing | Can mock | Hard to mock |

**Use Singleton for:** DB connections, Logger, Config
**Use Static for:** Utility methods (Math.max)

---

### Q8: When to use Strategy vs State pattern?

| Pattern | Use When |
|---------|----------|
| **Strategy** | Client explicitly chooses algorithm (payment method, sorting) |
| **State** | Behavior changes based on internal state (order status, vending machine) |

**Key difference:** 
- Strategy: Client controls which strategy to use
- State: State transitions happen internally

---

### Q9: Explain Observer pattern with a real example.

**Problem:** When one object changes, multiple dependents need to be notified.

**Example:** Stock price changes → notify all investors

```java
public interface Observer {
    void update(String stock, double price);
}

public class StockMarket {
    private List<Observer> observers = new ArrayList<>();
    
    public void setPrice(String stock, double price) {
        for (Observer obs : observers) {
            obs.update(stock, price);
        }
    }
}
```

---

### Q10: What is the difference between Factory Method and Abstract Factory?

| Pattern | Creates | Use Case |
|---------|---------|----------|
| **Factory Method** | Single product | Create one type of object |
| **Abstract Factory** | Family of products | Create related objects together |

**Abstract Factory Example:**
```java
interface UIFactory {
    Button createButton();
    Checkbox createCheckbox();
}

class WindowsUIFactory implements UIFactory { }
class MacUIFactory implements UIFactory { }
```

---

## 🔧 System Design Concepts

### Q11: How do you handle concurrent access in LLD?

**Techniques:**
1. **Synchronized blocks/methods**
2. **ConcurrentHashMap** instead of HashMap
3. **Atomic variables** (AtomicInteger)
4. **Locks** (ReentrantLock, ReadWriteLock)
5. **Immutable objects**

```java
// Seat booking with locking
public synchronized boolean bookSeat(Seat seat) {
    if (seat.isAvailable()) {
        seat.book();
        return true;
    }
    return false;
}
```

---

### Q12: How do you design for extensibility?

1. **Use interfaces** - Program to interface, not implementation
2. **Apply OCP** - Open for extension, closed for modification
3. **Dependency Injection** - Don't create dependencies inside class
4. **Strategy pattern** - For swappable algorithms
5. **Factory pattern** - For object creation

---

### Q13: How to handle seat locking in ticket booking?

**Approach:**
1. Lock seats with timestamp when user starts booking
2. Set timeout (e.g., 10 minutes)
3. Release if not confirmed within timeout
4. Use pessimistic locking in DB for production

```java
Map<String, SeatLock> locks;

public boolean lockSeat(String seatId, String sessionId) {
    releaseExpiredLocks();
    if (locks.containsKey(seatId)) return false;
    locks.put(seatId, new SeatLock(sessionId, LocalDateTime.now()));
    return true;
}
```

---

## 💡 Common Interview Tips

### Q14: How to approach an LLD problem?

1. **Clarify requirements** (5 min)
   - Functional requirements
   - Non-functional (scale, concurrency)
   
2. **Identify entities** (5 min)
   - List nouns → classes
   - Identify relationships
   
3. **Draw class diagram** (5 min)
   - Classes, attributes, methods
   - Relationships (has-a, is-a)
   
4. **Implement core classes** (25 min)
   - Start with most important
   - Apply patterns where needed
   
5. **Discuss trade-offs** (5 min)

---

### Q15: What questions should you ask before designing?

**Functional:**
- What are the core features?
- Who are the actors/users?
- What operations can each actor perform?

**Non-functional:**
- Is concurrency required?
- What scale are we designing for?
- Any real-time requirements?

**Constraints:**
- Any technology constraints?
- What's the expected response time?
- Should it be extensible for future features?

---

## 📊 Pattern Cheatsheet

| Scenario | Pattern |
|----------|---------|
| One instance only | Singleton |
| Create objects dynamically | Factory |
| Complex object construction | Builder |
| Add features dynamically | Decorator |
| Interchangeable algorithms | Strategy |
| State-dependent behavior | State |
| Notify multiple objects | Observer |
| Undo/Redo operations | Command |
| Simplify complex subsystem | Facade |
| Incompatible interfaces | Adapter |

---

## 🎯 LLD Problems by Category

### Object Creation
- Parking Lot → Factory for vehicles
- Vending Machine → Inventory creation

### State Management
- Elevator → State pattern for movement
- ATM → State for transaction flow
- Order System → State for order status

### Game Logic
- Chess → Strategy for piece movements
- Tic-Tac-Toe → Turn management
- Snake & Ladder → Random dice, board transitions

### Booking Systems
- Movie Tickets → Seat locking, Concurrency
- Hotel → Reservation, Inventory

---

*Happy Learning! 🚀*
