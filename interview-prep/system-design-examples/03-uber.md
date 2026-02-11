[🏠 Home](../README.md) | [⬅️ 02 Twitter](./02-twitter.md) | [➡️ 04 WhatsApp](./04-whatsapp.md)

# 🚗 Uber System Design

> Design a ride-sharing platform for millions of drivers and riders

---

## ✅ Functional Requirements

| Feature | Description |
|---------|-------------|
| **Request Ride** | User requests pickup |
| **Match Driver** | Find nearby available drivers |
| **Real-time Tracking** | Live location updates |
| **Pricing** | Dynamic surge pricing |
| **Payments** | Handle transactions |

---

## 📊 Scale Estimation

- **Daily Rides**: 20 million
- **Active Drivers**: 5 million
- **Location Updates**: Every 3 seconds per driver

---

## 🏗️ High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients
        RIDER[Rider App]
        DRIVER[Driver App]
    end
    
    subgraph Services
        GW[API Gateway]
        RS[Ride Service]
        LS[Location Service]
        MS[Matching Service]
        PS[Pricing Service]
        PAY[Payment Service]
    end
    
    subgraph Data
        REDIS[(Redis - Location)]
        MYSQL[(MySQL)]
        KAFKA[Kafka]
    end
    
    Clients --> GW
    GW --> Services
    Services --> Data
```

---

## 📍 Location Tracking

### Driver Location Updates

```mermaid
flowchart LR
    DRIVER[Driver App] --> |Every 3s| WS[WebSocket Server]
    WS --> KAFKA[Kafka]
    KAFKA --> LS[Location Service]
    LS --> REDIS[(Redis with Geospatial)]
```

### Geospatial Indexing

**Option 1: Geohash (Used by Uber)**
```
Geohash divides world into grid cells
Example: "9q8yyk" → San Francisco area

Nearby drivers = Same prefix geohash
```

**Option 2: QuadTree**
```mermaid
flowchart TB
    WORLD[World] --> NW[NW]
    WORLD --> NE[NE]
    WORLD --> SW[SW]
    WORLD --> SE[SE]
    
    NW --> NW1[...]
    NW --> NW2[...]
```

### Redis Geospatial Commands
```redis
# Add driver location
GEOADD drivers:online 77.5946 12.9716 driver:123

# Find nearby drivers (5km radius)
GEORADIUS drivers:online 77.5946 12.9716 5 km
```

---

## 🔄 Ride Matching Flow

```mermaid
sequenceDiagram
    participant Rider
    participant API as API Gateway
    participant Match as Matching Service
    participant Location as Location Service
    participant Driver
    
    Rider->>API: Request Ride
    API->>Match: Find drivers
    Match->>Location: Get nearby drivers
    Location-->>Match: [driver1, driver2, driver3]
    Match->>Match: Rank by ETA, rating
    Match->>Driver: Send ride request
    Driver-->>Match: Accept
    Match-->>Rider: Driver assigned
```

### Matching Algorithm Factors

| Factor | Weight |
|--------|--------|
| **Distance** | ETA to pickup |
| **Driver Rating** | Quality score |
| **Acceptance Rate** | Reliability |
| **Car Type** | Match requested type |

---

## 💰 Dynamic Pricing (Surge)

```mermaid
flowchart LR
    subgraph Inputs
        D[Demand - Ride Requests]
        S[Supply - Available Drivers]
    end
    
    D --> ALGO[Pricing Algorithm]
    S --> ALGO
    ALGO --> SURGE[Surge Multiplier]
    
    SURGE --> |1.0x| NORMAL[Normal Pricing]
    SURGE --> |1.5x| MODERATE[Moderate Surge]
    SURGE --> |2.0x+| HIGH[High Surge]
```

---

## 🔄 Ride Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Requested : Rider requests ride
    Requested --> Matching : System finds drivers
    Matching --> Requested : No driver accepts (retry)
    Matching --> Matched : Driver accepts
    Matched --> DriverEnRoute : Driver heading to pickup
    DriverEnRoute --> Arrived : Driver at pickup
    Arrived --> InProgress : Rider boards, trip starts
    InProgress --> Completed : Reach destination
    Completed --> [*]

    Requested --> Cancelled : Rider cancels
    Matched --> Cancelled : Rider or driver cancels
    DriverEnRoute --> Cancelled : Rider cancels (fee applies)
    Cancelled --> [*]

    note right of Matching
        Nearby drivers found via
        Geohash / Redis GEORADIUS
    end note

    note right of InProgress
        Real-time location tracked
        Surge pricing locked in
    end note
```

---

## 💾 Database Schema

```sql
-- Rides
CREATE TABLE rides (
    ride_id UUID PRIMARY KEY,
    rider_id UUID,
    driver_id UUID,
    status ENUM('requested', 'matched', 'started', 'completed', 'cancelled'),
    pickup_location POINT,
    dropoff_location POINT,
    price_cents INT,
    surge_multiplier DECIMAL(3,2),
    created_at TIMESTAMP
);

-- Driver Locations (Redis primarily)
-- MySQL for historical data
CREATE TABLE driver_locations (
    driver_id UUID,
    location POINT,
    timestamp TIMESTAMP,
    INDEX (driver_id, timestamp)
);
```

---

## ⚡ Key Technologies

| Component | Technology |
|-----------|------------|
| **Real-time Communication** | WebSocket, MQTT |
| **Geospatial Index** | Redis, H3 (Uber's system) |
| **Event Streaming** | Kafka |
| **Maps & ETA** | Google Maps API |

---

## 📚 Key Takeaways

- Geospatial indexing is crucial for location-based matching
- WebSocket for real-time bidirectional communication
- Event-driven architecture for ride state changes
- Horizontal scaling with city-based sharding

---

*Uber processes 20M+ rides daily with this architecture.*
