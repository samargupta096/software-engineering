[🏠 Home](../../README.md) | [🗄️ DBMS Roadmap](./00-roadmap.md) | [⬅️ ER Modeling](./02-er-modeling.md) | [➡️ Normalization](./04-normalization.md)

# 🔑 Relational Model & Keys

> The mathematical foundation of modern databases.

---

## 📊 Quick Reference

| Term | Definition |
|------|------------|
| **Relation** | A table (set of tuples) |
| **Tuple** | A row (record) |
| **Attribute** | A column (field) |
| **Domain** | Set of allowed values for an attribute |
| **Degree** | Number of attributes |
| **Cardinality** | Number of tuples |

---

## 📐 Relational Model Terminology

```mermaid
flowchart TB
    subgraph Relation["📋 Relation (Table): EMPLOYEE"]
        Header["Attribute 1 | Attribute 2 | Attribute 3 | Attribute 4"]
        Row1["Tuple 1: 101 | John | Sales | 50000"]
        Row2["Tuple 2: 102 | Jane | HR | 55000"]
        Row3["Tuple 3: 103 | Bob | IT | 60000"]
    end
    
    Note1[/"Degree = 4 (columns)"/]
    Note2[/"Cardinality = 3 (rows)"/]
    
    Relation --> Note1
    Relation --> Note2
```

### Formal vs Informal Terms

| Formal Term | Informal Term | Example |
|-------------|---------------|---------|
| Relation | Table | EMPLOYEE |
| Tuple | Row / Record | (101, 'John', 'Sales', 50000) |
| Attribute | Column / Field | emp_id, name, dept |
| Domain | Data Type + Constraints | INT, VARCHAR(50) |

---

## 🔐 Types of Keys

### Key Hierarchy

```mermaid
flowchart TB
    SK[Super Key] --> CK[Candidate Key]
    CK --> PK[Primary Key]
    CK --> AK[Alternate Key]
    
    SK --> |"Superset"| Note1["Any set of attributes that uniquely identifies"]
    CK --> |"Minimal"| Note2["No redundant attributes"]
    PK --> |"Chosen"| Note3["The ONE key used by system"]
    AK --> |"Unchosen"| Note4["Remaining candidate keys"]
```

### Example: Student Table

```sql
CREATE TABLE Student (
    student_id   INT PRIMARY KEY,        -- Primary Key
    email        VARCHAR(100) UNIQUE,    -- Alternate Key (Candidate)
    ssn          CHAR(11) UNIQUE,        -- Alternate Key (Candidate)
    name         VARCHAR(100),
    department   VARCHAR(50)
);
```

**Super Keys:** `{student_id}`, `{email}`, `{ssn}`, `{student_id, email}`, `{student_id, name}`, ...
**Candidate Keys:** `{student_id}`, `{email}`, `{ssn}` (minimal)
**Primary Key:** `{student_id}` (chosen)
**Alternate Keys:** `{email}`, `{ssn}`

---

## 🔗 Foreign Key & Referential Integrity

```mermaid
erDiagram
    DEPARTMENT ||--o{ EMPLOYEE : has
    DEPARTMENT {
        int dept_id PK
        string dept_name
    }
    EMPLOYEE {
        int emp_id PK
        string name
        int dept_id FK
    }
```

### Referential Integrity Rules

```mermaid
flowchart TB
    subgraph "What happens when Parent is deleted?"
        Action1[CASCADE] --> |"Delete child rows too"| R1[Employee rows deleted]
        Action2[SET NULL] --> |"Set FK to NULL"| R2[dept_id becomes NULL]
        Action3[RESTRICT] --> |"Block the delete"| R3[Error thrown]
        Action4[SET DEFAULT] --> |"Set FK to default value"| R4[dept_id = default]
    end
```

```sql
CREATE TABLE Employee (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT,
    FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

---

## 🛡️ Integrity Constraints

```mermaid
flowchart TB
    IC[Integrity Constraints] --> Domain[Domain Constraint]
    IC --> Entity[Entity Integrity]
    IC --> Referential[Referential Integrity]
    IC --> Key[Key Constraint]
    IC --> User[User-Defined]
    
    Domain --> |"Data type, CHECK"| Ex1["age INT CHECK (age > 0)"]
    Entity --> |"PK not NULL"| Ex2["PRIMARY KEY cannot be NULL"]
    Referential --> |"FK must exist in parent"| Ex3["dept_id must exist in Department"]
    Key --> |"Unique values"| Ex4["UNIQUE constraint"]
```

### Constraint Types Summary

| Constraint | Description | SQL Syntax |
|------------|-------------|------------|
| **NOT NULL** | Column cannot have NULL | `name VARCHAR(50) NOT NULL` |
| **UNIQUE** | All values must be different | `email VARCHAR(100) UNIQUE` |
| **PRIMARY KEY** | NOT NULL + UNIQUE | `emp_id INT PRIMARY KEY` |
| **FOREIGN KEY** | References another table | `REFERENCES Dept(id)` |
| **CHECK** | Custom condition | `CHECK (salary > 0)` |
| **DEFAULT** | Default value if not provided | `status VARCHAR(10) DEFAULT 'active'` |

---

## 🧮 Relational Algebra

The theoretical foundation for SQL operations.

```mermaid
flowchart LR
    subgraph "Unary Operations"
        Select[σ Selection]
        Project[π Projection]
        Rename[ρ Rename]
    end
    
    subgraph "Binary Operations"
        Union[∪ Union]
        Intersect[∩ Intersection]
        Diff[- Difference]
        Cross[× Cartesian Product]
        Join[⋈ Join]
    end
```

### Operations Explained

| Operation | Symbol | SQL Equivalent | Description |
|-----------|--------|----------------|-------------|
| Selection | σ | `WHERE` | Filter rows |
| Projection | π | `SELECT columns` | Choose columns |
| Union | ∪ | `UNION` | Combine rows from two tables |
| Intersection | ∩ | `INTERSECT` | Common rows |
| Difference | - | `EXCEPT` | Rows in A but not in B |
| Cartesian Product | × | `CROSS JOIN` | All combinations |
| Natural Join | ⋈ | `NATURAL JOIN` | Match on common columns |

### Example

```
-- Relational Algebra: π name (σ salary>50000 (Employee))
-- SQL:
SELECT name FROM Employee WHERE salary > 50000;
```

---

## 🧠 Interview Questions

1. **Q: What is Referential Integrity?**
   - **A:** A constraint ensuring foreign key values either match a primary key in the referenced table or are NULL. Prevents orphan records.

2. **Q: Difference between UNIQUE and PRIMARY KEY?**
   - **A:** PRIMARY KEY = UNIQUE + NOT NULL. A table can have only ONE primary key but multiple UNIQUE constraints. UNIQUE allows one NULL (in most DBs).

3. **Q: What is a Composite Key?**
   - **A:** A primary key made up of two or more columns. Example: In an `Enrollment` table, `(student_id, course_id)` together form the primary key.

---
