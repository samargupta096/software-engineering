[🏠 Home](../../README.md) | [🗄️ DBMS Roadmap](./00-roadmap.md) | [⬅️ Architecture](./01-architecture.md) | [➡️ Relational Model](./03-relational-model.md)

# 📐 ER Modeling (Entity-Relationship)

> The blueprint for designing databases before implementation.

---

## 📊 Quick Reference

| Symbol | Meaning |
|--------|---------|
| **Rectangle** | Entity (Table) |
| **Ellipse** | Attribute (Column) |
| **Diamond** | Relationship |
| **Double Rectangle** | Weak Entity |
| **Underline** | Primary Key |

---

## 🎯 Core Concepts

### Entities
An entity is a real-world object that can be distinctly identified.

```mermaid
erDiagram
    STUDENT {
        int student_id PK
        string name
        date dob
        string email
    }
    
    COURSE {
        int course_id PK
        string title
        int credits
    }
    
    PROFESSOR {
        int prof_id PK
        string name
        string department
    }
```

### Entity Types

| Type | Description | Example |
|------|-------------|---------|
| **Strong Entity** | Has its own primary key | Student, Course |
| **Weak Entity** | Depends on strong entity for identification | Order_Item (needs Order) |

---

## 🔗 Relationships

### Cardinality (How Many?)

```mermaid
erDiagram
    STUDENT ||--o{ ENROLLMENT : enrolls_in
    COURSE ||--o{ ENROLLMENT : has
    PROFESSOR ||--o{ COURSE : teaches
    DEPARTMENT ||--|| PROFESSOR : heads
```

| Notation | Meaning | Example |
|----------|---------|---------|
| `\|\|--\|\|` | One-to-One | Department has ONE Head |
| `\|\|--o{` | One-to-Many | Professor teaches MANY Courses |
| `}o--o{` | Many-to-Many | Students enroll in MANY Courses |

### Cardinality Visual Guide

```mermaid
flowchart LR
    subgraph "1:1 (One-to-One)"
        P1[Person] --- PP1[Passport]
    end
    
    subgraph "1:N (One-to-Many)"
        D1[Department] --- E1[Employee 1]
        D1 --- E2[Employee 2]
        D1 --- E3[Employee N]
    end
    
    subgraph "M:N (Many-to-Many)"
        S1[Student] --- C1[Course]
        S1 --- C2[Course]
        S2[Student] --- C1
        S2 --- C2
    end
```

---

## 📝 Attributes

### Types of Attributes

```mermaid
flowchart TB
    Attr[Attributes] --> Simple[Simple]
    Attr --> Composite[Composite]
    Attr --> Derived[Derived]
    Attr --> MultiVal[Multi-valued]
    
    Simple --> |"e.g."| Age
    Composite --> |"e.g."| Address["Address (Street, City, Zip)"]
    Derived --> |"e.g."| AgeFromDOB["Age (from DOB)"]
    MultiVal --> |"e.g."| PhoneNumbers["Phone Numbers"]
```

| Type | Description | Notation | Example |
|------|-------------|----------|---------|
| **Simple** | Atomic, cannot be divided | Single ellipse | `Age`, `Name` |
| **Composite** | Can be split into sub-parts | Nested ellipses | `Address` → Street, City |
| **Derived** | Calculated from other attributes | Dashed ellipse | `Age` from `DOB` |
| **Multi-valued** | Can have multiple values | Double ellipse | `Phone Numbers` |
| **Key** | Uniquely identifies entity | Underlined | `Student_ID` |

---

## 🔑 Keys

```mermaid
flowchart TB
    Keys[Types of Keys] --> SK[Super Key]
    Keys --> CK[Candidate Key]
    Keys --> PK[Primary Key]
    Keys --> AK[Alternate Key]
    Keys --> FK[Foreign Key]
    Keys --> CompK[Composite Key]
    
    SK --> |"Any set that uniquely identifies"| Ex1["{SSN, Name, DOB}"]
    CK --> |"Minimal super key"| Ex2["{SSN} or {Email}"]
    PK --> |"Chosen candidate key"| Ex3["SSN"]
    AK --> |"Non-chosen candidate keys"| Ex4["Email"]
    FK --> |"References another table"| Ex5["Dept_ID in Employee"]
```

### Key Definitions

| Key Type | Definition |
|----------|------------|
| **Super Key** | Any combination of attributes that uniquely identifies a row |
| **Candidate Key** | Minimal super key (no redundant attributes) |
| **Primary Key** | The candidate key chosen by the designer |
| **Alternate Key** | Candidate keys not chosen as primary |
| **Foreign Key** | Attribute that references primary key of another table |
| **Composite Key** | Primary key made of multiple columns |

---

## 👻 Weak Entities

An entity that cannot be uniquely identified without its owner entity.

```mermaid
erDiagram
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        int order_id PK
        date order_date
        decimal total
    }
    ORDER_ITEM {
        int line_number PK
        int order_id PK,FK
        string product
        int quantity
    }
```

**Characteristics:**
- Has a **partial key** (discriminator)
- Combined with owner's PK to form full identification
- Cannot exist without owner entity

---

## 🔄 ER to Relational Mapping

```mermaid
flowchart LR
    subgraph "ER Diagram"
        E1[Entity] --> R1[Relationship] --> E2[Entity]
    end
    
    subgraph "Relational Tables"
        T1[Table 1]
        T2[Table 2]
        T3[Junction Table]
    end
    
    E1 --> T1
    E2 --> T2
    R1 --> |"M:N creates"| T3
```

### Mapping Rules

| ER Element | Relational Mapping |
|------------|-------------------|
| Strong Entity | Table with PK |
| Weak Entity | Table with composite PK (owner PK + partial key) |
| 1:1 Relationship | Add FK to either table, or merge tables |
| 1:N Relationship | Add FK to the "many" side |
| M:N Relationship | Create junction/bridge table |
| Multi-valued Attribute | Create separate table |
| Composite Attribute | Flatten into columns OR create subtable |

---

## 🧠 Interview Questions

1. **Q: What is a Weak Entity?**
   - **A:** An entity that cannot be uniquely identified by its own attributes alone. It depends on an "owner" entity. Example: `Order_Item` depends on `Order`.

2. **Q: How do you handle M:N relationships?**
   - **A:** Create a junction table (also called bridge/associative table) containing foreign keys to both entities. Example: `Student_Course` table for Student-Course M:N relationship.

3. **Q: Difference between Candidate Key and Primary Key?**
   - **A:** Candidate keys are all possible minimal keys. Primary key is the ONE candidate key chosen by the designer. Others become alternate keys.

---
