# ✍️ Clean Code — Key Learnings

> *Robert C. Martin ("Uncle Bob")*
> How to write code that humans can read, understand, and maintain.

[🏠 Back to Books](./README.md)

---

## Core Philosophy

> **"Any fool can write code that a computer can understand. Good programmers write code that humans can understand."** — Martin Fowler

```mermaid
mindmap
  root((Clean Code))
    Naming
      Intention-revealing names
      Pronounceable names
      Searchable names
    Functions
      Small — do ONE thing
      Few parameters
      No side effects
    Comments
      Code should be self-documenting
      Don't comment bad code — rewrite it
    Error Handling
      Use exceptions, not return codes
      Don't return null
    Testing
      FIRST principles
      One assert per test
      Clean tests = clean code
```

---

## 1. Meaningful Names

```mermaid
flowchart LR
    subgraph BAD["❌ Bad Names"]
        B1["int d; // days"]
        B2["List list1;"]
        B3["void doStuff()"]
        B4["int hp; // hit points"]
    end

    subgraph GOOD["✅ Good Names"]
        G1["int elapsedDays;"]
        G2["List activeUsers;"]
        G3["void calculateTax()"]
        G4["int playerHealthPoints;"]
    end

    style BAD fill:#ffcdd2,stroke:#c62828
    style GOOD fill:#c8e6c9,stroke:#388e3c
```

| Rule | Bad | Good |
| :--- | :--- | :--- |
| **Reveal intent** | `d` | `elapsedTimeInDays` |
| **Avoid disinformation** | `accountList` (if not a List) | `accounts` or `accountGroup` |
| **Make pronounceable** | `genymdhms` | `generationTimestamp` |
| **Make searchable** | `7` (magic number) | `MAX_RETRIES = 7` |
| **Avoid encodings** | `strName`, `iCount` | `name`, `count` |

---

## 2. Functions — Small & Focused

```mermaid
flowchart TD
    subgraph RULE["Function Rules"]
        R1["1️⃣ SMALL — 20 lines max"]
        R2["2️⃣ DO ONE THING"]
        R3["3️⃣ One level of abstraction"]
        R4["4️⃣ Descriptive name"]
        R5["5️⃣ Few arguments (0-2 ideal)"]
    end

    style RULE fill:#e8eaf6,stroke:#3f51b5
```

| Args | Name | Quality |
| :---: | :--- | :--- |
| 0 | Niladic | ⭐⭐⭐⭐⭐ Best |
| 1 | Monadic | ⭐⭐⭐⭐ Good |
| 2 | Dyadic | ⭐⭐⭐ OK |
| 3 | Triadic | ⭐⭐ Avoid |
| 4+ | Polyadic | ⭐ Extract to object |

> **The Step-Down Rule:** Read code top-to-bottom like a newspaper — high-level abstractions first, details below.

---

## 3. Comments — When & When Not

| ✅ Good Comments | ❌ Bad Comments |
| :--- | :--- |
| Legal/copyright headers | Redundant (repeats the code) |
| Explaining WHY, not WHAT | Journal comments (use git) |
| Warning of consequences | Commented-out code (delete it!) |
| TODO notes (temporary) | Position markers (`// end of if`) |
| Clarifying complex regex/algo | Noise (`// default constructor`) |

> **Best comment is the one you didn't have to write** — because the code was clear enough.

---

## 4. Error Handling

```mermaid
flowchart TD
    subgraph DO["✅ Do"]
        D1["Use exceptions over return codes"]
        D2["Write try-catch first"]
        D3["Provide context in exceptions"]
        D4["Define exception classes by caller's needs"]
    end

    subgraph DONT["❌ Don't"]
        N1["Return null"]
        N2["Pass null"]
        N3["Use checked exceptions everywhere"]
        N4["Ignore exceptions silently"]
    end

    style DO fill:#c8e6c9,stroke:#388e3c
    style DONT fill:#ffcdd2,stroke:#c62828
```

---

## 5. The SOLID Principles

```mermaid
flowchart TD
    SOLID["SOLID"] --> S["S — Single Responsibility<br/>One class, one reason to change"]
    SOLID --> O["O — Open/Closed<br/>Open for extension, closed for modification"]
    SOLID --> L["L — Liskov Substitution<br/>Subtypes must be substitutable"]
    SOLID --> I["I — Interface Segregation<br/>Many specific interfaces > one fat interface"]
    SOLID --> D["D — Dependency Inversion<br/>Depend on abstractions, not concretions"]

    style S fill:#e3f2fd,stroke:#1976d2
    style O fill:#fff3e0,stroke:#ff9800
    style L fill:#e8f5e9,stroke:#4caf50
    style I fill:#fce4ec,stroke:#e91e63
    style D fill:#e8eaf6,stroke:#3f51b5
```

---

## 6. Testing — FIRST Principles

| Letter | Principle | Meaning |
| :---: | :--- | :--- |
| **F** | Fast | Tests run quickly — seconds, not minutes |
| **I** | Independent | Tests don't depend on each other |
| **R** | Repeatable | Same result every time, any environment |
| **S** | Self-Validating | Pass or fail — no manual inspection |
| **T** | Timely | Written BEFORE or WITH the production code |

---

## 7. Code Smells — Quick Reference

| Smell | Description | Fix |
| :--- | :--- | :--- |
| **Long Method** | Function does too many things | Extract Method |
| **Large Class** | Class has too many responsibilities | Extract Class |
| **Long Parameter List** | Function takes 5+ params | Parameter Object |
| **Duplicate Code** | Same code in multiple places | Extract and share |
| **Feature Envy** | Method uses another class's data more | Move Method |
| **Data Clumps** | Same 3 vars always appear together | Extract Class |
| **Primitive Obsession** | Using primitives for domain concepts | Create value objects |
| **Refused Bequest** | Subclass doesn't use parent methods | Rethink hierarchy |

---

## 8. The Boy Scout Rule

> **"Leave the campground cleaner than you found it."**

Every time you touch code:
- Rename a variable to be clearer
- Extract a small function
- Remove a dead comment
- Simplify a conditional

Small improvements compound into massive quality gains over time.

---

<div align="center">

[⬅️ Previous: Pragmatic Programmer](./pragmatic-programmer.md) | [🏠 Back to Books](./README.md) | [Next: DDIA ➡️](./designing-data-intensive-apps.md)

</div>
