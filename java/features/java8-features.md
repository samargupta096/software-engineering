[🏠 Home](../README.md) | [⬅️ Java Index](./java-modern-features-guide.md) | [➡️ Java 9-11](./java9-11-features.md)

# Java 8 Features - The Game Changer Release (2014)

Java 8 was the most significant release in Java's history, introducing functional programming paradigms.

---

## 1. Lambda Expressions

### Why Was It Needed?
Before Java 8, implementing functional interfaces required verbose anonymous inner classes:

```java
// BEFORE Java 8 - Verbose!
Runnable runnable = new Runnable() {
    @Override
    public void run() {
        System.out.println("Running in a thread");
    }
};

// Sorting with Comparator - Painful!
Collections.sort(names, new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return a.compareTo(b);
    }
});
```

### The Solution - Lambda Expressions

```java
// AFTER Java 8 - Clean and concise!
Runnable runnable = () -> System.out.println("Running in a thread");

// Sorting with Lambda
Collections.sort(names, (a, b) -> a.compareTo(b));
// Or even simpler with method reference
Collections.sort(names, String::compareTo);
```

### Lambda Syntax Explained

```java
// Full syntax
(Type param1, Type param2) -> { statements; return value; }

// Simplified forms
(a, b) -> a + b                    // Type inference, single expression
x -> x * 2                         // Single parameter, no parentheses
() -> System.out.println("Hi")     // No parameters
```

### Detailed Examples

```java
// Example 1: Functional Interface with Lambda
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}

public class LambdaExamples {
    public static void main(String[] args) {
        // Different operations using same interface
        Calculator addition = (a, b) -> a + b;
        Calculator subtraction = (a, b) -> a - b;
        Calculator multiplication = (a, b) -> a * b;
        
        System.out.println("10 + 5 = " + addition.calculate(10, 5));       // 15
        System.out.println("10 - 5 = " + subtraction.calculate(10, 5));    // 5
        System.out.println("10 * 5 = " + multiplication.calculate(10, 5)); // 50
    }
}

// Example 2: Using Lambda with Collections
List<String> names = Arrays.asList("Alice", "Bob", "Charlie", "David");

// ForEach with Lambda
names.forEach(name -> System.out.println("Hello, " + name));

// Filter and print names starting with 'A'
names.stream()
     .filter(name -> name.startsWith("A"))
     .forEach(System.out::println);

// Example 3: Lambda with multiple statements
Calculator complexOp = (a, b) -> {
    int result = a + b;
    result = result * 2;
    System.out.println("Intermediate result: " + result);
    return result;
};
```

### Capturing Variables (Closures)

```java
// Lambdas can capture effectively final variables
int multiplier = 5;  // Effectively final

List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5);
numbers.forEach(n -> System.out.println(n * multiplier));

// This would cause compile error:
// multiplier = 10;  // Cannot modify - must be effectively final
```

### Advantages
1. **Concise Code** - Less boilerplate
2. **Readability** - Cleaner, more expressive
3. **Functional Programming** - Enables functional style
4. **Parallel Processing** - Works well with streams
5. **Lazy Evaluation** - Combined with streams

---

## 2. Functional Interfaces

### Built-in Functional Interfaces in java.util.function

```java
import java.util.function.*;

public class FunctionalInterfaceExamples {
    public static void main(String[] args) {
        
        // 1. Predicate<T> - Takes T, returns boolean
        Predicate<String> isEmpty = String::isEmpty;
        Predicate<Integer> isEven = n -> n % 2 == 0;
        Predicate<Integer> isPositive = n -> n > 0;
        
        System.out.println(isEmpty.test(""));        // true
        System.out.println(isEven.test(4));          // true
        
        // Combining predicates
        Predicate<Integer> isEvenAndPositive = isEven.and(isPositive);
        System.out.println(isEvenAndPositive.test(4));   // true
        System.out.println(isEvenAndPositive.test(-4));  // false
        
        // 2. Function<T, R> - Takes T, returns R
        Function<String, Integer> stringLength = String::length;
        Function<Integer, Integer> square = n -> n * n;
        
        System.out.println(stringLength.apply("Hello"));  // 5
        System.out.println(square.apply(5));              // 25
        
        // Chaining functions
        Function<String, Integer> lengthSquared = stringLength.andThen(square);
        System.out.println(lengthSquared.apply("Hi"));    // 4 (2*2)
        
        // 3. Consumer<T> - Takes T, returns void
        Consumer<String> printer = System.out::println;
        Consumer<String> loudPrinter = s -> System.out.println(s.toUpperCase());
        
        printer.accept("Hello");       // Hello
        loudPrinter.accept("Hello");   // HELLO
        
        // Chaining consumers
        printer.andThen(loudPrinter).accept("test");  // test \n TEST
        
        // 4. Supplier<T> - Takes nothing, returns T
        Supplier<Double> randomSupplier = Math::random;
        Supplier<LocalDateTime> nowSupplier = LocalDateTime::now;
        
        System.out.println(randomSupplier.get());
        System.out.println(nowSupplier.get());
        
        // 5. BiFunction<T, U, R> - Takes T and U, returns R
        BiFunction<Integer, Integer, Integer> add = (a, b) -> a + b;
        BiFunction<String, String, String> concat = String::concat;
        
        System.out.println(add.apply(10, 20));           // 30
        System.out.println(concat.apply("Hello", " World")); // Hello World
        
        // 6. UnaryOperator<T> - Special Function<T, T>
        UnaryOperator<Integer> increment = n -> n + 1;
        UnaryOperator<String> toUpper = String::toUpperCase;
        
        System.out.println(increment.apply(5));    // 6
        System.out.println(toUpper.apply("hello")); // HELLO
        
        // 7. BinaryOperator<T> - Special BiFunction<T, T, T>
        BinaryOperator<Integer> multiply = (a, b) -> a * b;
        BinaryOperator<String> join = (a, b) -> a + "-" + b;
        
        System.out.println(multiply.apply(3, 4));        // 12
        System.out.println(join.apply("Hello", "World")); // Hello-World
    }
}
```

---

## 3. Stream API

### Why Was It Needed?
Processing collections required loops with lots of boilerplate:

```java
// BEFORE Java 8
List<String> filtered = new ArrayList<>();
for (String name : names) {
    if (name.startsWith("A")) {
        filtered.add(name.toUpperCase());
    }
}
Collections.sort(filtered);
```

### The Solution - Stream API

```java
// AFTER Java 8 - Declarative style
List<String> filtered = names.stream()
    .filter(name -> name.startsWith("A"))
    .map(String::toUpperCase)
    .sorted()
    .collect(Collectors.toList());
```

### Stream Operations Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STREAM PIPELINE                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Source          Intermediate Operations           Terminal Operation      │
│  ┌─────┐         (Lazy - not executed)             (Triggers execution)    │
│  │List │                                                                    │
│  │Set  │──▶ filter() ──▶ map() ──▶ sorted() ──▶ collect()/forEach()/       │
│  │Array│                                          reduce()/count()          │
│  └─────┘                                                                    │
│                                                                             │
│  Intermediate Operations:                 Terminal Operations:              │
│  • filter(Predicate)                     • collect(Collector)               │
│  • map(Function)                         • forEach(Consumer)                │
│  • flatMap(Function)                     • reduce(BinaryOperator)           │
│  • sorted()                              • count()                          │
│  • distinct()                            • findFirst() / findAny()          │
│  • limit(n) / skip(n)                    • anyMatch() / allMatch()          │
│  • peek(Consumer)                        • min() / max()                    │
│                                          • toArray()                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Comprehensive Stream Examples

```java
public class StreamExamples {
    public static void main(String[] args) {
        
        List<Employee> employees = Arrays.asList(
            new Employee("Alice", 30, 75000, "IT"),
            new Employee("Bob", 25, 55000, "HR"),
            new Employee("Charlie", 35, 95000, "IT"),
            new Employee("Diana", 28, 65000, "Finance"),
            new Employee("Eve", 40, 120000, "IT")
        );
        
        // Example 1: Filter and Collect
        List<Employee> itEmployees = employees.stream()
            .filter(e -> e.getDepartment().equals("IT"))
            .collect(Collectors.toList());
        
        // Example 2: Map - Transform elements
        List<String> names = employees.stream()
            .map(Employee::getName)
            .collect(Collectors.toList());
        // [Alice, Bob, Charlie, Diana, Eve]
        
        // Example 3: Sorting
        List<Employee> sortedBySalary = employees.stream()
            .sorted(Comparator.comparing(Employee::getSalary).reversed())
            .collect(Collectors.toList());
        
        // Example 4: Reduce - Aggregate to single value
        double totalSalary = employees.stream()
            .mapToDouble(Employee::getSalary)
            .sum();
        // Or using reduce
        double total = employees.stream()
            .map(Employee::getSalary)
            .reduce(0.0, Double::sum);
        
        // Example 5: Grouping
        Map<String, List<Employee>> byDepartment = employees.stream()
            .collect(Collectors.groupingBy(Employee::getDepartment));
        
        // Example 6: Statistics
        DoubleSummaryStatistics salaryStats = employees.stream()
            .mapToDouble(Employee::getSalary)
            .summaryStatistics();
        System.out.println("Average: " + salaryStats.getAverage());
        System.out.println("Max: " + salaryStats.getMax());
        System.out.println("Min: " + salaryStats.getMin());
        System.out.println("Count: " + salaryStats.getCount());
        
        // Example 7: FlatMap - Flatten nested structures
        List<List<Integer>> nestedList = Arrays.asList(
            Arrays.asList(1, 2, 3),
            Arrays.asList(4, 5, 6),
            Arrays.asList(7, 8, 9)
        );
        List<Integer> flatList = nestedList.stream()
            .flatMap(List::stream)
            .collect(Collectors.toList());
        // [1, 2, 3, 4, 5, 6, 7, 8, 9]
        
        // Example 8: Partitioning
        Map<Boolean, List<Employee>> partitioned = employees.stream()
            .collect(Collectors.partitioningBy(e -> e.getSalary() > 70000));
        // {false=[Bob, Diana], true=[Alice, Charlie, Eve]}
        
        // Example 9: Parallel Stream for large datasets
        long count = employees.parallelStream()
            .filter(e -> e.getSalary() > 50000)
            .count();
        
        // Example 10: Custom Collector
        String allNames = employees.stream()
            .map(Employee::getName)
            .collect(Collectors.joining(", ", "Employees: ", "."));
        // "Employees: Alice, Bob, Charlie, Diana, Eve."
    }
}
```

### Stream Creation Methods

```java
// From Collection
List<String> list = Arrays.asList("a", "b", "c");
Stream<String> stream1 = list.stream();

// From Array
String[] array = {"a", "b", "c"};
Stream<String> stream2 = Arrays.stream(array);

// Using Stream.of()
Stream<String> stream3 = Stream.of("a", "b", "c");

// Infinite Streams
Stream<Integer> infiniteStream = Stream.iterate(0, n -> n + 2); // 0, 2, 4, 6...
Stream<Double> randomStream = Stream.generate(Math::random);

// Limited infinite stream
List<Integer> first10Even = Stream.iterate(0, n -> n + 2)
    .limit(10)
    .collect(Collectors.toList());

// IntStream, LongStream, DoubleStream - Primitive streams
IntStream intStream = IntStream.range(1, 10);      // 1 to 9
IntStream intStreamClosed = IntStream.rangeClosed(1, 10); // 1 to 10
```

---

## 4. Optional Class

### Why Was It Needed?
NullPointerException was the most common error in Java:

```java
// BEFORE Java 8 - Null checks everywhere!
public String getUpperCaseName(Person person) {
    if (person != null) {
        String name = person.getName();
        if (name != null) {
            return name.toUpperCase();
        }
    }
    return "UNKNOWN";
}
```

### The Solution - Optional

```java
// AFTER Java 8 - Elegant null handling
public String getUpperCaseName(Person person) {
    return Optional.ofNullable(person)
        .map(Person::getName)
        .map(String::toUpperCase)
        .orElse("UNKNOWN");
}
```

### Comprehensive Optional Examples

```java
public class OptionalExamples {
    public static void main(String[] args) {
        
        // Creating Optional
        Optional<String> empty = Optional.empty();
        Optional<String> nonEmpty = Optional.of("Hello");
        Optional<String> nullable = Optional.ofNullable(null); // Safe for null
        
        // isPresent() and isEmpty() (isEmpty from Java 11)
        if (nonEmpty.isPresent()) {
            System.out.println(nonEmpty.get());
        }
        
        // ifPresent() - Execute if value exists
        nonEmpty.ifPresent(System.out::println);
        
        // ifPresentOrElse() - Java 9+
        nonEmpty.ifPresentOrElse(
            System.out::println,
            () -> System.out.println("No value!")
        );
        
        // orElse() - Default value
        String value1 = empty.orElse("Default");
        
        // orElseGet() - Lazy default (only computed if needed)
        String value2 = empty.orElseGet(() -> computeExpensiveDefault());
        
        // orElseThrow() - Throw exception if empty
        String value3 = nonEmpty.orElseThrow(() -> 
            new IllegalStateException("Value not found"));
        
        // map() - Transform value
        Optional<Integer> length = nonEmpty.map(String::length);
        
        // flatMap() - When mapper returns Optional
        Optional<String> result = getUser()
            .flatMap(User::getAddress)
            .map(Address::getCity);
        
        // filter() - Conditional optional
        Optional<String> filtered = nonEmpty.filter(s -> s.length() > 3);
        
        // Chaining example
        String cityName = getUser()
            .flatMap(User::getAddress)
            .flatMap(Address::getCity)
            .map(String::toUpperCase)
            .filter(city -> city.length() > 2)
            .orElse("UNKNOWN CITY");
    }
    
    // Pattern: Return Optional instead of null
    public static Optional<User> findUserById(int id) {
        User user = database.findById(id); // might return null
        return Optional.ofNullable(user);
    }
}
```

### Optional Anti-Patterns (What NOT to do)

```java
// ❌ DON'T use Optional as method parameter
public void processUser(Optional<User> user) { } // Bad!

// ✅ DO use null checks or overloaded methods
public void processUser(User user) { }
public void processUser() { } // overload for no user

// ❌ DON'T use Optional for fields
public class User {
    private Optional<String> middleName; // Bad!
}

// ✅ DO use nullable fields with getter returning Optional
public class User {
    private String middleName; // Can be null
    
    public Optional<String> getMiddleName() {
        return Optional.ofNullable(middleName);
    }
}

// ❌ DON'T call get() without checking
String value = optional.get(); // Bad! Might throw NoSuchElementException

// ✅ DO use orElse, orElseGet, or orElseThrow
String value = optional.orElse("default");
```

---

## 5. Default and Static Methods in Interfaces

### Why Was It Needed?
Adding new methods to interfaces broke all implementing classes:

```java
// Problem: Adding a new method to this interface...
public interface Vehicle {
    void start();
    void stop();
    // void honk(); // Adding this breaks all implementations!
}
```

### The Solution

```java
public interface Vehicle {
    void start();
    void stop();
    
    // Default method - implementations inherit this
    default void honk() {
        System.out.println("Beep beep!");
    }
    
    // Static method - utility methods in interface
    static Vehicle createDefault() {
        return new Car();
    }
}

// Implementing class can override or use default
public class Car implements Vehicle {
    @Override
    public void start() { System.out.println("Car starting"); }
    
    @Override
    public void stop() { System.out.println("Car stopping"); }
    
    // honk() is inherited from interface
}

public class Truck implements Vehicle {
    @Override
    public void start() { System.out.println("Truck starting"); }
    
    @Override
    public void stop() { System.out.println("Truck stopping"); }
    
    @Override
    public void honk() {
        System.out.println("HONK HONK!"); // Override default
    }
}
```

### Diamond Problem Resolution

```java
interface A {
    default void greet() { System.out.println("Hello from A"); }
}

interface B {
    default void greet() { System.out.println("Hello from B"); }
}

// Class implementing both must override
class C implements A, B {
    @Override
    public void greet() {
        A.super.greet(); // Choose which one or provide own implementation
    }
}
```

---

## 6. Method References

```java
// Four types of method references

// 1. Reference to static method
Function<String, Integer> parser = Integer::parseInt;
// Equivalent: s -> Integer.parseInt(s)

// 2. Reference to instance method of particular object
String prefix = "Mr. ";
Function<String, String> addPrefix = prefix::concat;
// Equivalent: s -> prefix.concat(s)

// 3. Reference to instance method of arbitrary object
Function<String, String> toUpper = String::toUpperCase;
// Equivalent: s -> s.toUpperCase()

// 4. Reference to constructor
Supplier<ArrayList<String>> listCreator = ArrayList::new;
Function<Integer, ArrayList<String>> sizedList = ArrayList::new;
// Equivalent: () -> new ArrayList<>() and size -> new ArrayList<>(size)

// Practical examples
List<String> names = Arrays.asList("Alice", "Bob", "Charlie");

// Method reference instead of lambda
names.forEach(System.out::println);
// Equivalent: names.forEach(name -> System.out.println(name));

names.stream()
    .map(String::length)
    .forEach(System.out::println);
```

---

## 7. New Date and Time API (java.time)

### Why Was It Needed?
Old Date/Calendar API had many problems:
- Mutable (thread-unsafe)
- Poor API design
- No timezone support
- Month indexing started from 0

### The Solution - java.time package

```java
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class DateTimeExamples {
    public static void main(String[] args) {
        
        // LocalDate - Date without time
        LocalDate today = LocalDate.now();
        LocalDate birthday = LocalDate.of(1990, Month.JANUARY, 15);
        LocalDate parsed = LocalDate.parse("2024-01-15");
        
        // LocalTime - Time without date
        LocalTime now = LocalTime.now();
        LocalTime meeting = LocalTime.of(14, 30, 0);
        LocalTime parsed2 = LocalTime.parse("14:30:00");
        
        // LocalDateTime - Date and time without timezone
        LocalDateTime dateTime = LocalDateTime.now();
        LocalDateTime specific = LocalDateTime.of(2024, 1, 15, 14, 30);
        
        // ZonedDateTime - Date, time, and timezone
        ZonedDateTime zonedNow = ZonedDateTime.now();
        ZonedDateTime inTokyo = ZonedDateTime.now(ZoneId.of("Asia/Tokyo"));
        
        // Instant - Machine timestamp (epoch seconds)
        Instant timestamp = Instant.now();
        long epochSecond = timestamp.getEpochSecond();
        
        // Duration - Time-based amount
        Duration twoHours = Duration.ofHours(2);
        Duration between = Duration.between(LocalTime.of(10, 0), LocalTime.of(14, 30));
        
        // Period - Date-based amount
        Period tenDays = Period.ofDays(10);
        Period threeMonths = Period.ofMonths(3);
        
        // Date arithmetic
        LocalDate tomorrow = today.plusDays(1);
        LocalDate nextMonth = today.plusMonths(1);
        LocalDate previousYear = today.minusYears(1);
        
        long daysBetween = ChronoUnit.DAYS.between(birthday, today);
        
        // Formatting
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        String formatted = dateTime.format(formatter);
        LocalDateTime parsedDt = LocalDateTime.parse("15/01/2024 14:30", formatter);
        
        // Comparison
        boolean isBefore = today.isBefore(tomorrow);
        boolean isAfter = today.isAfter(birthday);
        
        // Getting components
        int year = today.getYear();
        Month month = today.getMonth();
        int dayOfMonth = today.getDayOfMonth();
        DayOfWeek dayOfWeek = today.getDayOfWeek();
    }
}
```

---

## Interview Questions & Answers

### Q1: What is a Functional Interface?
**Answer**: A functional interface is an interface with exactly one abstract method. It can have multiple default or static methods. The `@FunctionalInterface` annotation is optional but recommended as it causes a compile-time error if the interface doesn't meet the criteria.

```java
@FunctionalInterface
interface MyFunction {
    int apply(int x);           // Single abstract method
    
    default void log() { }      // OK - default method
    static void helper() { }    // OK - static method
}
```

### Q2: Difference between map() and flatMap() in Stream?
**Answer**: 
- `map()` transforms each element to exactly one element (one-to-one mapping)
- `flatMap()` transforms each element to zero or more elements and flattens them (one-to-many mapping)

```java
// map: [1, 2, 3] → ["1", "2", "3"]
List<String> strings = numbers.stream()
    .map(String::valueOf)
    .collect(Collectors.toList());

// flatMap: [[1,2], [3,4]] → [1, 2, 3, 4]
List<Integer> flat = nestedList.stream()
    .flatMap(List::stream)
    .collect(Collectors.toList());
```

### Q3: Difference between findFirst() and findAny()?
**Answer**:
- `findFirst()` - Always returns the first element in encounter order
- `findAny()` - Returns any element, optimized for parallel streams

In sequential streams, both return the same result. In parallel streams, `findAny()` is faster as it doesn't need to maintain order.

### Q4: What is the difference between orElse() and orElseGet()?
**Answer**:
- `orElse(T value)` - Always evaluates the default value, even if Optional has value
- `orElseGet(Supplier<T>)` - Lazily evaluates; supplier called only if Optional is empty

```java
// orElse - getDefaultUser() ALWAYS called
User user = optionalUser.orElse(getDefaultUser());

// orElseGet - getDefaultUser() called ONLY if optional is empty
User user = optionalUser.orElseGet(() -> getDefaultUser());
```

### Q5: Why is Stream not reusable?
**Answer**: Streams are designed for single-use to support lazy evaluation and optimize memory. Once a terminal operation is called, the stream is consumed and cannot be reused. To process data multiple times, create a new stream from the source.

```java
Stream<String> stream = list.stream();
stream.forEach(System.out::println);
stream.count(); // IllegalStateException: stream has already been operated upon
```

### Q6: Explain Collectors.groupingBy() with downstream collector.
**Answer**:
```java
// Group employees by department and get count
Map<String, Long> countByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.counting()
    ));

// Group by department and get average salary
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)
    ));
```

### Q7: What is effectively final?
**Answer**: A variable is effectively final if its value is never changed after initialization. Lambda expressions can only access local variables that are final or effectively final. This is required because lambdas might be executed later when the local variable no longer exists.

```java
int multiplier = 10;  // Effectively final (never modified)
list.forEach(n -> System.out.println(n * multiplier));  // OK

int counter = 0;
// list.forEach(n -> counter++);  // Error! counter is not effectively final
```

### Q8: Difference between Intermediate and Terminal operations?
**Answer**:
| Intermediate | Terminal |
|-------------|----------|
| Return Stream | Return non-stream result |
| Lazy (not executed immediately) | Eager (triggers pipeline) |
| Can be chained | Cannot be chained |
| Examples: filter, map, sorted | Examples: collect, forEach, count |

---

## Best Practices Summary

1. **Prefer method references over lambdas** when they're clearer
2. **Use Optional for return types**, not parameters or fields
3. **Avoid side effects** in stream operations
4. **Use parallel streams carefully** - profile first
5. **Prefer Collection over Stream** for return types when reuse is needed
6. **Use the new Date/Time API** instead of Date/Calendar
7. **Keep lambdas short** - extract complex logic to methods
