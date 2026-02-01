[🏠 Home](./README.md) | [⬅️ Java Index](./java/java-modern-features-guide.md)

# Spring Boot 3.x Comprehensive Guide (v3.4 - v3.5)

Current as of Early 2026.

## 1. Introduction
Spring Boot 3.x has evolved significantly, focusing on cloud-native efficiency, developer productivity, and modern Java (Java 21+) integration. This guide covers the major features introduced in versions 3.4 and 3.5, practical use cases, and deep dives into internal mechanics.

---

## 2. Key Features (New in v3.4 & v3.5)

### 2.1 Structured Logging (Native Support)
Gone are the days of complex Logback XML configurations for JSON logs. Spring Boot now natively supports structured logging formats like **ECS (Elastic Common Schema)**, **GELF**, and **Logstash**.

**How to enable:**
Simply add a property in `application.properties`:
```properties
logging.structured.format.console=ecs
# OR
logging.structured.format.file=logstash
```

### 2.2 Virtual Threads (Project Loom Integration)
Spring Boot 3.x fully embraces Java 21 Virtual Threads. This replaces the traditional thread-per-request model with a lightweight concurrency model, allowing millions of "threads" with minimal memory footprint.

**Enable globally:**
```properties
spring.threads.virtual.enabled=true
```
This automatically configures Tomcat/Jetty and `TaskExecutor` beans to use virtual threads.

### 2.3 SSL Bundles
Managing SSL certificates is simplified. Instead of raw file paths scattered in config, you define "bundles" that can be automatically reloaded when certificates rotate (crucial for K8s/Cloud environments).

```properties
spring.ssl.bundle.pem.my-bundle.keystore.certificate=classpath:certs/app.crt
spring.ssl.bundle.pem.my-bundle.keystore.private-key=classpath:certs/app.key
```

### 2.4 Native Image (GraalVM)
Spring Boot's AOT (Ahead-of-Time) engine is now mature. It pre-computes configuration at build time to generate standalone binaries that start in tens of milliseconds and use very little memory.

---

## 3. 🏷️ Essential Annotations Guide with Real Examples

This section covers the most critical annotations you'll use daily, with real-world context.

### 3.1 Core & Dependency Injection

#### `@SpringBootApplication`
**What:** The "main" annotation. Combines `@Configuration`, `@EnableAutoConfiguration`, and `@ComponentScan`.
**Real Example:**
```java
@SpringBootApplication
public class BankingApp {
    public static void main(String[] args) {
        SpringApplication.run(BankingApp.class, args);
    }
}
```

#### `@Bean` vs `@Component` (@Service, @Repository, @Controller)
**What:** `@Bean` is for **external** classes (libraries) you can't edit. `@Component` (and friends) is for **your** code.
**Real Example:**
```java
// 1. @Bean: Configuring a 3rd party request signer
@Configuration
public class SecurityConfig {
    @Bean
    public AwsRequestSigner awsSigner() {
        return new AwsRequestSigner("region=us-east-1");
    }
}

// 2. @Service: Your business logic
@Service
public class UserService {
    // Logic here
}
```

#### `@Primary` & `@Qualifier`
**What:** handling multiple beans of the same type.
**Real Example:** You have two email senders: `SesMailSender` and `SmtpMailSender`.
```java
@Service
@Primary // Default choice if no qualifier is specified
public class SesMailSender implements MailSender { ... }

@Service
public class SmtpMailSender implements MailSender { ... }

// Usage
@Service
public class NotificationService {
    
    private final MailSender defaultSender;
    private final MailSender backupSender;

    public NotificationService(MailSender defaultSender, 
                               @Qualifier("smtpMailSender") MailSender backupSender) {
        this.defaultSender = defaultSender; // Injects SesMailSender (@Primary)
        this.backupSender = backupSender;   // Injects SmtpMailSender (Specific)
    }
}
```

### 3.2 Web & REST API

#### `@RestController` & `@RequestMapping`
**What:** Marks a class as a web controller where methods return JSON/XML (not HTML views).
**Real Example:**
```java
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController { ... }
```

#### `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`
**What:** Shortcuts for `@RequestMapping(method = RequestMethod.X)`.
**Real Example:**
```java
@PostMapping
@ResponseStatus(HttpStatus.CREATED) // Returns 201 Created instead of 200 OK
public OrderResponse createOrder(@RequestBody OrderRequest request) {
    return orderService.create(request);
}

@GetMapping("/{orderId}")
public OrderResponse getOrder(@PathVariable UUID orderId) {
    return orderService.findById(orderId);
}
```

#### `@RequestParam` vs `@PathVariable`
**What:** Query params (`?q=search`) vs URL path segments (`/users/123`).
**Real Example:**
```java
// URL: /products/search?query=laptop&sort=price
@GetMapping("/search")
public List<Product> search(@RequestParam String query, 
                            @RequestParam(defaultValue = "relevance") String sort) { ... }

// URL: /products/123/reviews
@GetMapping("/{id}/reviews")
public List<Review> getReviews(@PathVariable("id") Long productId) { ... }
```

### 3.3 Data & Configuration

#### `@ConfigurationProperties`
**What:** Type-safe binding of `application.properties` to Java objects. Best practice over `@Value`.
**Real Example:**
`application.properties`:
```properties
app.payment.gateway-url=https://stripe.com
app.payment.timeout-ms=5000
```
**Java:**
```java
@ConfigurationProperties(prefix = "app.payment")
public record PaymentProperties(String gatewayUrl, int timeoutMs) {}

// Don't forget to enable it!
@EnableConfigurationProperties(PaymentProperties.class)
@Configuration
public class AppConfig { ... }
```

#### `@Transactional` (Spring Data / JPA)
**What:** Ensures method execution is atomic. Either all DB changes happen, or none do (rollback).
**Real Example:** Transferring money.
```java
@Service
public class AccountService {
    
    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        accountRepo.debit(fromId, amount);
        
        if (amount.compareTo(BigDecimal.valueOf(10000)) > 0) {
            throw new FraudException("Amount too high!"); 
            // @Transactional sees the runtime exception and automatically ROLLS BACK the debit.
            // Money is safe.
        }
        
        accountRepo.credit(toId, amount);
    }
}
```

### 3.4 Exception Handling

#### `@ControllerAdvice` & `@ExceptionHandler`
**What:** Global error handling. Catch exceptions from any controller in one place.
**Real Example:**
```java
@RestControllerAdvice // specialized @Component for web
public class GlobalErrorHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleNotFound(UserNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Something went wrong");
    }
}
```

---

## 4. Real-World Use Cases & Examples

### Use Case A: High-Throughput Payment Gateway
**Problem:** A traditional payment gateway handling 10k concurrent requests/sec was hitting thread limits (Context Switching hell) on a standard 8-core server.
**Solution:** Enable Virtual Threads.

**Implementation:**
```java
@RestController
public class PaymentController {
    
    private final RestClient restClient; // Blocking client is fine with Virtual Threads!

    public PaymentController(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("https://bank-provider.com").build();
    }

    @PostMapping("/process")
    public PaymentResponse process(@RequestBody PaymentRequest req) {
        // This blocking call unmounts the virtual thread, freeing the carrier thread.
        // No CPU time is wasted waiting for I/O.
        return restClient.post()
                .body(req)
                .retrieve()
                .body(PaymentResponse.class);
    }
}
```
**Impact:** Throughput increased 10x with the same hardware. Latency p99 dropped significantly because requests don't queue up waiting for platform threads.

### Use Case B: Serverless Inventory Job
**Problem:** An AWS Lambda function that checks inventory status needs to run cold, do work, and die. JVM cold start (2-3s) was too slow and costly.
**Solution:** Spring Boot Native Image.

**Build Command:**
```bash
./gradlew nativeCompile
```
**Result:**
- **Startup Time:** 45ms (vs 2500ms)
- **Memory:** 120MB (vs 512MB+)
- **Cost:** Significantly lower due to reduced execution time and memory tier.

### Use Case C: Secure Microservice Mesh
**Problem:** 50 microservices needing mutual TLS (mTLS). Rotation of certificates usually required restarting all services.
**Solution:** SSL Bundles with Watchers.

**Config:**
```yaml
spring:
  ssl:
    bundle:
      watch:
        file:
          quiet-period: 10s # Check for file changes every 10s
      pem:
        internal-mtls:
          keystore:
            certificate: /etc/certs/service.crt
            private-key: /etc/certs/service.key
```
**Outcome:** When the K8s Sidecar/Cert-Manager rotates the files on disk, Spring Boot picks up the new certs automatically without downtime.

---

## 5. Internal Deep Dive: Virtual Threads

### Platform Threads vs. Virtual Threads
*   **Platform Thread (Old):** Maps 1:1 to an OS Kernel Thread. Expensive (~1MB stack). Context switching involves the OS kernel. Limited to ~5,000 active threads per typical machine.
*   **Virtual Thread (New):** Maps N:M to Platform Threads (Carrier Threads). Managed by JDK. Cheap (~1KB stack). Context switching is just copying pointers in RAM (fast). Can have millions.

### How Spring Boot Handles It
When `spring.threads.virtual.enabled=true` is set:
1.  **Tomcat:** The embedded `TomcatWebServer` replaces its standard thread pool with a VirtualThreadExecutor.
2.  **Async:** `@Async` methods act differently. They don't use a fixed thread pool anymore; they spawn a new virtual thread for *every* task.
3.  **DB Connections:** **Warning!** JDBC connections are still "physical" resources. You don't want 100,000 concurrent database queries just because you have 100,000 virtual threads. You must still rely on connection pooling (HikariCP) to throttle the load to the database.

---

## 6. Development Best Practices (2026)

1.  **Testcontainers:** Use `@ServiceConnection` for instant Docker integration during tests.
    ```java
    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    ```
2.  **Docker Compose:** Spring Boot can now natively read `compose.yaml` at dev time to spin up dependencies.
3.  **Observability:** Don't just log. Use Micrometer Tracing.
    ```java
    // Spans are automatically propagated across thread boundaries
    // even in Virtual Threads!
    logger.info("Processing order {}", orderId); 
    ```
