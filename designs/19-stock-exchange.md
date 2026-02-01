[🏠 Home](../README.md) | [⬅️ 18 Multiplayer Game State](./18-multiplayer-game-state.md)

# 📈 System Design: Stock Exchange

> Design a low-latency matching engine (like NASDAQ or NYSE).

---

## 📊 Quick Reference Card

| Aspect | Decision |
|--------|----------|
| **Core Architecture** | Single-Threaded Sequelizer (LMAX Pattern) |
| **Data Structure** | Limit Order Book (Map of Double Linked Lists) |
| **Persistence** | Event Sourcing (Write-Ahead Log) |
| **Communication** | Multicast (UDP) for Market Data, TCP for Orders |
| **Latency** | Microseconds ($\mu s$) |

---

## 📋 Table of Contents
1. [Functional Requirements](#-functional-requirements)
2. [The Order Book](#-the-order-book)
3. [Concurrency: Why Locks are Bad](#-concurrency-why-locks-are-bad)
4. [High-Level Architecture](#-high-level-architecture)
5. [Deep Dives](#-deep-dives)

---

## ✅ Functional Requirements

| Feature | Description | Priority |
|---------|-------------|----------|
| **Place Order** | Buy/Sell 100 shares @ $150 | P0 |
| **Cancel Order** | Remove active order | P0 |
| **Match** | Execute trades instantly when prices cross | P0 |
| **Fairness** | FIFO (First In, First Out) | P0 |

---

## 📖 The Order Book

We need a dedicated structure called a **Limit Order Book**.

*   **Bids (Buy)**: Sorted High to Low (Best price is highest).
*   **Asks (Sell)**: Sorted Low to High (Best price is lowest).

### Data Structure of Efficiency
We need $O(1)$ add, $O(1)$ cancel, $O(1)$ execute.

*   **Price Levels**: `TreeMap<Price, Queue<Order>>`.
    *   Maps Price ($150.00) to a Queue of orders.
*   **Order Lookup**: `HashMap<OrderID, Order>`.
    *   To execute cancellations efficiently in $O(1)$.

---

## ⚡ Concurrency: Why Locks are Bad

In typical web apps, we use Multi-threading + Locks.
*   **Problem**: Context switches take ~1-5 $\mu s$. Locks cause contention.
*   **Solution**: **Single Threaded Execution**.
    *   CPU works fastest when it executes instructions sequentially without switching contexts.
    *   No Locks needed = No waiting.
    *   Used by LMAX Exchange (Disruptor Pattern).

---

## 🏛️ High-Level Architecture

```mermaid
flowchart TB
    Client --> Gateway[FIX Gateway]
    Gateway --> Sequencer[Sequencer (Assigns ID)]
    
    subgraph "The Core (Single Thread)"
        Sequencer --> Engine[Matching Engine]
        Engine --> Journal[In-Memory + Journal]
    end
    
    Engine --> |"Trade Executed"| PubSub
    PubSub --> MarketData[Market Data Feed]
    PubSub --> Clearing[Clearing House]
```

### Flow
1.  **Gateway**: Validates format.
2.  **Sequencer**: Assigns precise sequence ID (101, 102...). Ensures deterministic replay.
3.  **Matching Engine**:
    *   Read Order 101.
    *   Check Order Book. Match? Yes -> Generate Trade. No -> Add to Book.
    *   Write "Event 101 Processed" to Memory Journal.

---

## 🔍 Deep Dives

### 1. High Availability (Determinism)
*   If the Engine crashes, how do we recover?
*   **Event Sourcing**: We have the Journal of all Inputs (Orders) in sequence.
*   **Replay**: Start a standby instance, replay all inputs from start of day. Since logic is deterministic (no threading race conditions), the state will be exactly identical.

### 2. Market Data Feed
*   How do we tell 10,000 traders "Apple is now $151"?
*   **Multicast (UDP)**: Send packet once to network switch, switch copies it to all subscribers simultaneously.
*   Lowest latency, highest fairness (everyone gets data at same time).

---

## 🧠 Interview Questions

1.  **Q**: Floating Point math?
    *   **A**: NEVER use floats/doubles for money (`0.1 + 0.2 != 0.3`). Use `long` integers (micros/cents). `$150.25` -> `1502500`.
2.  **Q**: Decimal precision?
    *   **A**: 4 to 6 decimal places usually required by regulators.

---
