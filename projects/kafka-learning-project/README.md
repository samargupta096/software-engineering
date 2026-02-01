# Kafka Learning Project

A comprehensive Spring Boot project demonstrating Apache Kafka use cases with real-world patterns.

## Prerequisites

- Java 21+
- Docker & Docker Compose
- Gradle 8.x

## Quick Start

### 1. Start Kafka (KRaft Mode)
```bash
docker-compose up -d
```

### 2. Run the Application
```bash
./gradlew bootRun
```

### 3. Access Kafka UI
Open http://localhost:8080 to view topics, messages, and consumer groups.

## Project Structure

```
src/main/java/com/learning/kafka/
├── KafkaLearningApplication.java    # Main application
├── config/                          # Kafka configurations
├── producer/                        # Producer examples
├── consumer/                        # Consumer examples
├── model/                           # Event models
└── usecases/                        # Real-world use cases
```

## Use Cases Demonstrated

| # | Use Case | Description |
|---|----------|-------------|
| 1 | Basic Producer/Consumer | Simple message production and consumption |
| 2 | Idempotent Producer | Duplicate prevention with `enable.idempotence=true` |
| 3 | Transactional Producer | Atomic writes across multiple topics |
| 4 | Consumer Groups | Partition assignment and rebalancing |
| 5 | Dead Letter Queue | Error handling with retry and DLQ |
| 6 | Event Sourcing | Event store pattern with replay |

## API Endpoints

```bash
# Send order event
POST /api/orders
{"orderId": "ORD-001", "userId": "user-123", "amount": 99.99}

# Send with idempotent producer
POST /api/orders/idempotent

# Send transactional (order + payment)
POST /api/orders/transactional

# Trigger event sourcing demo
POST /api/accounts/{accountId}/deposit
{"amount": 100.00}
```

## Configuration

### Local (default)
```yaml
spring.kafka.bootstrap-servers: localhost:9092
```

### AWS MSK
```bash
./gradlew bootRun --args='--spring.profiles.active=aws'
```

## Testing

```bash
# Run integration tests (uses Testcontainers)
./gradlew test
```
