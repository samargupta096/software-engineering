[🏠 Home](../README.md) | [⬅️ Spring Boot Guide](../spring-boot-guide.md) | [Java Index](./java-modern-features-guide.md)

# Spring Boot 3.x: Testing, Migrations & Future Roadmap

> **Complete Interview Preparation Guide**  
> Covers Unit Testing, Integration Testing, Spring Boot 3 Major Features, Migration Strategies, and Spring Boot 4 Preview.

---

## Table of Contents

1. [Unit Testing](#1-unit-testing)
2. [Integration Testing](#2-integration-testing)
3. [Test Slices & Specialized Testing](#3-test-slices--specialized-testing)
4. [Testcontainers](#4-testcontainers-spring-boot-31)
5. [Spring Boot 3.x Features Summary](#5-spring-boot-3x-features-summary)
6. [Migration to Spring Boot 3](#6-migration-to-spring-boot-3)
7. [Spring Boot 4 Roadmap](#7-spring-boot-4-roadmap)
8. [Interview Questions & Answers](#8-interview-questions--answers)

---

## 1. Unit Testing

Unit tests validate individual components in **complete isolation** from the Spring context and external dependencies.

### 1.1 Core Setup

**Dependencies (pom.xml):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

> [!TIP]
> `spring-boot-starter-test` includes JUnit 5, Mockito, AssertJ, Hamcrest, and JSONPath.

### 1.2 Essential Annotations

| Annotation | Purpose | Example |
|------------|---------|---------|
| `@ExtendWith(MockitoExtension.class)` | Enable Mockito with JUnit 5 | Class level |
| `@Mock` | Create mock instance | Dependencies |
| `@InjectMocks` | Auto-inject mocks | Class under test |
| `@Spy` | Partial mock (real + stub) | Hybrid testing |
| `@Captor` | Capture method arguments | Verify arguments |

### 1.3 Complete Unit Test Example

```java
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService Unit Tests")
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private UserService userService;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .name("John Doe")
            .email("john@example.com")
            .build();
    }

    @Nested
    @DisplayName("Find User Tests")
    class FindUserTests {

        @Test
        @DisplayName("Should return user when found by ID")
        void shouldReturnUserWhenFound() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

            // Act
            User result = userService.findById(1L);

            // Assert
            assertThat(result)
                .isNotNull()
                .satisfies(u -> {
                    assertThat(u.getName()).isEqualTo("John Doe");
                    assertThat(u.getEmail()).isEqualTo("john@example.com");
                });

            verify(userRepository, times(1)).findById(1L);
            verifyNoMoreInteractions(userRepository);
        }

        @Test
        @DisplayName("Should throw exception when user not found")
        void shouldThrowExceptionWhenNotFound() {
            // Arrange
            when(userRepository.findById(anyLong())).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> userService.findById(999L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("User not found with id: 999");
        }
    }

    @Nested
    @DisplayName("Create User Tests")
    class CreateUserTests {

        @Test
        @DisplayName("Should save user and send welcome email")
        void shouldSaveUserAndSendEmail() {
            // Arrange
            CreateUserRequest request = new CreateUserRequest("Jane", "jane@test.com");
            when(userRepository.save(any(User.class))).thenReturn(testUser);

            // Act
            User result = userService.createUser(request);

            // Assert - Capture and verify saved user
            verify(userRepository).save(userCaptor.capture());
            User savedUser = userCaptor.getValue();

            assertThat(savedUser.getName()).isEqualTo("Jane");
            assertThat(savedUser.getEmail()).isEqualTo("jane@test.com");

            // Verify email was sent
            verify(emailService).sendWelcomeEmail(eq("jane@test.com"), anyString());
        }
    }
}
```

### 1.4 Mockito Verification Patterns

```java
// Exact invocations
verify(mock, times(2)).method();        // Exactly 2 times
verify(mock, never()).method();         // Never called
verify(mock, atLeast(1)).method();      // At least once
verify(mock, atMost(3)).method();       // At most 3 times

// Order verification
InOrder inOrder = inOrder(repo, emailService);
inOrder.verify(repo).save(any());
inOrder.verify(emailService).sendEmail(any());

// Argument matchers
verify(repo).findByEmail(eq("test@email.com"));
verify(repo).findByAge(gt(18));
verify(service).process(argThat(user -> user.getName().startsWith("J")));
```

---

## 2. Integration Testing

Integration tests verify multiple components working together with the Spring application context.

### 2.1 @SpringBootTest

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
class UserControllerIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Test
    void shouldCreateAndRetrieveUser() {
        // Create user
        CreateUserRequest request = new CreateUserRequest("Integration", "test@example.com");
        
        ResponseEntity<User> createResponse = restTemplate.postForEntity(
            "/api/users", request, User.class);

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(createResponse.getBody()).isNotNull();
        Long userId = createResponse.getBody().getId();

        // Retrieve user
        ResponseEntity<User> getResponse = restTemplate.getForEntity(
            "/api/users/" + userId, User.class);

        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody().getName()).isEqualTo("Integration");
    }
}
```

### 2.2 WebEnvironment Options

| Option | Description | Use Case |
|--------|-------------|----------|
| `MOCK` | No real server, MockMvc only | Fast controller tests |
| `RANDOM_PORT` | Real server on random port | Full integration tests |
| `DEFINED_PORT` | Uses `server.port` | Legacy compatibility |
| `NONE` | No web environment | Service layer tests |

---

## 3. Test Slices & Specialized Testing

Spring Boot provides "slice" annotations to load only specific parts of the application context.

### 3.1 @WebMvcTest (Controller Layer Only)

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @Test
    void shouldReturnUserById() throws Exception {
        User user = new User(1L, "MockUser", "mock@test.com");
        when(userService.findById(1L)).thenReturn(user);

        mockMvc.perform(get("/api/users/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("MockUser"))
            .andExpect(jsonPath("$.email").value("mock@test.com"));
    }

    @Test
    void shouldValidateRequestBody() throws Exception {
        String invalidRequest = """
            {
                "name": "",
                "email": "invalid-email"
            }
            """;

        mockMvc.perform(post("/api/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidRequest))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors").isArray());
    }
}
```

### 3.2 @DataJpaTest (Repository Layer Only)

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class UserRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private UserRepository userRepository;

    @Test
    void shouldFindByEmailIgnoreCase() {
        // Arrange
        User user = User.builder()
            .name("Test User")
            .email("Test@Example.COM")
            .build();
        entityManager.persistAndFlush(user);

        // Act
        Optional<User> found = userRepository.findByEmailIgnoreCase("test@example.com");

        // Assert
        assertThat(found).isPresent();
        assertThat(found.get().getName()).isEqualTo("Test User");
    }

    @Test
    void shouldReturnUsersWithPagination() {
        // Create 15 users
        for (int i = 0; i < 15; i++) {
            entityManager.persist(new User(null, "User" + i, "user" + i + "@test.com"));
        }
        entityManager.flush();

        // Get first page
        Page<User> page = userRepository.findAll(PageRequest.of(0, 10, Sort.by("name")));

        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getTotalElements()).isEqualTo(15);
        assertThat(page.getTotalPages()).isEqualTo(2);
    }
}
```

### 3.3 Other Test Slices

| Annotation | Loads | Purpose |
|------------|-------|---------|
| `@WebMvcTest` | Controllers, Filters, ControllerAdvice | REST API testing |
| `@DataJpaTest` | JPA, EntityManager, TestEntityManager | Repository testing |
| `@DataMongoTest` | MongoDB repositories | MongoDB testing |
| `@DataRedisTest` | Redis configuration | Cache testing |
| `@JdbcTest` | JDBC templates | Raw SQL testing |
| `@JsonTest` | Jackson ObjectMapper | JSON serialization testing |

---

## 4. Testcontainers (Spring Boot 3.1+)

Testcontainers provides throwaway Docker instances for integration testing.

### 4.1 Basic Setup with @ServiceConnection

```java
@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("testdb")
        .withUsername("testuser")
        .withPassword("testpass");

    @Container
    @ServiceConnection
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Test
    void shouldConnectToPostgres() {
        User user = userRepository.save(new User(null, "Test", "test@test.com"));
        assertThat(user.getId()).isNotNull();
    }

    @Test
    void shouldConnectToRedis() {
        redisTemplate.opsForValue().set("key", "value");
        assertThat(redisTemplate.opsForValue().get("key")).isEqualTo("value");
    }
}
```

### 4.2 Reusable Containers (Singleton Pattern)

```java
public abstract class AbstractIntegrationTest {

    @Container
    @ServiceConnection
    protected static final PostgreSQLContainer<?> POSTGRES = 
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withReuse(true);

    @Container
    @ServiceConnection
    protected static final KafkaContainer KAFKA = 
        new KafkaContainer(DockerImageName.parse("confluentinc/cp-kafka:7.5.0"))
            .withReuse(true);
}

// Extend in your tests
@SpringBootTest
@Testcontainers
class OrderServiceTest extends AbstractIntegrationTest {
    // Tests automatically use shared containers
}
```

### 4.3 Dynamic Properties (Pre-3.1 Approach)

```java
@SpringBootTest
@Testcontainers
class LegacyContainerTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

---

## 5. Spring Boot 3.x Features Summary

### 5.1 Major Features Matrix

| Feature | Version | Impact Level |
|---------|---------|--------------|
| Jakarta EE 9+ Migration | 3.0 | 🔴 Breaking |
| Java 17 Baseline | 3.0 | 🔴 Breaking |
| Native Image (AOT) | 3.0 | 🟢 Optional |
| Problem Details (RFC 7807) | 3.0 | 🟡 Enhancement |
| HTTP Interfaces | 3.0 | 🟡 Enhancement |
| Observability (Micrometer) | 3.0 | 🟡 Enhancement |
| @ServiceConnection | 3.1 | 🟡 Enhancement |
| Docker Compose Support | 3.1 | 🟡 Enhancement |
| Virtual Threads | 3.2 | 🟢 Optional |
| SSL Bundle Reloading | 3.2 | 🟡 Enhancement |
| RestClient | 3.2 | 🟡 Enhancement |
| Structured Logging | 3.4 | 🟡 Enhancement |

### 5.2 HTTP Interfaces (Declarative HTTP Clients)

```java
// Define interface
public interface UserApiClient {

    @GetExchange("/users/{id}")
    User getUser(@PathVariable Long id);

    @GetExchange("/users")
    List<User> getAllUsers(@RequestParam("page") int page);

    @PostExchange("/users")
    User createUser(@RequestBody CreateUserRequest request);

    @DeleteExchange("/users/{id}")
    void deleteUser(@PathVariable Long id);
}

// Configuration
@Configuration
public class HttpClientConfig {

    @Bean
    UserApiClient userApiClient(RestClient.Builder builder) {
        RestClient restClient = builder
            .baseUrl("https://api.example.com")
            .defaultHeader("Authorization", "Bearer ${token}")
            .build();

        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()
            .createClient(UserApiClient.class);
    }
}

// Usage
@Service
public class UserService {
    private final UserApiClient client;

    public User getUser(Long id) {
        return client.getUser(id);  // Clean, type-safe call
    }
}
```

### 5.3 Problem Details (RFC 7807)

```java
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleUserNotFound(UserNotFoundException ex, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("User Not Found");
        problem.setType(URI.create("https://api.example.com/errors/user-not-found"));
        problem.setProperty("userId", ex.getUserId());
        problem.setProperty("timestamp", Instant.now());
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }

    @ExceptionHandler(ValidationException.class)
    public ProblemDetail handleValidation(ValidationException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.BAD_REQUEST, "Validation failed");
        problem.setProperty("errors", ex.getErrors());
        return problem;
    }
}
```

**Response Example:**
```json
{
  "type": "https://api.example.com/errors/user-not-found",
  "title": "User Not Found",
  "status": 404,
  "detail": "User not found with id: 123",
  "instance": "/api/users/123",
  "userId": 123,
  "timestamp": "2026-01-28T03:00:00Z"
}
```

### 5.4 RestClient (Spring Boot 3.2+)

```java
@Configuration
public class RestClientConfig {

    @Bean
    RestClient restClient(RestClient.Builder builder) {
        return builder
            .baseUrl("https://api.example.com")
            .requestInterceptor(new LoggingInterceptor())
            .defaultStatusHandler(
                status -> status.is4xxClientError(),
                (request, response) -> {
                    throw new ApiException("Client error: " + response.getStatusCode());
                })
            .build();
    }
}

@Service
public class ProductService {
    private final RestClient restClient;

    public Product getProduct(Long id) {
        return restClient.get()
            .uri("/products/{id}", id)
            .retrieve()
            .body(Product.class);
    }

    public List<Product> searchProducts(String query) {
        return restClient.get()
            .uri(uriBuilder -> uriBuilder
                .path("/products/search")
                .queryParam("q", query)
                .build())
            .retrieve()
            .body(new ParameterizedTypeReference<>() {});
    }
}
```

---

## 6. Migration to Spring Boot 3

### 6.1 Migration Checklist

```
┌─────────────────────────────────────────────────────────────┐
│                   Migration Roadmap                         │
├─────────────────────────────────────────────────────────────┤
│  Step 1: Upgrade Java to 17+                                │
│    └── Update JAVA_HOME, CI/CD, Dockerfiles                 │
│                                                             │
│  Step 2: Update to Spring Boot 2.7.x (last 2.x)             │
│    └── Fix all deprecation warnings                         │
│                                                             │
│  Step 3: Replace javax.* → jakarta.*                        │
│    └── Use IDE migration tools or OpenRewrite               │
│                                                             │
│  Step 4: Update to Spring Boot 3.x                          │
│    └── Fix breaking changes                                 │
│                                                             │
│  Step 5: Update dependencies                                │
│    └── Hibernate 6, Jackson, etc.                           │
│                                                             │
│  Step 6: Test thoroughly                                    │
│    └── Unit, Integration, E2E tests                         │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 javax to jakarta Migration

```diff
// Persistence
- import javax.persistence.*;
+ import jakarta.persistence.*;

// Validation
- import javax.validation.constraints.*;
+ import jakarta.validation.constraints.*;

// Servlet API
- import javax.servlet.*;
- import javax.servlet.http.*;
+ import jakarta.servlet.*;
+ import jakarta.servlet.http.*;

// Transactions
- import javax.transaction.Transactional;
+ import jakarta.transaction.Transactional;

// WebSocket
- import javax.websocket.*;
+ import jakarta.websocket.*;
```

**Using OpenRewrite (Automated):**
```xml
<plugin>
    <groupId>org.openrewrite.maven</groupId>
    <artifactId>rewrite-maven-plugin</artifactId>
    <version>5.20.0</version>
    <configuration>
        <activeRecipes>
            <recipe>org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_2</recipe>
        </activeRecipes>
    </configuration>
</plugin>
```

```bash
./mvnw rewrite:run
```

### 6.3 Security Configuration Changes

```java
// ❌ OLD (Spring Boot 2.x - Deprecated)
@Configuration
@EnableWebSecurity
public class OldSecurityConfig extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
                .antMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            .and()
            .formLogin();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService).passwordEncoder(passwordEncoder());
    }
}

// ✅ NEW (Spring Boot 3.x)
@Configuration
@EnableWebSecurity
public class NewSecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/public/**", "/actuator/health").permitAll()
                .requestMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .formLogin(Customizer.withDefaults())
            .oauth2Login(Customizer.withDefaults())
            .build();
    }

    @Bean
    UserDetailsService userDetailsService() {
        return new InMemoryUserDetailsManager(
            User.withDefaultPasswordEncoder()
                .username("user")
                .password("password")
                .roles("USER")
                .build()
        );
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### 6.4 Breaking Changes Quick Reference

| Area | Old (2.x) | New (3.x) |
|------|-----------|-----------|
| URL Matchers | `antMatchers()` | `requestMatchers()` |
| Trailing Slash | Auto-matched | Exact match only |
| Properties | `spring.data.redis.*` | `spring.data.redis.*` (some changed) |
| Actuator | `httptrace` | `httpexchanges` |
| Hibernate | 5.x | 6.x (query syntax changes) |

---

## 7. Spring Boot 4 Roadmap

> [!NOTE]
> Spring Boot 4 is expected alongside Spring Framework 7 in **late 2025/2026**.

### 7.1 Expected Features

| Feature | Description |
|---------|-------------|
| **Java 21+ Baseline** | Virtual threads, pattern matching, record patterns, sequenced collections |
| **Spring Framework 7** | Major framework update with breaking changes |
| **Kotlin 2.0+** | Enhanced Kotlin support with K2 compiler |
| **AOT First** | Ahead-of-time compilation as default |
| **Native Optimized** | Better GraalVM native image support |
| **Modular JDK** | Full Java module system support |

### 7.2 Preparing for Spring Boot 4

```java
// 1. Use Constructor Injection (Field injection may have AOT issues)
@Service
public class ModernService {
    private final Repository repository;
    
    // ✅ Constructor injection - AOT friendly
    public ModernService(Repository repository) {
        this.repository = repository;
    }
}

// 2. Avoid reflection-heavy patterns
// ❌ Avoid
@Autowired
private List<Handler> handlers;  // Reflection-based injection

// ✅ Prefer
public class HandlerRegistry {
    private final List<Handler> handlers;
    
    public HandlerRegistry(List<Handler> handlers) {
        this.handlers = List.copyOf(handlers);
    }
}

// 3. Use Records for DTOs (Native-friendly)
public record UserDTO(Long id, String name, String email) {}

// 4. Use Pattern Matching
public String describe(Object obj) {
    return switch (obj) {
        case String s -> "String: " + s;
        case Integer i when i > 0 -> "Positive: " + i;
        case null -> "null value";
        default -> "Unknown: " + obj;
    };
}
```

---

## 8. Interview Questions & Answers

### Testing Questions

---

**Q1: What is the difference between `@Mock` and `@MockBean`?**

| Aspect | @Mock | @MockBean |
|--------|-------|-----------|
| **Source** | Mockito | Spring Boot Test |
| **Context** | No Spring context | Replaces bean in Spring context |
| **Use Case** | Unit tests | Integration tests |
| **Speed** | Fast | Slower (loads context) |

```java
// @Mock - Pure unit test
@ExtendWith(MockitoExtension.class)
class UnitTest {
    @Mock UserRepository repo;  // Just a mock, no Spring
}

// @MockBean - Integration test
@WebMvcTest(UserController.class)
class IntegrationTest {
    @MockBean UserService service;  // Replaces real bean in context
}
```

---

**Q2: Explain the difference between `@WebMvcTest` and `@SpringBootTest`.**

| Aspect | @WebMvcTest | @SpringBootTest |
|--------|-------------|-----------------|
| **Scope** | MVC layer only | Full application |
| **Speed** | Fast (~1s) | Slow (~5-10s) |
| **Loads** | Controllers, Filters, Advice | Everything |
| **Database** | Not loaded | Loaded |
| **Use Case** | Controller unit tests | Full integration tests |

---

**Q3: How do you test a private method in Spring Boot?**

> [!CAUTION]
> If you need to test private methods, it's often a **design smell**. Consider refactoring.

**Options:**
1. **Refactor to package-private** - Better testability
2. **Test through public methods** - Preferred approach
3. **Use reflection** (last resort):
   ```java
   Method method = MyClass.class.getDeclaredMethod("privateMethod", String.class);
   method.setAccessible(true);
   Object result = method.invoke(instance, "arg");
   ```

---

**Q4: What is `@Transactional` in tests? Does it roll back?**

```java
@DataJpaTest
class RepositoryTest {
    
    @Test
    @Transactional  // Default: rolls back after test
    void testSave() {
        repo.save(entity);
        // Changes are rolled back - database stays clean
    }
    
    @Test
    @Transactional
    @Commit  // Override: Actually commit changes
    void testThatNeedsCommit() {
        repo.save(entity);
        // Changes persist
    }
}
```

---

### Spring Boot 3 Questions

---

**Q5: What is the biggest breaking change in Spring Boot 3?**

The **Jakarta EE 9 namespace migration** (`javax.*` → `jakarta.*`) is the most impactful change because:
- Affects imports in every file using JPA, Validation, Servlet APIs
- Requires updating all third-party libraries to Jakarta-compatible versions
- Cannot be mixed with `javax.*` packages

---

**Q6: Explain Problem Details (RFC 7807).**

Problem Details provides a **standardized error response format**:

```json
{
  "type": "https://example.com/problems/insufficient-funds",
  "title": "Insufficient Funds",
  "status": 400,
  "detail": "Account 12345 has insufficient funds for withdrawal of $100",
  "instance": "/transactions/12345"
}
```

**Benefits:**
- Consistent error format across APIs
- Machine-readable error types via URIs
- Extensible with custom properties

---

**Q7: What are Virtual Threads and when should you use them?**

```java
// Enable virtual threads
spring.threads.virtual.enabled=true
```

**When to use:**
- ✅ High-concurrency I/O-bound workloads
- ✅ Blocking operations (JDBC, HTTP calls)
- ✅ Existing blocking code (no need for reactive rewrite)

**When NOT to use:**
- ❌ CPU-intensive computations
- ❌ Already using reactive (WebFlux)
- ❌ Code with thread-local assumptions

---

**Q8: How do you create a declarative HTTP client in Spring Boot 3?**

```java
interface ProductClient {
    @GetExchange("/products/{id}")
    Product getProduct(@PathVariable String id);
}

@Configuration
class ClientConfig {
    @Bean
    ProductClient productClient(RestClient.Builder builder) {
        RestClient client = builder.baseUrl("https://api.example.com").build();
        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(client))
            .build()
            .createClient(ProductClient.class);
    }
}
```

---

### Migration Questions

---

**Q9: How would you approach migrating a large Spring Boot 2.x application to 3.x?**

**Strategy:**
1. **Preparation Phase:**
   - Update to Spring Boot 2.7.x (latest 2.x)
   - Fix all deprecation warnings
   - Ensure 80%+ test coverage

2. **Migration Phase:**
   - Upgrade Java to 17+
   - Use OpenRewrite for automated migration
   - Update all dependencies to Jakarta-compatible versions

3. **Testing Phase:**
   - Run full test suite
   - Performance testing
   - Security scanning

4. **Gradual Rollout:**
   - Deploy to staging
   - Canary deployment to production
   - Monitor for issues

---

**Q10: What tools can help automate Spring Boot 3 migration?**

1. **OpenRewrite** - Automated code migration
   ```bash
   ./mvnw org.openrewrite.maven:rewrite-maven-plugin:run \
     -Drewrite.activeRecipes=org.openrewrite.java.spring.boot3.UpgradeSpringBoot_3_2
   ```

2. **Spring Boot Migrator** - CLI tool from Spring
   ```bash
   spring boot upgrade
   ```

3. **IntelliJ IDEA** - Built-in migration assistant
   - Refactor → Migrate Packages and Classes

---

## 9. Advanced Testing Topics

### 9.1 Testing Spring Security

```java
@WebMvcTest(AdminController.class)
@Import(SecurityConfig.class)
class AdminControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminService adminService;

    @Test
    void shouldDenyAccessToUnauthenticatedUsers() throws Exception {
        mockMvc.perform(get("/admin/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "USER")
    void shouldDenyAccessToNonAdminUsers() throws Exception {
        mockMvc.perform(get("/admin/dashboard"))
            .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin", roles = "ADMIN")
    void shouldAllowAccessToAdminUsers() throws Exception {
        when(adminService.getDashboard()).thenReturn(new Dashboard());

        mockMvc.perform(get("/admin/dashboard"))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "customUser")
    void shouldReturnCurrentUserInfo() throws Exception {
        mockMvc.perform(get("/api/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.username").value("customUser"));
    }
}
```

**Custom Security Context:**
```java
@Retention(RetentionPolicy.RUNTIME)
@WithSecurityContext(factory = WithCustomUserSecurityContextFactory.class)
public @interface WithCustomUser {
    String username() default "testuser";
    String[] roles() default {"USER"};
    long userId() default 1L;
}

public class WithCustomUserSecurityContextFactory 
    implements WithSecurityContextFactory<WithCustomUser> {

    @Override
    public SecurityContext createSecurityContext(WithCustomUser annotation) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        
        CustomUserDetails principal = new CustomUserDetails(
            annotation.userId(), 
            annotation.username(), 
            annotation.roles()
        );
        
        Authentication auth = new UsernamePasswordAuthenticationToken(
            principal, null, principal.getAuthorities());
        
        context.setAuthentication(auth);
        return context;
    }
}

// Usage
@Test
@WithCustomUser(username = "john", roles = {"ADMIN"}, userId = 42L)
void shouldAccessUserSpecificResource() throws Exception {
    mockMvc.perform(get("/api/users/42/settings"))
        .andExpect(status().isOk());
}
```

### 9.2 Testing Async/Reactive Code

**Testing @Async Methods:**
```java
@SpringBootTest
@EnableAsync
class AsyncServiceTest {

    @Autowired
    private AsyncService asyncService;

    @Test
    void shouldProcessAsynchronously() throws Exception {
        // Act
        CompletableFuture<String> future = asyncService.processAsync("data");

        // Assert - Wait for completion with timeout
        String result = future.get(5, TimeUnit.SECONDS);
        assertThat(result).isEqualTo("processed: data");
    }

    @Test
    void shouldHandleAsyncExceptions() {
        CompletableFuture<String> future = asyncService.failingAsync();

        assertThatThrownBy(() -> future.get(5, TimeUnit.SECONDS))
            .hasCauseInstanceOf(BusinessException.class);
    }
}
```

**Testing WebFlux (Reactive):**
```java
@WebFluxTest(ReactiveUserController.class)
class ReactiveUserControllerTest {

    @Autowired
    private WebTestClient webClient;

    @MockBean
    private ReactiveUserService userService;

    @Test
    void shouldReturnUser() {
        User user = new User(1L, "Reactive", "reactive@test.com");
        when(userService.findById(1L)).thenReturn(Mono.just(user));

        webClient.get()
            .uri("/api/users/1")
            .exchange()
            .expectStatus().isOk()
            .expectBody()
            .jsonPath("$.name").isEqualTo("Reactive");
    }

    @Test
    void shouldStreamUsers() {
        Flux<User> users = Flux.just(
            new User(1L, "User1", "user1@test.com"),
            new User(2L, "User2", "user2@test.com")
        );
        when(userService.findAll()).thenReturn(users);

        webClient.get()
            .uri("/api/users")
            .accept(MediaType.APPLICATION_NDJSON)
            .exchange()
            .expectStatus().isOk()
            .expectBodyList(User.class)
            .hasSize(2);
    }
}
```

### 9.3 Testing Kafka/Messaging

```java
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = {"orders"})
class OrderEventProducerTest {

    @Autowired
    private OrderEventProducer producer;

    @Autowired
    private EmbeddedKafkaBroker embeddedKafka;

    private Consumer<String, String> consumer;

    @BeforeEach
    void setUp() {
        Map<String, Object> configs = KafkaTestUtils.consumerProps(
            "test-group", "true", embeddedKafka);
        consumer = new DefaultKafkaConsumerFactory<>(
            configs, new StringDeserializer(), new StringDeserializer()
        ).createConsumer();
        consumer.subscribe(List.of("orders"));
    }

    @AfterEach
    void tearDown() {
        consumer.close();
    }

    @Test
    void shouldPublishOrderEvent() {
        // Act
        producer.sendOrderCreatedEvent(new Order(1L, "Product", 99.99));

        // Assert
        ConsumerRecords<String, String> records = 
            KafkaTestUtils.getRecords(consumer, Duration.ofSeconds(10));
        
        assertThat(records.count()).isEqualTo(1);
        assertThat(records.iterator().next().value())
            .contains("\"orderId\":1");
    }
}
```

### 9.4 Testing Scheduled Jobs

```java
@SpringBootTest
class ScheduledJobTest {

    @SpyBean
    private ReportScheduler reportScheduler;

    @Autowired
    private TaskScheduler taskScheduler;

    @Test
    void shouldExecuteScheduledJob() throws Exception {
        // Wait for scheduled execution (or trigger manually)
        Thread.sleep(2000);  // Not ideal - prefer Awaitility

        verify(reportScheduler, atLeastOnce()).generateDailyReport();
    }

    // Better approach with Awaitility
    @Test
    void shouldExecuteScheduledJobWithAwaitility() {
        await()
            .atMost(Duration.ofSeconds(5))
            .untilAsserted(() -> 
                verify(reportScheduler, atLeastOnce()).generateDailyReport()
            );
    }
}
```

### 9.5 Contract Testing with Spring Cloud Contract

**Producer Side (Generating Stubs):**
```groovy
// src/test/resources/contracts/user/findUser.groovy
Contract.make {
    description "should return user by id"
    request {
        method GET()
        url "/api/users/1"
    }
    response {
        status 200
        headers {
            contentType applicationJson()
        }
        body([
            id: 1,
            name: "John Doe",
            email: "john@example.com"
        ])
    }
}
```

**Consumer Side (Using Stubs):**
```java
@SpringBootTest
@AutoConfigureStubRunner(
    stubsMode = StubRunnerProperties.StubsMode.LOCAL,
    ids = "com.example:user-service:+:stubs:8080"
)
class UserClientContractTest {

    @Autowired
    private UserClient userClient;

    @Test
    void shouldGetUserFromStub() {
        User user = userClient.getUser(1L);

        assertThat(user.getName()).isEqualTo("John Doe");
        assertThat(user.getEmail()).isEqualTo("john@example.com");
    }
}
```

---

## 10. Additional Interview Questions & Answers

### Scenario-Based Questions

---

**Q11: You have a flaky integration test that fails randomly. How do you debug it?**

**Debugging Strategy:**
1. **Identify the pattern:**
   - Run test 50+ times to find failure rate
   - Check if failures correlate with time of day, CI load, etc.

2. **Common causes and fixes:**
   ```java
   // ❌ Problem: Race condition in async test
   @Test
   void flakyTest() {
       service.processAsync();
       assertThat(repo.count()).isEqualTo(1);  // May not be saved yet!
   }

   // ✅ Fix: Use Awaitility
   @Test
   void stableTest() {
       service.processAsync();
       await()
           .atMost(Duration.ofSeconds(5))
           .untilAsserted(() -> assertThat(repo.count()).isEqualTo(1));
   }
   ```

3. **Other common fixes:**
   - Add `@DirtiesContext` if tests pollute shared state
   - Use `@Transactional` for DB cleanup
   - Increase timeouts for slow CI environments
   - Ensure deterministic test data (avoid `UUID.randomUUID()` in assertions)

---

**Q12: How would you test a method that makes external HTTP calls?**

**Approach 1: WireMock (Preferred for Integration Tests)**
```java
@SpringBootTest
@AutoConfigureWireMock(port = 0)
class ExternalApiServiceTest {

    @Autowired
    private ExternalApiService service;

    @Value("${wiremock.server.port}")
    private int wireMockPort;

    @DynamicPropertySource
    static void configure(DynamicPropertyRegistry registry) {
        registry.add("external.api.url", () -> "http://localhost:${wiremock.server.port}");
    }

    @Test
    void shouldCallExternalApi() {
        // Arrange - Stub external API
        stubFor(get(urlPathEqualTo("/products/123"))
            .willReturn(aResponse()
                .withHeader("Content-Type", "application/json")
                .withBody("""
                    {"id": 123, "name": "Widget", "price": 29.99}
                    """)));

        // Act
        Product product = service.getProduct(123L);

        // Assert
        assertThat(product.getName()).isEqualTo("Widget");
        verify(getRequestedFor(urlPathEqualTo("/products/123")));
    }

    @Test
    void shouldHandleExternalApiTimeout() {
        stubFor(get(anyUrl())
            .willReturn(aResponse().withFixedDelay(5000)));

        assertThatThrownBy(() -> service.getProduct(1L))
            .isInstanceOf(TimeoutException.class);
    }
}
```

**Approach 2: MockRestServiceServer (For RestTemplate)**
```java
@SpringBootTest
class RestTemplateServiceTest {

    @Autowired
    private MyService service;

    @Autowired
    private RestTemplate restTemplate;

    private MockRestServiceServer mockServer;

    @BeforeEach
    void setUp() {
        mockServer = MockRestServiceServer.createServer(restTemplate);
    }

    @Test
    void shouldMockRestTemplateCall() {
        mockServer.expect(requestTo("/api/data"))
            .andRespond(withSuccess("{\"result\": \"ok\"}", MediaType.APPLICATION_JSON));

        String result = service.fetchData();

        assertThat(result).isEqualTo("ok");
        mockServer.verify();
    }
}
```

---

**Q13: What's wrong with this test? (Code Review Question)**

```java
@SpringBootTest
class BadTestExample {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private UserRepository userRepository;
    
    @Test
    void testUserOperations() {
        // Create user
        User user = userService.create(new CreateUserRequest("John", "john@test.com"));
        assertThat(user.getId()).isNotNull();
        
        // Update user
        user.setName("Jane");
        userService.update(user);
        
        // Find user
        User found = userService.findById(user.getId());
        assertThat(found.getName()).isEqualTo("Jane");
        
        // Delete user
        userService.delete(user.getId());
        assertThat(userRepository.count()).isEqualTo(0);
    }
}
```

**Problems:**
1. **Testing multiple things** - Should be separate tests
2. **No isolation** - Depends on database state
3. **Brittle assertion** - `count() == 0` assumes empty DB
4. **Missing @Transactional** - No cleanup after test
5. **Tests CRUD, not behavior** - Focus on business logic

**Better Version:**
```java
@SpringBootTest
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Test
    void shouldCreateUser() {
        User user = userService.create(new CreateUserRequest("John", "john@test.com"));
        
        assertThat(user.getId()).isNotNull();
        assertThat(user.getName()).isEqualTo("John");
    }

    @Test
    void shouldUpdateUserName() {
        User user = userService.create(new CreateUserRequest("John", "john@test.com"));
        
        user.setName("Jane");
        userService.update(user);
        
        User found = userService.findById(user.getId());
        assertThat(found.getName()).isEqualTo("Jane");
    }

    @Test
    void shouldThrowWhenDeletingNonExistentUser() {
        assertThatThrownBy(() -> userService.delete(999L))
            .isInstanceOf(UserNotFoundException.class);
    }
}
```

---

**Q14: Design a testing strategy for a microservices-based e-commerce system.**

```
┌─────────────────────────────────────────────────────────────┐
│              MICROSERVICES TESTING STRATEGY                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Level 1: UNIT TESTS (70% of tests)                         │
│  ├── Mockito for dependencies                               │
│  ├── Fast execution (<100ms per test)                       │
│  └── Run on every commit                                    │
│                                                             │
│  Level 2: COMPONENT TESTS (20% of tests)                    │
│  ├── @WebMvcTest for controllers                            │
│  ├── @DataJpaTest for repositories                          │
│  ├── Testcontainers for databases                           │
│  └── Run on every PR                                        │
│                                                             │
│  Level 3: CONTRACT TESTS                                    │
│  ├── Spring Cloud Contract                                  │
│  ├── Pact for cross-language services                       │
│  ├── Consumer-driven contracts                              │
│  └── Run on every PR                                        │
│                                                             │
│  Level 4: INTEGRATION TESTS (10% of tests)                  │
│  ├── @SpringBootTest with real dependencies                 │
│  ├── WireMock for external APIs                             │
│  ├── Testcontainers (Kafka, Redis, Postgres)                │
│  └── Run nightly / before release                           │
│                                                             │
│  Level 5: E2E TESTS (Few, High Value)                       │
│  ├── Critical user journeys only                            │
│  ├── Staging environment                                    │
│  └── Run before production deployment                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Key Principles:**
- Each microservice has independent tests
- Use contract tests to verify inter-service communication
- Prefer Testcontainers over shared test environments
- Mock external third-party services (payment gateways, etc.)

---

**Q15: How do you test database migrations? (Flyway/Liquibase)**

```java
@SpringBootTest
@Testcontainers
class DatabaseMigrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    private Flyway flyway;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void shouldApplyAllMigrations() {
        // Verify migrations ran successfully
        MigrationInfo[] applied = flyway.info().applied();
        assertThat(applied).isNotEmpty();
        
        // Verify expected schema
        List<String> tables = jdbcTemplate.queryForList(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
            String.class
        );
        
        assertThat(tables).contains("users", "orders", "products");
    }

    @Test
    void shouldHaveExpectedColumns() {
        List<Map<String, Object>> columns = jdbcTemplate.queryForList("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            """);

        assertThat(columns)
            .extracting(m -> m.get("column_name"))
            .contains("id", "name", "email", "created_at");
    }
}
```

---

**Q16: Explain the differences between `@BeforeEach`, `@BeforeAll`, and `@TestInstance`.**

| Annotation | Scope | Instance | Use Case |
|------------|-------|----------|----------|
| `@BeforeEach` | Each test | New instance each test | Reset test state |
| `@BeforeAll` | Once per class | Requires static method | Expensive setup |
| `@TestInstance(Lifecycle.PER_CLASS)` | N/A | Single instance | Use `@BeforeAll` non-static |

```java
// Default: New instance per test
class StandardTest {
    
    private int counter = 0;
    
    @BeforeAll
    static void setUpClass() {
        // MUST be static (default lifecycle)
    }
    
    @BeforeEach
    void setUp() {
        counter = 0;  // Reset for each test
    }
    
    @Test
    void test1() { counter++; }  // counter = 1
    
    @Test
    void test2() { counter++; }  // counter = 1 (fresh instance)
}

// Single instance per class
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SharedInstanceTest {
    
    private int counter = 0;
    
    @BeforeAll
    void setUpClass() {
        // Can be non-static now
        counter = 0;
    }
    
    @Test
    void test1() { counter++; }  // counter = 1
    
    @Test
    void test2() { counter++; }  // counter = 2 (same instance!)
}
```

---

**Q17: How do you handle test data setup for complex entity graphs?**

**Option 1: Test Data Builders (Recommended)**
```java
public class UserTestBuilder {
    private String name = "Default User";
    private String email = "default@test.com";
    private List<Order> orders = new ArrayList<>();

    public static UserTestBuilder aUser() {
        return new UserTestBuilder();
    }

    public UserTestBuilder withName(String name) {
        this.name = name;
        return this;
    }

    public UserTestBuilder withOrders(Order... orders) {
        this.orders = List.of(orders);
        return this;
    }

    public User build() {
        User user = new User(null, name, email);
        orders.forEach(user::addOrder);
        return user;
    }
}

// Usage
@Test
void shouldCalculateTotalOrders() {
    User user = aUser()
        .withName("Big Spender")
        .withOrders(
            anOrder().withAmount(100).build(),
            anOrder().withAmount(200).build()
        )
        .build();

    assertThat(user.getTotalOrderAmount()).isEqualTo(300);
}
```

**Option 2: Object Mother Pattern**
```java
public class TestData {
    
    public static User createStandardUser() {
        return new User(null, "Standard User", "user@test.com");
    }
    
    public static User createAdminUser() {
        User admin = new User(null, "Admin", "admin@test.com");
        admin.setRole(Role.ADMIN);
        return admin;
    }
    
    public static Order createOrderFor(User user) {
        return new Order(null, user, BigDecimal.valueOf(99.99));
    }
}
```

---

**Q18: What is `@DirtiesContext` and when should you use it?**

```java
@DirtiesContext
```

**What it does:** Tells Spring to destroy and recreate the application context after the test.

**When to use:**
- ✅ Test modifies static state or singletons
- ✅ Test changes bean configuration
- ✅ Test pollutes shared resources (caches, message queues)

**When to avoid:**
- ❌ Regular tests (slows everything down massively)
- ❌ Tests that can use `@Transactional` for DB cleanup

```java
@SpringBootTest
class CacheTest {

    @Autowired
    private CacheManager cacheManager;

    @Test
    @DirtiesContext(methodMode = MethodMode.AFTER_METHOD)
    void testThatPollutesCache() {
        cacheManager.getCache("users").put("key", "polluted-value");
        // Context will be recreated after this test
    }

    @Test
    void testThatNeedsCleanCache() {
        // Safe - runs with fresh context
        assertThat(cacheManager.getCache("users").get("key")).isNull();
    }
}
```

---

**Q19: How do you test time-dependent code?**

**Use Java Time API with Clock injection:**
```java
@Service
public class SubscriptionService {
    private final Clock clock;
    private final SubscriptionRepository repo;

    public SubscriptionService(Clock clock, SubscriptionRepository repo) {
        this.clock = clock;
        this.repo = repo;
    }

    public boolean isExpired(Subscription sub) {
        return sub.getExpiryDate().isBefore(LocalDate.now(clock));
    }
}

// Production config
@Configuration
class ClockConfig {
    @Bean
    Clock clock() {
        return Clock.systemDefaultZone();
    }
}

// Test
@SpringBootTest
class SubscriptionServiceTest {

    @MockBean
    private Clock clock;

    @Autowired
    private SubscriptionService service;

    @Test
    void shouldDetectExpiredSubscription() {
        // Fix the clock to a specific date
        Clock fixedClock = Clock.fixed(
            Instant.parse("2026-01-28T00:00:00Z"), 
            ZoneId.of("UTC")
        );
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());

        Subscription sub = new Subscription(LocalDate.of(2026, 1, 27));

        assertThat(service.isExpired(sub)).isTrue();
    }
}
```

---

**Q20: What's the difference between `verify()` and `assertThat()`?**

| Aspect | `verify()` (Mockito) | `assertThat()` (AssertJ) |
|--------|----------------------|--------------------------|
| **Purpose** | Check method was called | Check values/state |
| **Target** | Mock objects | Any objects |
| **Focus** | Behavior verification | State verification |

```java
@Test
void example() {
    // Arrange
    when(userRepo.findById(1L)).thenReturn(Optional.of(new User(1L, "John")));

    // Act
    User result = userService.findById(1L);

    // AssertJ - Verify the RESULT is correct
    assertThat(result.getName()).isEqualTo("John");

    // Mockito verify - Verify the mock was CALLED correctly
    verify(userRepo).findById(1L);
    verify(emailService, never()).sendNotification(any());
}
```

**Rule of thumb:**
- Use `assertThat()` for **what** the result is
- Use `verify()` for **how** collaborators were used

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                 SPRING BOOT TESTING CHEATSHEET              │
├─────────────────────────────────────────────────────────────┤
│ UNIT TESTS                                                  │
│   @ExtendWith(MockitoExtension.class)                       │
│   @Mock, @InjectMocks, @Captor                              │
│   when().thenReturn(), verify()                             │
├─────────────────────────────────────────────────────────────┤
│ SLICE TESTS                                                 │
│   @WebMvcTest(Controller.class) - REST layer only           │
│   @DataJpaTest - JPA repositories only                      │
│   @MockBean - Replace bean in context                       │
├─────────────────────────────────────────────────────────────┤
│ INTEGRATION TESTS                                           │
│   @SpringBootTest(webEnvironment = RANDOM_PORT)             │
│   @Testcontainers + @Container + @ServiceConnection         │
│   TestRestTemplate for HTTP calls                           │
├─────────────────────────────────────────────────────────────┤
│ SPRING BOOT 3 KEY CHANGES                                   │
│   javax.* → jakarta.*                                       │
│   antMatchers() → requestMatchers()                         │
│   WebSecurityConfigurerAdapter → SecurityFilterChain bean   │
│   Virtual Threads: spring.threads.virtual.enabled=true      │
└─────────────────────────────────────────────────────────────┘
```

---

*Last Updated: January 2026*
