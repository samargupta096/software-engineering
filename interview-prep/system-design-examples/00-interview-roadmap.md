[🏠 Home](../README.md) | [➡️ 01 OTT Platform](./01-ott-platform.md)

# 🗺️ System Design Interview Roadmap

> A prioritized list of the most frequently asked System Design interview questions.

---

## 🚦 Status Legend
*   ✅ **Completed** - Detailed guide available in this repo
*   🔲 **Pending** - To be learned/designed

---

## 🏆 Tier 1: The "Must Know" (Frequency: High)
*These appear in almost every system design interview loop. Master these first.*

| Problem | Key Concepts | Status |
| :--- | :--- | :--- |
| **URL Shortener** (TinyURL) | Hashing, Encoding (Base62), ID Generation, Redirection (301 vs 302) | ✅ [Link](./06-url-shortener.md) |
| **Rate Limiter** | Token Bucket, Leaky Bucket, Sliding Window, Redis (Lua scripts), Distributed Counters | ✅ [Link](./07-rate-limiter.md) |
| **Unique ID Generator** | Snowflake ID,UUID, Database Tickets, Clock Synchronization (NTP) | 🔲 |
| **Web Crawler** | BFS, Politeness, DNS Resolution, Checkpointing, Bloom Filters (Dedup) | 🔲 |
| **Notification System** | Fan-out, Message Queues (Kafka/RabbitMQ), Push vs Pull, Retry Mechanisms | 🔲 |

---

## 📱 Tier 2: Application Design (Frequency: High)
*Building actual consumer products.*

| Problem | Key Concepts | Status |
| :--- | :--- | :--- |
| **Social Media Feed** (Twitter) | Fan-out on Write vs Read, Hybrid approach, User Timeline, Caching strategies | ✅ [Link](./02-twitter.md) |
| **Chat Application** (WhatsApp) | WebSockets, Long Polling, Presence (Heartbeats), Message Ordering (Seq ID), Encryption | ✅ [Link](./04-whatsapp.md) |
| **Video Streaming** (Netflix) | CDN, Adaptive Bitrate Streaming (HLS/DASH), Chunking, Transcoding | ✅ [Link](./05-netflix/01-system-design-interview.md) |
| **Ride Sharing** (Uber) | Geospatial Indexing (QuadTree/Geohash), State Machines, Matching Algorithms | ✅ [Link](./03-uber.md) |
| **E-Commerce** (Amazon/Flipkart) | Inventory Management (locking), Cart Consistency, Search (Elasticsearch), Payments | ✅ [Link](./11-ecommerce.md) |
| **Location Based Service** (Yelp) | QuadTree versus Geohash, Radius Search, Read-heavy optimization | ✅ [Link](./12-location-based-service.md) |

---

## ☁️ Tier 3: Storage & Collaborative (Frequency: Medium)
*Focus on consistency and data models.*

| Problem | Key Concepts | Status |
| :--- | :--- | :--- |
| **Google Docs** (Collab Editing) | Operational Transformation (OT), CRDTs, WebSockets, Differential Sync | ✅ [Link](./13-google-docs.md) |
| **Key-Value Store** (DynamoDB) | Consistent Hashing, Gossip Protocol, Merkle Trees, CAP Theorem, Tunable Consistency | ✅ [Link](./14-key-value-store.md) |
| **Distributed Cache** (Redis) | LRU/LFU Eviction, Write-through vs Write-back, Cache Stampede, TTL | ✅ [Link](./15-distributed-cache.md) |
| **Google Drive / Dropbox** | Chunking, Deduplication, Synchronization, Block Storage vs Object Storage (S3) | ✅ [Link](./16-cloud-storage.md) |

---

## 🎮 Tier 4: Real-Time & Gaming (Frequency: Medium-Low)
*Focus on low latency and state.*

| Problem | Key Concepts | Status |
| :--- | :--- | :--- |
| **Gaming Leaderboard** | Redis Sorted Sets (ZSET), Real-time updates, Batching | ✅ [Link](./17-gaming-leaderboard.md) |
| **Multiplayer Game State** | UDP vs TCP, State Synchronization, Lag Compensation, Client-side Prediction | ✅ [Link](./18-multiplayer-game-state.md) |
| **Stock Exchange** | Matching Engine, Order Book, FIFO, Low Latency, Multicast | ✅ [Link](./19-stock-exchange.md) |

---

## 🛠️ Infrastructure Components
*Ideally, you use these as building blocks, but sometimes you are asked to design them.*

*   **Design a Scheduler** (Cron jobs)
*   **Design a Metric/Log Monitor** (Datadog/Prometheus)
*   **Design a Load Balancer** (Round Robin, Consistent Hashing)
*   **Design an Autocomplete System** (Trie Data Structure, Typeahead)

---

## 🎯 Strategic Advice based on your Repositories:
You have already covered the **Heavy Hitters** (Netflix, Uber, Twitter, WhatsApp).
**Recommendation for next study:**
1.  **URL Shortener**: It's the "Hello World" of system design but tests your ability to do back-of-the-envelope math and database choices.
2.  **Rate Limiter**: Very common "API Design" question.
3.  **Google Docs**: Tests your knowledge of complex algorithms (OT/CRDT) rather than just "put it in a DB".
