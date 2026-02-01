[🏠 Home](../README.md) | [⬅️ Java 9-11](./java9-11-features.md) | [➡️ Java 18-21](./java18-21-features.md)

# Java 12-17 Features (Modern Java)

---

## Java 12-14: Switch Expressions

### Why Was It Needed?
Traditional switch was verbose and error-prone:

```java
// Old switch - verbose, fall-through bugs
String day = "MONDAY";
int numLetters;
switch (day) {
    case "MONDAY":
    case "FRIDAY":
    case "SUNDAY":
        numLetters = 6;
        break;   // Easy to forget!
    case "TUESDAY":
        numLetters = 7;
        break;
    default:
        numLetters = 0;
}
```

### The Solution - Switch Expressions (Java 14 Standard)

```java
// Arrow syntax - no fall-through, no break needed
int numLetters = switch (day) {
    case "MONDAY", "FRIDAY", "SUNDAY" -> 6;
    case "TUESDAY" -> 7;
    case "THURSDAY", "SATURDAY" -> 8;
    case "WEDNESDAY" -> 9;
    default -> 0;
};

// yield for multi-line blocks
String result = switch (status) {
    case "PENDING" -> "Waiting...";
    case "APPROVED" -> {
        logApproval();
        notifyUser();
        yield "Request approved!";
    }
    case "REJECTED" -> {
        logRejection();
        yield "Request rejected.";
    }
    default -> "Unknown status";
};

// Pattern matching in switch (Java 17 preview, Java 21 standard)
Object obj = "Hello";
String result = switch (obj) {
    case Integer i -> "Integer: " + i;
    case String s -> "String: " + s;
    case null -> "Null value";
    default -> "Unknown type";
};
```

---

## Java 13-15: Text Blocks

### Why Was It Needed?

```java
// Before - Painful string concatenation for HTML/JSON/SQL
String html = "<html>\n" +
              "    <body>\n" +
              "        <h1>Hello</h1>\n" +
              "    </body>\n" +
              "</html>";

String json = "{\n" +
              "  \"name\": \"John\",\n" +
              "  \"age\": 30\n" +
              "}";
```

### The Solution - Text Blocks (Java 15 Standard)

```java
// Text blocks with triple quotes
String html = """
    <html>
        <body>
            <h1>Hello</h1>
        </body>
    </html>
    """;

String json = """
    {
        "name": "John",
        "age": 30,
        "city": "New York"
    }
    """;

String sql = """
    SELECT e.name, e.salary, d.name
    FROM employees e
    JOIN departments d ON e.dept_id = d.id
    WHERE e.salary > 50000
    ORDER BY e.salary DESC
    """;

// With formatted placeholders
String query = """
    SELECT * FROM users
    WHERE name = '%s'
    AND age > %d
    """.formatted(name, age);

// Escape sequences
String withNewline = """
    Line 1\nLine 2
    """;

// Trailing backslash prevents line break
String singleLine = """
    This is a very long line that \
    continues here
    """;
```

---

## Java 14-16: Records

### Why Was It Needed?
Too much boilerplate for simple data carriers:

```java
// Before - Lots of boilerplate!
public class Person {
    private final String name;
    private final int age;
    
    public Person(String name, int age) {
        this.name = name;
        this.age = age;
    }
    
    public String getName() { return name; }
    public int getAge() { return age; }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(name, age);
    }
    
    @Override
    public String toString() {
        return "Person[name=" + name + ", age=" + age + "]";
    }
}
```

### The Solution - Records (Java 16 Standard)

```java
// One line! Auto-generates: constructor, getters, equals, hashCode, toString
public record Person(String name, int age) { }

// Usage
Person person = new Person("Alice", 30);
String name = person.name();  // Note: no 'get' prefix
int age = person.age();

System.out.println(person);  // Person[name=Alice, age=30]
Person copy = new Person("Alice", 30);
person.equals(copy);  // true

// Custom constructor with validation
public record Person(String name, int age) {
    // Compact constructor
    public Person {
        if (age < 0) {
            throw new IllegalArgumentException("Age cannot be negative");
        }
        name = name.trim();  // Can modify parameters
    }
}

// Additional methods
public record Rectangle(double width, double height) {
    public double area() {
        return width * height;
    }
    
    public double perimeter() {
        return 2 * (width + height);
    }
}

// Static members allowed
public record Config(String host, int port) {
    public static final Config DEFAULT = new Config("localhost", 8080);
    
    public static Config fromString(String str) {
        // Factory method
    }
}

// Record implementing interface
public record Point(int x, int y) implements Comparable<Point> {
    @Override
    public int compareTo(Point other) {
        return Integer.compare(x, other.x);
    }
}
```

### Record Limitations
- Cannot extend other classes (implicitly extend Record)
- All fields are final (immutable)
- Cannot declare instance fields
- Can implement interfaces

---

## Java 14-16: Pattern Matching for instanceof

### Before - Verbose casting

```java
if (obj instanceof String) {
    String s = (String) obj;  // Redundant cast
    System.out.println(s.length());
}
```

### After - Pattern Variable (Java 16 Standard)

```java
// Pattern variable 's' automatically typed and scoped
if (obj instanceof String s) {
    System.out.println(s.length());  // s is already a String
}

// Works with && (but not ||)
if (obj instanceof String s && s.length() > 5) {
    System.out.println(s.toUpperCase());
}

// Negation pattern
if (!(obj instanceof String s)) {
    return;  // Early exit
}
// s is in scope here!
System.out.println(s.length());

// Practical example
public boolean equals(Object o) {
    return o instanceof Point p 
        && this.x == p.x 
        && this.y == p.y;
}
```

---

## Java 15-17: Sealed Classes

### Why Was It Needed?
Control which classes can extend/implement your class/interface:

```java
// Before - Anyone can extend
public abstract class Shape { }

// Can't prevent unwanted subclasses!
class MaliciousShape extends Shape { /* evil code */ }
```

### The Solution - Sealed Classes (Java 17 Standard)

```java
// Only Circle, Rectangle, and Triangle can extend Shape
public sealed class Shape 
    permits Circle, Rectangle, Triangle {
    // ...
}

// Subclass must be: final, sealed, or non-sealed
public final class Circle extends Shape {
    private final double radius;
    // Cannot be extended further
}

public sealed class Rectangle extends Shape 
    permits Square {
    // Can only be extended by Square
}

public final class Square extends Rectangle {
    // Final - no more extensions
}

public non-sealed class Triangle extends Shape {
    // Open for extension by anyone
}
```

### Sealed Interfaces

```java
public sealed interface Vehicle 
    permits Car, Truck, Motorcycle {
    void drive();
}

public final class Car implements Vehicle {
    @Override
    public void drive() { }
}

public record Motorcycle(String model) implements Vehicle {
    @Override
    public void drive() { }
}
```

### Benefits of Sealed Classes
1. **Exhaustive pattern matching** - Compiler knows all subtypes
2. **Domain modeling** - Express closed hierarchies
3. **API stability** - Prevent unexpected implementations
4. **Better optimization** - JVM can make assumptions

---

## Interview Questions

### Q1: What's the difference between Record and Class?

| Record | Class |
|--------|-------|
| Immutable by design | Mutable by default |
| Auto-generated methods | Manual implementation |
| Cannot extend classes | Can extend one class |
| Has components (fields) | Has any fields |
| Compact syntax | Verbose syntax |

### Q2: When should you use sealed classes?

Use sealed classes when:
- You want to define a **closed set of types** (e.g., `Shape` can only be Circle, Rectangle, Triangle)
- You need **exhaustive pattern matching**
- You're **modeling algebraic data types**
- You want **API stability** - prevent unauthorized extensions

### Q3: Explain text block indentation rules
```java
String text = """
    Hello
    World
    """;  // Closing delimiter position determines indentation
```
- Compiler removes **incidental whitespace** (common leading spaces)
- Position of closing `"""` determines the margin
- Move `"""` left to include more leading spaces

### Q4: What methods does a Record generate automatically?
1. **Constructor** with all components
2. **Accessor methods** (same name as components, no `get` prefix)
3. **equals()** - compares all components
4. **hashCode()** - based on all components
5. **toString()** - includes class name and all components

### Q5: Can Records have mutable fields?
Records themselves are shallowly immutable. If a component is a mutable object (like List), the object inside can be modified:

```java
record Container(List<String> items) { }

var c = new Container(new ArrayList<>());
c.items().add("item");  // Modifies the list inside!

// Best practice - use defensive copies
record SafeContainer(List<String> items) {
    public SafeContainer {
        items = List.copyOf(items);  // Immutable copy
    }
}
```

### Q6: Switch expression vs switch statement?

| Switch Expression | Switch Statement |
|-------------------|------------------|
| Returns a value | No return value |
| Exhaustive (all cases covered) | Not required |
| Arrow syntax (no fall-through) | Colon syntax (fall-through) |
| `yield` for blocks | `break` to exit |
| Can assign to variable | Cannot assign |
