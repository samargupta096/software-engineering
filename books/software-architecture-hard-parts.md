# ⚖️ Software Architecture: The Hard Parts — Key Learnings

> *Neal Ford, Mark Richards, Pramod Sadalage, Zhamak Dehghani*
> Making trade-offs in distributed architectures — there are no easy answers.

[🏠 Back to Books](./README.md)

---

## Core Philosophy

> **"There are no right or wrong answers in architecture — only trade-offs."**

```mermaid
mindmap
  root((Architecture Hard Parts))
    Decomposition
      When to break apart
      When to keep together
      Service granularity
    Data
      Data ownership
      Distributed transactions
      Data mesh
    Communication
      Sync vs async
      Orchestration vs choreography
      Contracts
    Trade-offs
      Coupling vs autonomy
      Consistency vs availability
      Simplicity vs flexibility
```

---

## 1. Modularity Drivers

```mermaid
flowchart TD
    Question(["Should you decompose?"]) --> Agility{"Need independent<br/>deployability?"}
    Agility -- Yes --> Decompose["✅ Decompose"]
    Agility -- No --> Scale{"Need independent<br/>scalability?"}
    Scale -- Yes --> Decompose
    Scale -- No --> Fault{"Need fault<br/>tolerance?"}
    Fault -- Yes --> Decompose
    Fault -- No --> Team{"Team autonomy<br/>needed?"}
    Team -- Yes --> Decompose
    Team -- No --> Keep["⬜ Keep together"]

    style Decompose fill:#c8e6c9,stroke:#388e3c
    style Keep fill:#e3f2fd,stroke:#1976d2
```

---

## 2. Granularity — Too Big vs. Too Small

| Too Coarse (Big Services) | Too Fine (Micro Services) |
| :--- | :--- |
| Hard to deploy independently | Too many network calls |
| Conflicting release schedules | Data consistency nightmares |
| Large blast radius | Operational overhead |
| Team coordination bottleneck | Debugging is painful |

> **Sweet spot:** Services aligned with bounded contexts that can be owned by one team (2-pizza rule).

---

## 3. Data Decomposition Patterns

```mermaid
flowchart TD
    Data(["How to split data?"]) --> Shared{"Can services<br/>share a DB?"}
    Shared -- "Short-term OK" --> SharedDB["🟡 Shared Database<br/>(temporary stepping stone)"]
    Shared -- No --> Own["Each service owns its data"]
    Own --> Sync{"Need sync<br/>between services?"}
    Sync -- Yes --> Pattern{"Which pattern?"}
    Pattern --> Saga["Saga Pattern"]
    Pattern --> CQRS_P["CQRS + Events"]
    Pattern --> Outbox["Transactional Outbox"]
    Sync -- No --> Independent["✅ Fully independent"]

    style Independent fill:#c8e6c9,stroke:#388e3c
    style SharedDB fill:#fff3e0,stroke:#ff9800
```

---

## 4. Architecture Decision Records (ADRs)

| Section | Content |
| :--- | :--- |
| **Title** | Short descriptive name |
| **Status** | Proposed / Accepted / Deprecated |
| **Context** | What situation forced this decision? |
| **Decision** | What did we decide? |
| **Consequences** | What are the trade-offs? |

> **Every architecture decision should be documented.** Future engineers need to know WHY, not just WHAT.

---

## 5. Key Takeaways

| # | Lesson |
| :---: | :--- |
| 1 | **Everything is a trade-off** — document your decisions |
| 2 | **Data is the hardest part** — splitting data is harder than splitting code |
| 3 | **Start monolith, decompose when needed** — don't prematurely distribute |
| 4 | **Coupling is unavoidable** — manage it, don't eliminate it |
| 5 | **Architecture fitness functions** — automate architecture governance |

---

<div align="center">

[⬅️ Previous: DDD](./domain-driven-design.md) | [🏠 Back to Books](./README.md) | [Next: Design Patterns ➡️](./head-first-design-patterns.md)

</div>
