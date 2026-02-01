[🏠 Home](../../README.md) | [🗄️ DBMS Roadmap](./00-roadmap.md) | [⬅️ MVCC](./11-mvcc.md) | [➡️ Joins](./13-joins.md)

# 📝 SQL Commands & Advanced Queries

> Complete reference for SQL syntax and advanced features.

---

## 📊 Quick Reference

| Category | Commands |
|----------|----------|
| **DDL** | CREATE, ALTER, DROP, TRUNCATE |
| **DML** | SELECT, INSERT, UPDATE, DELETE |
| **DCL** | GRANT, REVOKE |
| **TCL** | COMMIT, ROLLBACK, SAVEPOINT |

---

## 🏗️ DDL (Data Definition Language)

Commands that define schema/structure.

```sql
-- CREATE
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10,2) CHECK (salary > 0),
    hire_date DATE DEFAULT CURRENT_DATE
);

-- ALTER
ALTER TABLE employees ADD COLUMN email VARCHAR(100);
ALTER TABLE employees DROP COLUMN email;
ALTER TABLE employees MODIFY COLUMN name VARCHAR(200);

-- DROP (destroys table and data)
DROP TABLE employees;

-- TRUNCATE (removes all rows, keeps structure)
TRUNCATE TABLE employees;
```

### DROP vs TRUNCATE vs DELETE

| Aspect | DROP | TRUNCATE | DELETE |
|--------|------|----------|--------|
| Structure | Removed | Kept | Kept |
| Data | Removed | Removed | Removed |
| WHERE clause | No | No | Yes |
| Speed | Fast | Fast | Slow |
| Rollback | No | Usually No | Yes |
| Triggers | No | No | Yes |

---

## 📤 DML (Data Manipulation Language)

### INSERT

```sql
-- Single row
INSERT INTO employees (id, name, department)
VALUES (1, 'John Doe', 'Engineering');

-- Multiple rows
INSERT INTO employees (id, name, department) VALUES
(2, 'Jane Smith', 'Marketing'),
(3, 'Bob Wilson', 'Engineering');

-- From another table
INSERT INTO archive_employees
SELECT * FROM employees WHERE hire_date < '2020-01-01';
```

### UPDATE

```sql
-- Simple update
UPDATE employees SET salary = salary * 1.1 WHERE department = 'Engineering';

-- Update with JOIN
UPDATE employees e
JOIN departments d ON e.dept_id = d.id
SET e.salary = e.salary * 1.05
WHERE d.name = 'Sales';
```

### DELETE

```sql
-- Simple delete
DELETE FROM employees WHERE id = 1;

-- Delete with subquery
DELETE FROM employees 
WHERE department IN (SELECT name FROM departments WHERE budget = 0);
```

---

## 🔐 DCL (Data Control Language)

```sql
-- Grant permissions
GRANT SELECT, INSERT ON employees TO 'user1'@'localhost';
GRANT ALL PRIVILEGES ON database.* TO 'admin'@'localhost';

-- Revoke permissions
REVOKE INSERT ON employees FROM 'user1'@'localhost';
```

---

## 🔄 TCL (Transaction Control Language)

```sql
BEGIN TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
SAVEPOINT after_debit;

UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- If something goes wrong
ROLLBACK TO after_debit;

-- If everything is fine
COMMIT;
```

---

## 🪟 Window Functions

Perform calculations across a set of rows related to current row.

```mermaid
flowchart TB
    subgraph "Window Function Syntax"
        Func["function()"]
        Over["OVER ("]
        Partition["PARTITION BY column"]
        Order["ORDER BY column"]
        Frame["ROWS BETWEEN ... AND ...")"]
    end
    
    Func --> Over --> Partition --> Order --> Frame
```

### Common Window Functions

```sql
SELECT 
    name,
    department,
    salary,
    -- Ranking
    ROW_NUMBER() OVER (ORDER BY salary DESC) as row_num,
    RANK() OVER (ORDER BY salary DESC) as rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) as dense_rank,
    
    -- Aggregates
    SUM(salary) OVER (PARTITION BY department) as dept_total,
    AVG(salary) OVER (PARTITION BY department) as dept_avg,
    
    -- Navigation
    LAG(salary, 1) OVER (ORDER BY hire_date) as prev_salary,
    LEAD(salary, 1) OVER (ORDER BY hire_date) as next_salary,
    FIRST_VALUE(name) OVER (PARTITION BY department ORDER BY salary DESC) as top_earner
FROM employees;
```

### RANK vs DENSE_RANK vs ROW_NUMBER

| salary | ROW_NUMBER | RANK | DENSE_RANK |
|--------|------------|------|------------|
| 100 | 1 | 1 | 1 |
| 100 | 2 | 1 | 1 |
| 90 | 3 | 3 | 2 |
| 80 | 4 | 4 | 3 |

---

## 📋 Common Table Expressions (CTEs)

```sql
-- Basic CTE
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 100000
)
SELECT * FROM high_earners WHERE department = 'Engineering';

-- Recursive CTE (for hierarchies)
WITH RECURSIVE org_chart AS (
    -- Base case: CEO
    SELECT id, name, manager_id, 1 as level
    FROM employees WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees under managers
    SELECT e.id, e.name, e.manager_id, oc.level + 1
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY level;
```

---

## 📊 GROUP BY & HAVING

```sql
-- Group with aggregate
SELECT department, COUNT(*) as emp_count, AVG(salary) as avg_salary
FROM employees
GROUP BY department
HAVING COUNT(*) > 5  -- Filter groups
ORDER BY avg_salary DESC;

-- ROLLUP for subtotals
SELECT department, job_title, SUM(salary)
FROM employees
GROUP BY ROLLUP(department, job_title);

-- CUBE for all combinations
SELECT department, job_title, SUM(salary)
FROM employees
GROUP BY CUBE(department, job_title);
```

---

## 🧠 Interview Questions

1. **Q: DELETE vs TRUNCATE vs DROP?**
   - **A:** 
     - DELETE: DML, can use WHERE, logged, slow
     - TRUNCATE: DDL, removes all rows, faster, resets identity
     - DROP: Removes entire table structure

2. **Q: What are Window Functions?**
   - **A:** Functions that calculate across a "window" of rows related to current row, without collapsing rows like GROUP BY. Examples: ROW_NUMBER(), RANK(), SUM() OVER().

3. **Q: How do CTEs differ from subqueries?**
   - **A:** CTEs are more readable, can be recursive, and can be referenced multiple times in the query. Subqueries are inline and can't self-reference.

4. **Q: HAVING vs WHERE?**
   - **A:** WHERE filters individual rows BEFORE grouping. HAVING filters groups AFTER grouping (works with aggregates).

---
