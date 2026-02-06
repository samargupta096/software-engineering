# Spring Boot & Microservices Interview Guide for Barclays 🍃

> **Focus:** REST APIs, Spring Boot Internals, Microservices Architecture, Kafka

---

## 📋 Table of Contents

1. [Spring Boot Basics](#spring-boot-basics)
2. [Spring Annotations](#spring-annotations)
3. [REST API Development](#rest-api-development)
4. [Spring Security](#spring-security)
5. [Microservices Architecture](#microservices-architecture)
6. [Inter-Service Communication](#inter-service-communication)
7. [Apache Kafka](#apache-kafka)
8. [JPA & Hibernate](#jpa--hibernate)

---

## 🚀 Spring Boot Basics

### 1. What is Spring Boot?

Spring Boot simplifies Spring application development by:
- **Auto-configuration** - Automatically configures beans based on classpath
- **Starter dependencies** - Pre-bundled dependencies for common use cases
- **Embedded servers** - Tomcat, Jetty, Undertow out of the box
- **Production-ready features** - Actuator for health checks, metrics

### 2. @SpringBootApplication Annotation

```java
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) {
        SpringApplication.run(MyApplication.class, args);
    }
}

// @SpringBootApplication = 
//   @Configuration + @EnableAutoConfiguration + @ComponentScan
```

### 3. Application Properties

```yaml
# application.yml
server:
  port: 8080
  servlet:
    context-path: /api

spring:
  profiles:
    active: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/mydb
    username: user
    password: secret
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true

# Custom properties
app:
  jwt:
    secret: ${JWT_SECRET:defaultSecretKey}
    expiration: 86400000
```

### 4. Profiles

```java
// Profile-specific configuration
@Configuration
@Profile("dev")
public class DevConfig {
    // Development specific beans
}

@Configuration
@Profile("prod")
public class ProdConfig {
    // Production specific beans
}

// Activating profiles
// application.yml: spring.profiles.active: dev
// Command line: java -jar app.jar --spring.profiles.active=prod
// Environment: SPRING_PROFILES_ACTIVE=prod
```

### 5. Spring Boot Starters

| Starter | Purpose |
|---------|---------|
| `spring-boot-starter-web` | Web MVC + Tomcat |
| `spring-boot-starter-data-jpa` | JPA + Hibernate |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-actuator` | Production monitoring |
| `spring-boot-starter-test` | Testing utilities |
| `spring-boot-starter-validation` | Bean validation |

---

## 🏷️ Spring Annotations

### Core Annotations

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@Component` | Generic Spring bean | Utility classes |
| `@Service` | Business logic layer | UserService |
| `@Repository` | Data access layer | UserRepository |
| `@Controller` | MVC controller | Returns views |
| `@RestController` | REST API controller | Returns JSON/XML |
| `@Configuration` | Configuration class | Bean definitions |

### Dependency Injection

```java
// Constructor injection (recommended)
@Service
public class UserService {
    private final UserRepository userRepository;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }
}

// @Autowired (field injection - not recommended)
@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
}

// @Value for properties
@Component
public class AppConfig {
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    
    @Value("${app.jwt.expiration:3600000}") // With default
    private long jwtExpiration;
}
```

### Request Mapping Annotations

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping                    // GET /api/users
    @GetMapping("/{id}")           // GET /api/users/1
    @PostMapping                   // POST /api/users
    @PutMapping("/{id}")           // PUT /api/users/1
    @DeleteMapping("/{id}")        // DELETE /api/users/1
    @PatchMapping("/{id}")         // PATCH /api/users/1
}
```

---

## 🌐 REST API Development

### Complete REST Controller Example

```java
@RestController
@RequestMapping("/api/v1/users")
@Validated
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    // GET all users with pagination
    @GetMapping
    public ResponseEntity<Page<UserDTO>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy) {
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        return ResponseEntity.ok(userService.findAll(pageable));
    }
    
    // GET user by ID
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
    
    // POST create user
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserDTO created = userService.create(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.getId())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }
    
    // PUT update user
    @PutMapping("/{id}")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }
    
    // DELETE user
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Global Exception Handler

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            ex.getMessage(),
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Validation failed",
            LocalDateTime.now(),
            errors
        );
        return ResponseEntity.badRequest().body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneral(Exception ex) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "An unexpected error occurred",
            LocalDateTime.now()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### Request/Response DTOs with Validation

```java
public record CreateUserRequest(
    @NotBlank(message = "Name is required")
    String name,
    
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    String email,
    
    @Size(min = 8, message = "Password must be at least 8 characters")
    String password,
    
    @Min(value = 18, message = "Age must be at least 18")
    Integer age
) {}

public record UserDTO(
    Long id,
    String name,
    String email,
    Integer age,
    LocalDateTime createdAt
) {}
```

---

## 🔒 Spring Security

### Basic Security Configuration

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### JWT Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ /api/auth/   │────▶│   Validate   │
│          │     │   login      │     │  Credentials │
└──────────┘     └──────────────┘     └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ Generate JWT │
                                      └──────────────┘
                                              │
                                              ▼
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │◀────│ Return Token │◀────│    Token     │
│          │     │              │     │              │
└──────────┘     └──────────────┘     └──────────────┘
      │
      │ Authorization: Bearer <token>
      ▼
┌──────────────┐     ┌──────────────┐
│ /api/users   │────▶│ JWT Filter   │──▶ Validate & Set Auth
└──────────────┘     └──────────────┘
```

---

## 🏗️ Microservices Architecture

### Monolithic vs Microservices

| Aspect | Monolithic | Microservices |
|--------|-----------|---------------|
| Deployment | Single unit | Independent services |
| Scaling | Scale entire app | Scale individual services |
| Technology | Single stack | Polyglot |
| Team | Single team | Multiple teams |
| Failure | Cascading | Isolated |
| Complexity | Simple | Distributed system complexity |

### Microservices Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                               │
│                   (Spring Cloud Gateway)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│ User Service  │    │ Order Service │    │Payment Service│
│   (Java)      │    │   (Java)      │    │  (Java)       │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                    ┌─────────────────┐
                    │ Service Registry│
                    │    (Eureka)     │
                    └─────────────────┘
                              │
                    ┌─────────────────┐
                    │  Config Server  │
                    └─────────────────┘
```

### Key Components

| Component | Tool | Purpose |
|-----------|------|---------|
| Service Discovery | Eureka, Consul | Register & discover services |
| API Gateway | Spring Cloud Gateway | Routing, rate limiting |
| Config Server | Spring Cloud Config | Centralized configuration |
| Circuit Breaker | Resilience4j | Fault tolerance |
| Distributed Tracing | Zipkin, Sleuth | Request tracing |
| Message Broker | Kafka, RabbitMQ | Async communication |

### Service Discovery with Eureka

```java
// Eureka Server
@SpringBootApplication
@EnableEurekaServer
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}

// Eureka Client (your microservice)
@SpringBootApplication
@EnableDiscoveryClient
public class UserServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(UserServiceApplication.class, args);
    }
}

// application.yml for client
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
  instance:
    prefer-ip-address: true
```

---

## 📡 Inter-Service Communication

### 1. RestTemplate (Legacy)

```java
@Service
public class OrderService {
    
    private final RestTemplate restTemplate;
    
    public OrderService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    public UserDTO getUser(Long userId) {
        return restTemplate.getForObject(
            "http://user-service/api/users/" + userId,
            UserDTO.class
        );
    }
}
```

### 2. WebClient (Reactive - Recommended)

```java
@Service
public class OrderService {
    
    private final WebClient webClient;
    
    public OrderService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("http://user-service")
            .build();
    }
    
    public Mono<UserDTO> getUser(Long userId) {
        return webClient.get()
            .uri("/api/users/{id}", userId)
            .retrieve()
            .bodyToMono(UserDTO.class);
    }
    
    public UserDTO getUserBlocking(Long userId) {
        return getUser(userId).block(); // Blocking call
    }
}
```

### 3. Feign Client (Declarative)

```java
// Enable Feign
@SpringBootApplication
@EnableFeignClients
public class OrderServiceApplication { }

// Feign Client Interface
@FeignClient(name = "user-service", fallback = UserClientFallback.class)
public interface UserClient {
    
    @GetMapping("/api/users/{id}")
    UserDTO getUserById(@PathVariable Long id);
    
    @PostMapping("/api/users")
    UserDTO createUser(@RequestBody CreateUserRequest request);
}

// Fallback for Circuit Breaker
@Component
public class UserClientFallback implements UserClient {
    
    @Override
    public UserDTO getUserById(Long id) {
        return new UserDTO(id, "Fallback User", "fallback@example.com", 0, null);
    }
    
    @Override
    public UserDTO createUser(CreateUserRequest request) {
        throw new ServiceUnavailableException("User service is down");
    }
}
```

### 4. Circuit Breaker with Resilience4j

```java
@Service
public class OrderService {
    
    private final UserClient userClient;
    
    @CircuitBreaker(name = "userService", fallbackMethod = "getUserFallback")
    @Retry(name = "userService")
    @TimeLimiter(name = "userService")
    public CompletableFuture<UserDTO> getUser(Long userId) {
        return CompletableFuture.supplyAsync(() -> 
            userClient.getUserById(userId));
    }
    
    public CompletableFuture<UserDTO> getUserFallback(Long userId, Throwable t) {
        return CompletableFuture.completedFuture(
            new UserDTO(userId, "Fallback User", null, 0, null));
    }
}
```

```yaml
# application.yml
resilience4j:
  circuitbreaker:
    instances:
      userService:
        slidingWindowSize: 10
        failureRateThreshold: 50
        waitDurationInOpenState: 10000
        permittedNumberOfCallsInHalfOpenState: 3
  retry:
    instances:
      userService:
        maxAttempts: 3
        waitDuration: 1000
  timelimiter:
    instances:
      userService:
        timeoutDuration: 3s
```

---

## 📨 Apache Kafka

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Topic** | Category/feed name for messages |
| **Partition** | Ordered, immutable sequence of records |
| **Producer** | Publishes messages to topics |
| **Consumer** | Reads messages from topics |
| **Consumer Group** | Logical group of consumers for scaling |
| **Offset** | Position of message in partition |

### Use Cases at Barclays

| Use Case | Description |
|----------|-------------|
| Event-Driven Microservices | Async communication between services |
| Real-time Data Streaming | Processing live transaction data |
| Log Aggregation | Centralized logging |
| Database CDC | Change Data Capture |
| Fraud Detection | Real-time transaction monitoring |

### Kafka Producer

```java
@Configuration
public class KafkaProducerConfig {
    
    @Bean
    public ProducerFactory<String, OrderEvent> producerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);
        return new DefaultKafkaProducerFactory<>(config);
    }
    
    @Bean
    public KafkaTemplate<String, OrderEvent> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }
}

@Service
public class OrderEventProducer {
    
    private static final String TOPIC = "order-events";
    private final KafkaTemplate<String, OrderEvent> kafkaTemplate;
    
    public OrderEventProducer(KafkaTemplate<String, OrderEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }
    
    public void sendOrderCreatedEvent(OrderEvent event) {
        kafkaTemplate.send(TOPIC, event.getOrderId(), event)
            .addCallback(
                result -> log.info("Sent: {}", event),
                ex -> log.error("Failed to send: {}", ex.getMessage())
            );
    }
}
```

### Kafka Consumer

```java
@Configuration
@EnableKafka
public class KafkaConsumerConfig {
    
    @Bean
    public ConsumerFactory<String, OrderEvent> consumerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "payment-service");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        return new DefaultKafkaConsumerFactory<>(config);
    }
    
    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, OrderEvent> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, OrderEvent> factory = 
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        return factory;
    }
}

@Service
public class OrderEventConsumer {
    
    private final PaymentService paymentService;
    
    @KafkaListener(topics = "order-events", groupId = "payment-service")
    public void handleOrderCreated(OrderEvent event) {
        log.info("Received order event: {}", event);
        paymentService.processPayment(event);
    }
}
```

---

## 💾 JPA & Hibernate

### Entity Mapping

```java
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Order> orders = new ArrayList<>();
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Getters, setters, constructors
}

@Entity
@Table(name = "orders")
public class Order {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    private OrderStatus status;
    
    private BigDecimal totalAmount;
}
```

### Spring Data JPA Repository

```java
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Derived queries
    Optional<User> findByEmail(String email);
    List<User> findByNameContainingIgnoreCase(String name);
    boolean existsByEmail(String email);
    
    // JPQL query
    @Query("SELECT u FROM User u WHERE u.createdAt > :date")
    List<User> findUsersCreatedAfter(@Param("date") LocalDateTime date);
    
    // Native query
    @Query(value = "SELECT * FROM users WHERE email LIKE %:domain%", nativeQuery = true)
    List<User> findByEmailDomain(@Param("domain") String domain);
    
    // Modifying query
    @Modifying
    @Query("UPDATE User u SET u.status = :status WHERE u.id IN :ids")
    int updateStatusByIds(@Param("status") String status, @Param("ids") List<Long> ids);
}
```

### Lazy vs Eager Loading

```java
// LAZY (default for @OneToMany, @ManyToMany)
// - Loaded on demand
// - Better performance
// - May cause LazyInitializationException outside session

// EAGER (default for @ManyToOne, @OneToOne)
// - Loaded immediately
// - Can cause performance issues (N+1 problem)

// Solving N+1 Problem
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Fetch join to load orders eagerly in single query
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.orders")
    List<User> findAllWithOrders();
    
    // Entity Graph
    @EntityGraph(attributePaths = {"orders"})
    List<User> findByNameContaining(String name);
}
```

### Transaction Management

```java
@Service
@Transactional(readOnly = true) // Default for reads
public class UserService {
    
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    
    @Transactional // Read-write transaction
    public User createUser(CreateUserRequest request) {
        User user = new User(request.name(), request.email());
        return userRepository.save(user);
    }
    
    @Transactional(
        propagation = Propagation.REQUIRED,
        isolation = Isolation.READ_COMMITTED,
        timeout = 30,
        rollbackFor = Exception.class
    )
    public void transferFunds(Long fromUserId, Long toUserId, BigDecimal amount) {
        // Both operations in same transaction
        deductBalance(fromUserId, amount);
        addBalance(toUserId, amount);
    }
}
```

---

## ✅ Quick Review Checklist

- [ ] Spring Boot: Auto-configuration, Starters, Profiles
- [ ] Annotations: @RestController, @Service, @Transactional
- [ ] REST APIs: Request handling, validation, exception handling
- [ ] Microservices: Service discovery, API Gateway, Config Server
- [ ] Communication: Feign, WebClient, Circuit Breaker
- [ ] Kafka: Producer, Consumer, Use cases
- [ ] JPA: Entity mapping, Relationships, N+1 problem

---

**Good luck with your Barclays interview! 🍀**
