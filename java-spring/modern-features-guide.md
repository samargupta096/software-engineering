[🏠 Home](../README.md) | [➡️ Java 8](./features/java8-features.md)

# Java Features Guide (Java 8 to Java 21+)

A comprehensive guide covering all major Java features from Java 8 onwards with examples, interview questions, and in-depth explanations.

## Table of Contents

| Version | Key Features | File |
|---------|-------------|------|
| Java 8 | Lambda, Streams, Optional, Date/Time API | [java8-features.md](./features/java8-features.md) |
| Java 9 | Modules, JShell, Private Interface Methods | [java9-features.md](./features/java8-features.md) |
| Java 10-11 | var, HTTP Client, New String Methods | [java10-11-features.md](./features/java9-11-features.md) |
| Java 12-14 | Switch Expressions, Records, Text Blocks | [java12-14-features.md](./features/java12-17-features.md) |
| Java 15-17 | Sealed Classes, Pattern Matching | [java15-17-features.md](./features/java12-17-features.md) |
| Java 18-21 | Virtual Threads, Sequenced Collections | [java18-21-features.md](./features/java18-21-features.md) |

## Quick Reference: Version Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        JAVA VERSION EVOLUTION                                │
├─────────┬───────────────────────────────────────────────────────────────────┤
│ Java 8  │ Lambda │ Stream API │ Optional │ Default Methods │ Date/Time API │
│ (2014)  │        │            │          │                 │               │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 9  │ Modules (JPMS) │ JShell │ Private Interface Methods │ Try-with   │
│ (2017)  │                │        │                           │ Resources   │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 10 │ Local Variable Type Inference (var) │ Unmodifiable Collections    │
│ (2018)  │                                     │                             │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 11 │ HTTP Client │ String Methods │ var in Lambda │ Files Methods     │
│ (2018)  │ (LTS)       │                │               │                   │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 12 │ Switch Expressions (Preview) │ Compact Number Formatting          │
│ (2019)  │                              │                                    │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 14 │ Records (Preview) │ Pattern Matching instanceof (Preview)        │
│ (2020)  │                   │                                               │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 15 │ Sealed Classes (Preview) │ Text Blocks (Standard)                 │
│ (2020)  │                          │                                        │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 17 │ Sealed Classes (Standard) │ Pattern Matching Switch (Preview)    │
│ (2021)  │ (LTS)                      │                                      │
├─────────┼───────────────────────────────────────────────────────────────────┤
│ Java 21 │ Virtual Threads │ Sequenced Collections │ Pattern Matching       │
│ (2023)  │ (LTS)           │                       │ (Enhanced)              │
└─────────┴───────────────────────────────────────────────────────────────────┘
```

## LTS (Long Term Support) Versions

- **Java 8** - Extended support until 2030
- **Java 11** - Support until 2026
- **Java 17** - Support until 2029
- **Java 21** - Support until 2031

## How to Use This Guide

Each feature file contains:
1. **Why the Feature Was Needed** - Problem it solves
2. **Detailed Explanation** - How it works
3. **Multiple Examples** - Practical code samples
4. **Advantages** - Benefits of using the feature
5. **Interview Questions & Answers** - Common interview topics
6. **Best Practices** - Recommended usage patterns

---

## Most Commonly Used Features in Real Projects

### Top 10 Features You'll Use Daily

| Feature | Why It's Essential |
|---------|-------------------|
| **Stream API** | Data processing, filtering, transformations |
| **Optional** | Null safety, cleaner API design |
| **Lambda Expressions** | Callbacks, event handlers, functional code |
| **Records** | DTOs, API responses, immutable data |
| **var keyword** | Cleaner code, less boilerplate |
| **Text Blocks** | SQL queries, JSON templates, HTML |
| **Switch Expressions** | Cleaner conditional logic |
| **Pattern Matching** | Type-safe object handling |
| **Virtual Threads** | High-concurrency I/O operations |
| **New String Methods** | String manipulation (isBlank, lines, repeat) |

---

## Spring Boot Real-World Examples

### 1. Records as DTOs (Data Transfer Objects)

```java
// Request/Response DTOs - Clean and immutable!
public record UserRequest(
    @NotBlank String username,
    @Email String email,
    @Size(min = 8) String password
) { }

public record UserResponse(
    Long id,
    String username,
    String email,
    LocalDateTime createdAt
) {
    // Factory method from entity
    public static UserResponse from(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt()
        );
    }
}

public record ApiResponse<T>(
    boolean success,
    String message,
    T data
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, "Success", data);
    }
    
    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}

// Controller usage
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @PostMapping
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody UserRequest request) {
        var user = userService.create(request);
        return ApiResponse.success(UserResponse.from(user));
    }
}
```

### 2. Stream API in Service Layer

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final OrderRepository orderRepository;
    
    // Filter and transform orders
    public List<OrderSummary> getRecentHighValueOrders(Long customerId) {
        return orderRepository.findByCustomerId(customerId).stream()
            .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
            .filter(order -> order.getTotal().compareTo(BigDecimal.valueOf(1000)) > 0)
            .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
            .limit(10)
            .map(OrderSummary::from)
            .toList();  // Java 16+
    }
    
    // Grouping and statistics
    public Map<OrderStatus, Long> getOrderCountByStatus() {
        return orderRepository.findAll().stream()
            .collect(Collectors.groupingBy(
                Order::getStatus,
                Collectors.counting()
            ));
    }
    
    // Calculate totals
    public BigDecimal getTotalRevenue(LocalDate from, LocalDate to) {
        return orderRepository.findByDateRange(from, to).stream()
            .map(Order::getTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    // Parallel processing for large datasets
    public List<OrderReport> generateReports(List<Long> orderIds) {
        return orderIds.parallelStream()
            .map(this::generateReport)
            .toList();
    }
}
```

### 3. Optional for Clean Repository Access

```java
@Service
public class ProductService {
    
    private final ProductRepository productRepository;
    
    // Optional return from repository
    public ProductResponse getProduct(Long id) {
        return productRepository.findById(id)
            .map(ProductResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }
    
    // Optional chaining
    public String getProductCategoryName(Long productId) {
        return productRepository.findById(productId)
            .flatMap(product -> Optional.ofNullable(product.getCategory()))
            .map(Category::getName)
            .orElse("Uncategorized");
    }
    
    // Conditional updates
    public ProductResponse updatePrice(Long id, BigDecimal newPrice) {
        return productRepository.findById(id)
            .map(product -> {
                product.setPrice(newPrice);
                product.setUpdatedAt(LocalDateTime.now());
                return productRepository.save(product);
            })
            .map(ProductResponse::from)
            .orElseThrow(() -> new ResourceNotFoundException("Product not found"));
    }
}
```

### 4. Text Blocks for Queries and Templates

```java
@Repository
public class ReportRepository {
    
    @PersistenceContext
    private EntityManager em;
    
    // Clean SQL with text blocks
    public List<SalesReport> getMonthlySalesReport(int year, int month) {
        var sql = """
            SELECT 
                p.category_id,
                c.name as category_name,
                COUNT(oi.id) as items_sold,
                SUM(oi.quantity * oi.price) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN categories c ON p.category_id = c.id
            JOIN orders o ON oi.order_id = o.id
            WHERE YEAR(o.created_at) = :year
              AND MONTH(o.created_at) = :month
              AND o.status = 'COMPLETED'
            GROUP BY p.category_id, c.name
            ORDER BY total_revenue DESC
            """;
        
        return em.createNativeQuery(sql, SalesReport.class)
            .setParameter("year", year)
            .setParameter("month", month)
            .getResultList();
    }
}

@Service
public class EmailService {
    
    // HTML email templates
    public String buildWelcomeEmail(String userName) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    .container { max-width: 600px; margin: 0 auto; font-family: Arial; }
                    .header { background: #4CAF50; color: white; padding: 20px; }
                    .content { padding: 20px; }
                    .button { background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Our Platform!</h1>
                    </div>
                    <div class="content">
                        <p>Hello %s,</p>
                        <p>Thank you for joining us. Click below to get started:</p>
                        <a href="https://example.com/dashboard" class="button">Go to Dashboard</a>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(userName);
    }
}
```

### 5. Switch Expressions for Business Logic

```java
@Service
public class PricingService {
    
    // Calculate discount based on customer tier
    public BigDecimal calculateDiscount(Order order, CustomerTier tier) {
        var discountPercent = switch (tier) {
            case BRONZE -> BigDecimal.valueOf(0.05);
            case SILVER -> BigDecimal.valueOf(0.10);
            case GOLD -> BigDecimal.valueOf(0.15);
            case PLATINUM -> BigDecimal.valueOf(0.20);
        };
        
        return order.getTotal().multiply(discountPercent);
    }
    
    // Order status transitions
    public OrderStatus getNextStatus(OrderStatus current, OrderAction action) {
        return switch (current) {
            case PENDING -> switch (action) {
                case CONFIRM -> OrderStatus.CONFIRMED;
                case CANCEL -> OrderStatus.CANCELLED;
                default -> throw new InvalidActionException("Invalid action for PENDING");
            };
            case CONFIRMED -> switch (action) {
                case SHIP -> OrderStatus.SHIPPED;
                case CANCEL -> OrderStatus.CANCELLED;
                default -> throw new InvalidActionException("Invalid action for CONFIRMED");
            };
            case SHIPPED -> action == OrderAction.DELIVER 
                ? OrderStatus.DELIVERED 
                : throw new InvalidActionException("Can only deliver shipped orders");
            case DELIVERED, CANCELLED -> 
                throw new InvalidActionException("Order is in final state");
        };
    }
}
```

### 6. Pattern Matching in Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception ex) {
        var response = switch (ex) {
            case ResourceNotFoundException e -> 
                new ErrorDetails(HttpStatus.NOT_FOUND, e.getMessage());
            
            case ValidationException e -> 
                new ErrorDetails(HttpStatus.BAD_REQUEST, e.getMessage());
            
            case AuthenticationException e -> 
                new ErrorDetails(HttpStatus.UNAUTHORIZED, "Authentication required");
            
            case AccessDeniedException e -> 
                new ErrorDetails(HttpStatus.FORBIDDEN, "Access denied");
            
            case DataIntegrityViolationException e -> 
                new ErrorDetails(HttpStatus.CONFLICT, "Data conflict occurred");
            
            default -> {
                log.error("Unexpected error", ex);
                yield new ErrorDetails(HttpStatus.INTERNAL_SERVER_ERROR, "An error occurred");
            }
        };
        
        return ResponseEntity.status(response.status())
            .body(ApiResponse.error(response.message()));
    }
    
    record ErrorDetails(HttpStatus status, String message) { }
}
```

### 7. Virtual Threads for High-Concurrency APIs

```java
@Configuration
public class AsyncConfig {
    
    // Configure virtual thread executor for async operations
    @Bean
    public Executor taskExecutor() {
        return Executors.newVirtualThreadPerTaskExecutor();
    }
}

@Service
public class AggregatorService {
    
    private final UserServiceClient userClient;
    private final OrderServiceClient orderClient;
    private final NotificationClient notificationClient;
    
    // Parallel API calls with virtual threads
    public DashboardData getDashboard(Long userId) throws Exception {
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            
            var userFuture = executor.submit(() -> userClient.getUser(userId));
            var ordersFuture = executor.submit(() -> orderClient.getRecentOrders(userId));
            var notificationsFuture = executor.submit(() -> notificationClient.getUnread(userId));
            
            // All calls execute in parallel on virtual threads
            return new DashboardData(
                userFuture.get(),
                ordersFuture.get(),
                notificationsFuture.get()
            );
        }
    }
}

// Spring Boot 3.2+ with virtual threads enabled
// application.yml:
// spring:
//   threads:
//     virtual:
//       enabled: true
```

### 8. Modern Java in Repository Layer

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Stream for large result sets (memory efficient)
    @Query("SELECT u FROM User u WHERE u.status = :status")
    Stream<User> streamByStatus(@Param("status") UserStatus status);
    
    // Optional return
    Optional<User> findByEmail(String email);
    
    // Using in service with try-with-resources
    @Transactional(readOnly = true)
    public void processActiveUsers() {
        try (var users = userRepository.streamByStatus(UserStatus.ACTIVE)) {
            users.filter(u -> u.getLastLoginAt().isBefore(LocalDateTime.now().minusDays(30)))
                 .forEach(this::sendReminderEmail);
        }
    }
}
```

### 9. Modern Validation with Records

```java
// Validation records
public record CreateOrderRequest(
    @NotNull Long customerId,
    @NotEmpty List<OrderItemRequest> items,
    @NotNull PaymentMethod paymentMethod,
    ShippingAddress shippingAddress
) {
    // Compact constructor for validation
    public CreateOrderRequest {
        if (items != null && items.size() > 100) {
            throw new ValidationException("Cannot order more than 100 items");
        }
    }
}

public record OrderItemRequest(
    @NotNull Long productId,
    @Min(1) @Max(99) int quantity
) { }

public record ShippingAddress(
    @NotBlank String street,
    @NotBlank String city,
    @NotBlank String zipCode,
    @NotBlank String country
) { }
```

### 10. Functional Configuration

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> 
                oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtConverter())))
            .build();
    }
}
```

---

## Quick Reference Card

```
┌──────────────────────────────────────────────────────────────────┐
│                    DAILY USE CHEAT SHEET                         │
├──────────────────────────────────────────────────────────────────┤
│ STREAMS                                                          │
│   list.stream().filter(x -> condition).map(X::method).toList()   │
│   list.stream().collect(Collectors.groupingBy(X::getField))      │
│                                                                  │
│ OPTIONAL                                                         │
│   optional.map(X::method).orElse(default)                        │
│   optional.orElseThrow(() -> new NotFoundException())            │
│                                                                  │
│ RECORDS                                                          │
│   record UserDto(Long id, String name) { }                       │
│                                                                  │
│ SWITCH EXPRESSION                                                │
│   var result = switch(value) { case A -> x; case B -> y; };      │
│                                                                  │
│ TEXT BLOCKS                                                      │
│   var sql = """ SELECT * FROM table WHERE id = ? """;            │
│                                                                  │
│ PATTERN MATCHING                                                 │
│   if (obj instanceof String s) { use(s); }                       │
│   switch(obj) { case Type t -> process(t); }                     │
└──────────────────────────────────────────────────────────────────┘
```
