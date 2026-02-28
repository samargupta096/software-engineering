# Chapter 5: Event Sourcing

> *Storing state as a sequence of events — the complete history approach*

---

## 🎯 Core Concepts

### Traditional vs. Event Sourcing

```mermaid
flowchart LR
    subgraph TRAD["❌ Traditional: Store Latest State"]
        direction TB
        DB1[("DB: balance = $150")]
        Note1["History is lost"]
    end

    subgraph ES["✅ Event Sourcing: Store Events"]
        direction TB
        E1["AccountOpened ($0)"]
        E2["Deposited (+$200)"]
        E3["Withdrawn (-$50)"]
        E4["→ Current: $150"]
        E1 --> E2 --> E3 --> E4
    end

    style TRAD fill:#ffcdd2,stroke:#c62828
    style ES fill:#c8e6c9,stroke:#388e3c
```

### How Event Sourcing Works

```mermaid
flowchart TD
    Cmd["📤 Command:<br/>WithdrawMoney($50)"] --> Validate["✅ Validate<br/>against current state"]
    Validate --> Emit["📨 Emit Event:<br/>MoneyWithdrawn($50)"]
    Emit --> Store[("💾 Append to<br/>Event Store")]
    Store --> Project["📊 Update Projections<br/>(Read Models)"]
    Store --> Notify["📢 Publish to<br/>Event Bus"]

    Rebuild["🔄 Rebuild State"] --> Replay["Replay all events<br/>in order"]
    Replay --> CurrentState["💡 Current state<br/>= f(all events)"]

    style Cmd fill:#fff3e0,stroke:#ff9800
    style Store fill:#e8eaf6,stroke:#3f51b5
    style CurrentState fill:#c8e6c9,stroke:#388e3c
```

### Benefits & Challenges

| ✅ Benefits | ❌ Challenges |
| :--- | :--- |
| Complete audit trail — every change recorded | Event store grows indefinitely |
| Temporal queries — "what was state at time X?" | Schema evolution is complex |
| Replay — rebuild state from scratch | Eventual consistency by design |
| Debug — reproduce bugs by replaying events | Steeper learning curve |
| New projections — build new views retroactively | Query complexity (need CQRS) |

### Snapshotting

```mermaid
flowchart LR
    E1["Event 1"] --> E2["Event 2"] --> E3["..."] --> E100["Event 100"]
    E100 --> Snap["📸 Snapshot<br/>State at Event 100"]
    Snap --> E101["Event 101"] --> E102["Event 102"] --> Current["Current State"]

    style Snap fill:#fff3e0,stroke:#ff9800
    style Current fill:#c8e6c9,stroke:#388e3c
```

> **💡 Tip:** Take snapshots every N events (e.g. 100). To rebuild state: load latest snapshot, then replay only events after that snapshot.

---

## 📝 My Notes

<!-- Add your own notes as you read -->

---

## ❓ Questions to Reflect On

1. What domains benefit most from event sourcing? (Finance? Healthcare? Audit-heavy?)
2. When is event sourcing overkill?
3. How do you handle event schema evolution over years of data?

---

## 🛠️ Practice Ideas

- [ ] Build a simple bank account using event sourcing (deposit, withdraw, check balance)
- [ ] Implement snapshotting after every 10 events
- [ ] Build two different projections from the same event stream

---

<div align="center">

[⬅️ Previous](./chapter-04-pub-sub-patterns.md) | [🏠 Home](./README.md) | [Next ➡️](./chapter-06-cqrs.md)

</div>
