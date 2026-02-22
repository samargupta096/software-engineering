# Redis Deep-Dive: Internals, Architecture, and Java Integration

A comprehensive guide to mastering Redis, from its internal event loop to advanced clustering and Spring Boot integration.

## 1. Introduction & Redis Architecture

**Redis** (Remote Dictionary Server) is an open-source, in-memory data structure store, used as a database, cache, and message broker. It is famous for its sub-millisecond latency and richness of data types.

### Why is Redis so fast? (The Secret Sauce)
1.  **In-Memory Storage**: All data resides in RAM (Random Access Memory). RAM access is orders of magnitude faster than disk access (nanoseconds vs. milliseconds).
2.  **Single-Threaded Event Loop**: Redis uses a single thread for processing commands. This eliminates context switching, race conditions, and lock overheads associated with multi-threaded systems.
    - *Note*: Redis 6.0 introduced threaded I/O (for reading/writing to sockets), but the command execution loop remains single-threaded.
3.  **Non-Blocking I/O**: It uses I/O multiplexing (like `epoll` on Linux, `kqueue` on BSD) to handle thousands of connections concurrently.
4.  **Efficient Data Structures**: Redis data structures are optimized for performance and memory efficiency (e.g., using ziplists for small hashes).

### The Redis Protocol (RESP)
Redis clients communicate using **RESP** (Redis Serialization Protocol). It is human-readable and easy to parse.
- **Simple Strings**: `+OK\r\n`
- **Errors**: `-Error message\r\n`
- **Integers**: `:1000\r\n`
- **Bulk Strings**: `$6\r\nfoobar\r\n`
- **Arrays**: `*2\r\n$3\r\nfoo\r\n$3\r\nbar\r\n`

---

## 2. Internal Data Structures

Understanding how Redis stores data is key to optimization.

### Simple Dynamic String (SDS)
Redis does not use C-style null-terminated strings (`char*`). Instead, it uses SDS.
- **O(1) Length**: SDS stores the length, so `STRLEN` is O(1).
- **Binary Safe**: Can store any data (including null characters).
- **Buffer Pre-allocation**: Reduces memory reallocations when appending strings.

### The `server.db` and `dict`
Redis uses a specialized Hash Table implementation (`dict`) for the main key-space.
- **Incremental Rehashing**: When the hash table grows, Redis moves keys from the old table to the new one incrementally (one bucket per cron tick or command) to avoid blocking the server for a long time.

### Optimized Container Types
To save memory, Redis wraps user data types in optimized internal structures:

| User Data Type | Underlying Internal Structure (Encoding) |
| :--- | :--- |
| **String** | `int` (if integer), `embstr` (embedded SDS), `raw` (SDS) |
| **List** | `quicklist` (linked list of ziplists) |
| **Hash** | `listpack` (compact array) for small hashes, `hashtable` for large ones |
| **Set** | `intset` (sorted array of ints), `hashtable` |
| **Sorted Set** | `listpack` (small), `skiplist` + `hashtable` (large) |

> **Skip List**: Redis uses Skip Lists for Sorted Sets (ZSET) to allow O(log N) search, insertion, and deletion, similar to balanced trees but simpler to implement.

---

## 3. Core Features & Commands

### Data Types
1.  **Strings**: Basic key-value (`SET`, `GET`, `INCR`, `SETNX`). Max 512MB.
2.  **Lists**: Doubly linked lists (`LPUSH`, `RPOP`, `BLPOP`). Good for queues.
3.  **Sets**: Unordered collection of unique strings (`SADD`, `SINTER`).
4.  **Hashes**: Key-value pairs within a key (`HSET`, `HGETALL`). Great for objects.
5.  **Sorted Sets (ZSet)**: Sets with scores (`ZADD`, `ZRANGE`). Leaderboards.
6.  **Bitmaps**: Bit-level operations (`SETBIT`, `BITCOUNT`). Analytics.
7.  **HyperLogLog**: Probabilistic cardinality estimation (`PFADD`). Unique visitors.
8.  **Geospatial**: Lat/Long data (`GEOADD`, `GEORADIUS`).
9.  **Streams**: Append-only log data structure (`XADD`, `XREAD`). Kafka-lite.

---

## 4. Persistence Mechanisms

Redis is in-memory, but supports persistence to disk.

### 1. RDB (Redis Database File)
Snapshots the dataset at specified intervals.
- **Pros**: Compact, fast recovery, good for backups.
- **Cons**: Potential data loss between snapshots.
- **Mechanism**: Redis `fork()`s a child process. The child writes the RDB file while the parent continues serving clients (Copy-On-Write).

### 2. AOF (Append Only File)
Logs every write command received.
- **Pros**: Higher durability (can fsync every second).
- **Cons**: Larger file size, slower replay on restart.
- **AOF Rewrite**: Reconstructs the AOF file in the background (bgrewriteaof) to reduce size.

### Hybrid Persistence
Redis 4.0+ can combine both: Use RDB for the preamble (fast loading) and AOF for recent writes.

---

## 5. Replication & High Availability

### Replication
- **Master-Replica**: Async replication. One master, multiple replicas.
- **Flow**: Replica sends `PSYNC`. Master sends RDB stream, then buffers new commands.
- **Use Case**: Read scaling, failover redundancy.

### Redis Sentinel
A distributed system to monitor and auto-failover Redis.
- **Monitoring**: Checks if Master is alive.
- **Notification**: Alerts admins.
- **Automatic Failover**: Promotes a replica to master if master fails.
- **Configuration Provider**: Clients connect to Sentinel to ask "Who is the current master?".

---

## 6. Redis Cluster

A distributed implementation of Redis with automatic sharding.

- **Sharding**: Key space is split into **16384 Hash Slots**.
- **Hashing Algorithm**: `CRC16(key) % 16384`.
- **Topologies**: All nodes talk to each other (Mesh) via Gossip Protocol.
- **Smart Clients**: Clients cache the slot map and route requests directly to the right node.
- **Redirection**: If a client calls the wrong node:
    - `MOVED`: Permanent redirect (Slot has moved).
    - `ASK`: Temporary redirect (Slot is migrating).

---

## 7. Memory Management

### Eviction Policies (`maxmemory-policy`)
When memory is full (`maxmemory` limit reached):
1.  `noeviction`: Returns error on write.
2.  `allkeys-lru`: Evicts least recently used keys (approximated).
3.  `volatile-lru`: LRU only for keys with TTL (expire set).
4.  `allkeys-random`: Random eviction.
5.  `volatile-ttl`: Evicts keys with shortest remaining TTL.
6.  `allkeys-lfu`: Least Frequently Used (Redis 4.0+).

### Key Expiration
- **Lazy**: Expired keys are removed when accessed.
- **Active`: Redis samples keys with TTL periodically and deletes expired ones.

---

## 8. Java Integration

We will use **Lettuce** (default in Spring Boot 2/3) and **Jedis**.

### Jedis (Simple, Synchronous)
Uses a thread-per-connection model. Not thread-safe (need a pool).

```java
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;

public class JedisExample {
    public static void main(String[] args) {
        JedisPool pool = new JedisPool("localhost", 6379);

        try (Jedis jedis = pool.getResource()) {
            // String Operations
            jedis.set("user:101", "Alice");
            String user = jedis.get("user:101"); 
            System.out.println("User: " + user);

            // Hash Map
            jedis.hset("session:xyz", "id", "101");
            jedis.hset("session:xyz", "browser", "Chrome");
            
            // List / Queue
            jedis.lpush("tasks", "task1", "task2");
            String task = jedis.rpop("tasks");
        }
        
        pool.close();
    }
}
```

### Lettuce (Advanced, Asynchronous)
Netty-based, thread-safe, supports Reactive Streams.

```java
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;

public class LettuceExample {
    public static void main(String[] args) {
        RedisClient redisClient = RedisClient.create("redis://localhost:6379/0");
        StatefulRedisConnection<String, String> connection = redisClient.connect();
        
        // Synchronous API
        RedisCommands<String, String> syncCommands = connection.sync();
        syncCommands.set("key", "Hello, Lettuce!");
        
        // Asynchronous API
        connection.async().get("key").thenAccept(System.out::println);
        
        connection.close();
        redisClient.shutdown();
    }
}
```

---

## 9. Spring Boot & Redis

Spring Data Redis provides a high-level abstraction.

### 1. Dependency
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

### 2. Configuration (`application.yml`)
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      # password: yourpassword
      lettuce:
        pool:
          max-active: 8
          max-idle: 8
```

### 3. Usage with `RedisTemplate`
Ideally, configure your own template for proper serialization (default uses JdkSerialization which is binary).

```java
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        
        // Use JSON for values
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();
        
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonSerializer);
        
        return template;
    }
}
```

### 4. Service Example
```java
@Service
public class UserService {
    
    private final RedisTemplate<String, Object> redisTemplate;

    public UserService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveUserSession(String sessionId, User user) {
        // Save user object as JSON to Redis
        redisTemplate.opsForValue().set("session:" + sessionId, user, Duration.ofMinutes(30));
    }

    public User getUserSession(String sessionId) {
        return (User) redisTemplate.opsForValue().get("session:" + sessionId);
    }
}
```

### 5. Caching Abstraction (`@Cacheable`)
Easily cache method results.

```java
@Service
public class ProductService {

    @Cacheable(value = "products", key = "#id")
    public Product getProductById(Long id) {
        simulateSlowDatabaseCall();
        return productRepository.findById(id).orElse(null);
    }

    @CacheEvict(value = "products", key = "#id")
    public void updateProduct(Long id, Product product) {
        productRepository.save(product);
    }
}
```
*Don't forget `@EnableCaching` in your main configuration.*

---

## 10. Advanced Concepts & Patterns

### 1. Distributed Locks (Redlock)
How to ensure only one service instance processes a job?
- **Logic**: `SET lock_key unique_id NX PX 30000`
- **Release**: Check if value == unique_id, then delete (Atomic Lua script).

### 2. Rate Limiter
Limit API requests (e.g., 100 req/min).
- **Fixed Window**: simple INCR + EXPIRE.
- **Sliding Window**: Using Sorted Sets (ZADD timestamp, ZREMRANGEBYSCORE to remove old).

### 3. Redis Streams (Consumers)
Powerful for event-driven architecture.
- **XADD**: Add event.
- **XGROUP**: Create consumer group.
- **XREADGROUP**: Read pending messages.
- **XACK**: Acknowledge processing.

---

## 11. Interview Questions (Q&A)

### Q1: Redis is single-threaded. How does it handle concurrent clients?
**A**: It uses I/O multiplexing (epoll) to handle network I/O. The actual command execution is single-threaded and extremely fast (microseconds). It essentially queues commands and executes them one by one.

### Q2: What is the difference between RDB and AOF?
**A**: RDB is a snapshot at intervals (fast restore, potential data loss). AOF logs every write (slower restore, minimal data loss). AOF is more durable.

### Q3: How does Redis handle memory evictions?
**A**: Via `maxmemory-policy`. Common ones are `allkeys-lru` (remove least recently used from all keys) and `volatile-lru` (only from keys with expiration).

### Q4: Distributed Lock implementation?
**A**: Use `SET resource_name my_random_value NX PX 30000`. NX ensures it's only set if not exists. PX sets TTL. To release, use a Lua script to check if the value matches before deleting (to avoid deleting someone else's lock).

### Q5: Redis Cluster vs Sentinel?
**A**: Sentinel provides high availability (HA) for a master-replica setup (failover). Cluster provides sharding (horizontal scaling) AND high availability. Use Cluster for large datasets (> RAM of one node).

### Q6: Can Redis be used as a primary database?
**A**: Yes, but mostly for specific use cases (Session store, Leaderboards). For complex relational data, it lacks joins and ACID transactions (though MULTI/EXEC exists, rollback isn't supported for errors inside).

### Q7: What is the 'Thundering Herd' problem in caching?
**A**: When a popular cache key expires, thousands of concurrent requests miss the cache and hit the DB simultaneously.
**Fix**: Mutex locks, or "Probabilistic Early Expiration" (refresh cache before it truly expires).

### Q8: Explain Redis Pipelining.
**A**: Pipelining allows a client to send multiple commands without waiting for replies, reducing RTT (Round Trip Time). The server executes them and sends all replies back in one go.
