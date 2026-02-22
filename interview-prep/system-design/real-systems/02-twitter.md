[🏠 Home](../../../README.md) | [⬅️ 01 OTT](./01-ott-platform.md) | [➡️ 03 Uber](./03-uber.md)

# 📱 Twitter System Design

> Design a social media platform with 500M+ users

---

## ✅ Functional Requirements

| Feature | Description |
|---------|-------------|
| **Post Tweet** | 280 character text + media |
| **Follow Users** | Follow/unfollow relationships |
| **Home Timeline** | Feed of followed users' tweets |
| **Search** | Find tweets and users |
| **Notifications** | Likes, retweets, mentions |

---

## 📊 Scale Estimation

- **Users**: 500 million
- **DAU**: 200 million
- **Tweets/day**: 500 million
- **Reads/Writes ratio**: 1000:1 (read-heavy)

---

## 🏗️ High-Level Architecture

```mermaid
flowchart TB
    subgraph Clients
        WEB[Web]
        MOBILE[Mobile]
    end
    
    subgraph Edge
        CDN[CDN]
        LB[Load Balancer]
    end
    
    subgraph Services
        GW[API Gateway]
        TS[Tweet Service]
        US[User Service]
        TL[Timeline Service]
        SS[Search Service]
        NS[Notification Service]
    end
    
    subgraph Data
        REDIS[(Redis Cache)]
        MYSQL[(MySQL)]
        ES[(Elasticsearch)]
        KAFKA[Kafka]
    end
    
    Clients --> CDN --> LB --> GW
    GW --> Services
    Services --> Data
```

---

## 🔥 The Timeline Problem

### Fan-out on Write (Push Model)

When user tweets, push to all followers' timelines.

```mermaid
flowchart LR
    USER[User Posts Tweet] --> KAFKA[Kafka]
    KAFKA --> FAN[Fanout Service]
    FAN --> TL1[(Follower 1 Timeline)]
    FAN --> TL2[(Follower 2 Timeline)]
    FAN --> TL3[(Follower N Timeline)]
```

**Pros:** Fast reads
**Cons:** Slow writes for celebrities (millions of followers)

### Fan-out on Read (Pull Model)

Fetch and merge tweets at read time.

```mermaid
flowchart LR
    USER[User Opens App] --> TL[Timeline Service]
    TL --> F1[(Following User 1 Tweets)]
    TL --> F2[(Following User 2 Tweets)]
    TL --> MERGE[Merge & Sort]
    MERGE --> RESULT[Timeline]
```

**Pros:** Fast writes
**Cons:** Slow reads

### Hybrid Approach (Twitter's Solution)

```mermaid
flowchart TB
    T[Tweet Posted]
    T --> CHECK{Celebrity?}
    CHECK -->|No: < 10K followers| PUSH[Fan-out on Write]
    CHECK -->|Yes: > 10K followers| STORE[Store Only]
    
    READ[Read Timeline] --> CACHE[Get from Cache]
    CACHE --> MERGE[Merge Celebrity Tweets]
    MERGE --> RESULT[Final Timeline]
```

---

## 💾 Database Design

### Users Table
```sql
CREATE TABLE users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    follower_count INT DEFAULT 0,
    following_count INT DEFAULT 0,
    created_at TIMESTAMP
);
```

### Tweets Table
```sql
CREATE TABLE tweets (
    tweet_id BIGINT PRIMARY KEY,
    user_id BIGINT,
    content VARCHAR(280),
    media_urls JSON,
    like_count INT DEFAULT 0,
    retweet_count INT DEFAULT 0,
    created_at TIMESTAMP,
    INDEX (user_id, created_at)
);
```

### Follows (Graph DB or Adjacency List)
```sql
CREATE TABLE follows (
    follower_id BIGINT,
    followee_id BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY (follower_id, followee_id)
);
```

### Timeline Cache (Redis)
```
user:{user_id}:timeline → [tweet_id1, tweet_id2, ...]
```

---

## ⚡ Key Optimizations

1. **Redis for Timeline Cache** - Pre-computed timelines
2. **Snowflake IDs** - Time-ordered, distributed ID generation
3. **Kafka for Async** - Fanout processing
4. **CDN for Media** - Image/video delivery
5. **Elasticsearch for Search** - Tweet and user search

---

## 🔄 Tweet Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Composing : User opens editor
    Composing --> Published : Submit tweet
    Published --> Visible : Passes content filter
    Published --> Flagged : Content filter catch
    Flagged --> Visible : Manual review OK
    Flagged --> Removed : Violates policy
    Visible --> Engagements : Like / Retweet / Reply
    Engagements --> Visible : Engagement recorded
    Visible --> Removed : User deletes
    Removed --> [*]

    note right of Published
        Fan-out triggered here
        (Push to follower timelines)
    end note

    note right of Visible
        Indexed in Elasticsearch
        Available in Search
    end note
```

---

## 📚 Key Takeaways

- Hybrid fan-out approach for best performance
- Separate concerns into microservices
- Heavy caching for read-heavy workloads
- Async processing for fan-out operations

---

*Reference design for social media at scale.*
