[🏠 Home](../../README.md) | [⬅️ Java 8](./java8-features.md) | [➡️ Java 12-17](./java12-17-features.md)

# Java 9-11 Features

---

## Java 9 (2017)

### 1. Module System (Project Jigsaw)

#### Why Was It Needed?
- Classpath hell - no way to encapsulate internal APIs
- JAR conflicts and versioning issues
- JDK itself was monolithic (~200MB)

#### The Solution - JPMS (Java Platform Module System)

```java
// module-info.java at root of source
module com.myapp {
    requires java.sql;              // Depends on java.sql module
    requires transitive com.utils;  // Transitive dependency
    
    exports com.myapp.api;          // Public API
    exports com.myapp.internal to com.myapp.tests;  // Qualified export
    
    opens com.myapp.model to jackson.databind;  // Open for reflection
    
    provides com.myapp.spi.Service with com.myapp.impl.ServiceImpl;
    uses com.myapp.spi.Service;
}
```

```
┌─────────────────────────────────────────────────────────────────┐
│                    MODULE SYSTEM BENEFITS                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Strong Encapsulation  → Hide internal implementation        │
│  2. Reliable Configuration → Detect missing dependencies early  │
│  3. Smaller Runtime       → Include only needed modules         │
│  4. Security             → Reduce attack surface                │
└─────────────────────────────────────────────────────────────────┘
```

### 2. JShell - REPL

```bash
$ jshell
|  Welcome to JShell

jshell> int x = 10
x ==> 10

jshell> String greet(String name) {
   ...>     return "Hello, " + name;
   ...> }
|  created method greet(String)

jshell> greet("World")
$3 ==> "Hello, World"

jshell> /list     // Show all snippets
jshell> /vars     // Show variables
jshell> /methods  // Show methods
jshell> /exit     // Exit
```

### 3. Private Methods in Interfaces

```java
public interface DataProcessor {
    default void processData(String data) {
        validate(data);
        log("Processing: " + data);
    }
    
    default void processDataQuietly(String data) {
        validate(data);
        // No logging
    }
    
    // Private method - shared logic between default methods
    private void validate(String data) {
        if (data == null || data.isEmpty()) {
            throw new IllegalArgumentException("Invalid data");
        }
    }
    
    private static void log(String message) {
        System.out.println("[LOG] " + message);
    }
}
```

### 4. Try-With-Resources Enhancement

```java
// Java 7 - variable must be declared in try
try (BufferedReader reader = new BufferedReader(new FileReader(path))) {
    // use reader
}

// Java 9 - effectively final variable can be used
BufferedReader reader = new BufferedReader(new FileReader(path));
try (reader) {  // reader is effectively final
    // use reader
}
```

### 5. Collection Factory Methods

```java
// Java 9 - Immutable collections
List<String> list = List.of("a", "b", "c");
Set<Integer> set = Set.of(1, 2, 3);
Map<String, Integer> map = Map.of("one", 1, "two", 2);
Map<String, Integer> bigMap = Map.ofEntries(
    Map.entry("one", 1),
    Map.entry("two", 2),
    Map.entry("three", 3)
);

// These are immutable! Throws UnsupportedOperationException
// list.add("d");  // Error!
```

### 6. Stream API Improvements

```java
// takeWhile - take elements while predicate is true
Stream.of(1, 2, 3, 4, 5, 4, 3, 2, 1)
    .takeWhile(n -> n < 4)
    .forEach(System.out::println);  // 1, 2, 3

// dropWhile - drop elements while predicate is true
Stream.of(1, 2, 3, 4, 5, 4, 3, 2, 1)
    .dropWhile(n -> n < 4)
    .forEach(System.out::println);  // 4, 5, 4, 3, 2, 1

// ofNullable - create stream from nullable element
Stream<String> stream = Stream.ofNullable(null);  // Empty stream
Stream<String> stream2 = Stream.ofNullable("hello");  // Stream with one element

// iterate with predicate
Stream.iterate(1, n -> n < 100, n -> n * 2)
    .forEach(System.out::println);  // 1, 2, 4, 8, 16, 32, 64
```

### 7. Optional Improvements

```java
// ifPresentOrElse
Optional.of("value").ifPresentOrElse(
    System.out::println,
    () -> System.out.println("Empty!")
);

// or - lazy alternative Optional
Optional<String> result = optional1.or(() -> optional2);

// stream - convert Optional to Stream
List<String> list = optionals.stream()
    .flatMap(Optional::stream)
    .collect(Collectors.toList());
```

---

## Java 10 (2018)

### 1. Local Variable Type Inference (var)

#### Why Was It Needed?
Reduce verbosity without sacrificing type safety.

```java
// Before Java 10
Map<String, List<Employee>> departmentEmployees = new HashMap<String, List<Employee>>();
BufferedReader reader = new BufferedReader(new FileReader(path));

// After Java 10 - Type inferred by compiler
var departmentEmployees = new HashMap<String, List<Employee>>();
var reader = new BufferedReader(new FileReader(path));
```

#### Rules for var

```java
// ✅ Valid uses
var list = new ArrayList<String>();
var stream = list.stream();
var entry : map.entrySet()  // Enhanced for loop

// ❌ Invalid uses
var x;                      // No initializer
var x = null;               // Cannot infer type from null
var x = () -> {};           // Lambda needs target type
var x = {1, 2, 3};          // Array initializer needs explicit type
public var x = 10;          // Not for fields
public void method(var x)   // Not for parameters
```

### 2. Unmodifiable Collection Copies

```java
List<String> original = new ArrayList<>();
original.add("a");

// Create unmodifiable copy
List<String> copy = List.copyOf(original);

// Collectors for unmodifiable collections
List<String> unmodifiable = stream.collect(Collectors.toUnmodifiableList());
Set<String> unmodifiableSet = stream.collect(Collectors.toUnmodifiableSet());
Map<K, V> unmodifiableMap = stream.collect(
    Collectors.toUnmodifiableMap(keyMapper, valueMapper)
);
```

---

## Java 11 (2018) - LTS

### 1. New String Methods

```java
String str = "  Hello World  ";

// isBlank() - true if empty or only whitespace
"   ".isBlank();       // true
"".isBlank();          // true

// strip() - Unicode-aware trim
str.strip();           // "Hello World"
str.stripLeading();    // "Hello World  "
str.stripTrailing();   // "  Hello World"

// lines() - split by line terminators
"a\nb\nc".lines().forEach(System.out::println);

// repeat() - repeat string n times
"ab".repeat(3);        // "ababab"
```

### 2. HTTP Client (Standard)

```java
// Synchronous request
HttpClient client = HttpClient.newHttpClient();

HttpRequest request = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .GET()
    .build();

HttpResponse<String> response = client.send(
    request, 
    HttpResponse.BodyHandlers.ofString()
);

System.out.println(response.statusCode());
System.out.println(response.body());

// Asynchronous request
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);

// POST request
HttpRequest postRequest = HttpRequest.newBuilder()
    .uri(URI.create("https://api.example.com/users"))
    .header("Content-Type", "application/json")
    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
    .build();
```

### 3. var in Lambda Parameters

```java
// Useful when you need to add annotations
list.stream()
    .map((@NotNull var item) -> item.toUpperCase())
    .collect(Collectors.toList());
```

### 4. Files Methods

```java
// Read entire file as string
String content = Files.readString(Path.of("file.txt"));

// Write string to file
Files.writeString(Path.of("file.txt"), "content");
```

### 5. Running Java Files Directly

```bash
# Before Java 11
javac HelloWorld.java
java HelloWorld

# Java 11+ - Single file source-code programs
java HelloWorld.java
```

---

## Interview Questions

### Q1: What is the difference between List.of() and Arrays.asList()?
```java
List<Integer> listOf = List.of(1, 2, 3);
List<Integer> asList = Arrays.asList(1, 2, 3);

// List.of() - Fully immutable
// listOf.add(4);     // UnsupportedOperationException
// listOf.set(0, 10); // UnsupportedOperationException

// Arrays.asList() - Fixed size but elements mutable
// asList.add(4);     // UnsupportedOperationException
asList.set(0, 10);    // Works! [10, 2, 3]

// List.of() doesn't allow nulls
// List.of(1, null, 3);  // NullPointerException
Arrays.asList(1, null, 3);  // Works
```

### Q2: When should you use var vs explicit types?

| Use var | Use explicit type |
|---------|-------------------|
| Type is obvious from RHS | Type not clear from context |
| Long generic types | Primitive type with literals |
| Local variables in small scope | Public API return types |

```java
// Good use of var
var list = new ArrayList<String>();
var stream = Files.lines(path);

// Bad use of var - unclear what type
var result = process(data);  // What type is result?
var x = 10;  // int or Integer? Use explicit
```

### Q3: What are the advantages of the Module System?
1. **Strong encapsulation** - Hide internal packages
2. **Reliable configuration** - Fail fast on missing modules
3. **Smaller runtime** - Custom JRE with only needed modules
4. **Better security** - Reduced attack surface
5. **Improved performance** - Optimized class loading

### Q4: Explain HTTP Client in Java 11
- **Builder pattern** for creating requests and clients
- **Synchronous** (`send()`) and **Asynchronous** (`sendAsync()`) modes
- Supports HTTP/1.1 and HTTP/2
- Built-in response body handlers (String, byte[], InputStream, etc.)
- WebSocket support
