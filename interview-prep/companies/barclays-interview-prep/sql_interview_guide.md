# SQL Interview Guide for Barclays 💾

> **Focus:** Common SQL queries, Joins, Window Functions, and Performance Optimization

---

## 📋 Table of Contents

1. [Basic SQL Queries](#basic-sql-queries)
2. [Joins](#joins)
3. [Aggregation & Grouping](#aggregation--grouping)
4. [Window Functions](#window-functions)
5. [Subqueries & CTEs](#subqueries--ctes)
6. [Common Interview Questions](#common-interview-questions)
7. [Performance Optimization](#performance-optimization)

---

## 📝 Sample Tables

```sql
-- employees table
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    department_id INT,
    manager_id INT,
    salary DECIMAL(10,2),
    hire_date DATE
);

-- departments table
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    budget DECIMAL(12,2)
);

-- Sample Data
INSERT INTO employees VALUES
(1, 'John Doe', 'john@example.com', 1, NULL, 90000, '2020-01-15'),
(2, 'Jane Smith', 'jane@example.com', 1, 1, 80000, '2020-03-20'),
(3, 'Bob Johnson', 'bob@example.com', 2, 1, 75000, '2021-06-10'),
(4, 'Alice Brown', 'alice@example.com', 2, 3, 70000, '2021-09-05'),
(5, 'Charlie Wilson', 'charlie@example.com', 1, 2, 65000, '2022-02-01'),
(6, 'Diana Ross', 'diana@example.com', 3, NULL, 95000, '2019-08-15'),
(7, 'Eve Davis', 'eve@example.com', 3, 6, 72000, '2022-04-20');

INSERT INTO departments VALUES
(1, 'Engineering', 500000),
(2, 'Marketing', 300000),
(3, 'Sales', 400000);
```

---

## 🔍 Basic SQL Queries

### SELECT with Filtering

```sql
-- Basic SELECT
SELECT name, salary FROM employees;

-- WHERE clause
SELECT * FROM employees WHERE salary > 70000;

-- Multiple conditions
SELECT * FROM employees 
WHERE department_id = 1 AND salary >= 80000;

-- IN operator
SELECT * FROM employees 
WHERE department_id IN (1, 2);

-- BETWEEN
SELECT * FROM employees 
WHERE hire_date BETWEEN '2020-01-01' AND '2021-12-31';

-- LIKE pattern matching
SELECT * FROM employees WHERE name LIKE 'J%';    -- Starts with J
SELECT * FROM employees WHERE email LIKE '%@example.com';

-- NULL handling
SELECT * FROM employees WHERE manager_id IS NULL;
SELECT * FROM employees WHERE manager_id IS NOT NULL;

-- ORDER BY
SELECT * FROM employees ORDER BY salary DESC, name ASC;

-- LIMIT (TOP in SQL Server)
SELECT * FROM employees ORDER BY salary DESC LIMIT 5;
```

### DISTINCT and Aliases

```sql
-- DISTINCT values
SELECT DISTINCT department_id FROM employees;

-- Column alias
SELECT name AS employee_name, salary AS annual_salary 
FROM employees;

-- Table alias
SELECT e.name, d.name AS department
FROM employees e
JOIN departments d ON e.department_id = d.id;
```

---

## 🔗 Joins

### Join Types

```sql
-- INNER JOIN (only matching rows)
SELECT e.name, d.name AS department
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- LEFT JOIN (all left + matching right)
SELECT e.name, d.name AS department
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- RIGHT JOIN (all right + matching left)
SELECT e.name, d.name AS department
FROM employees e
RIGHT JOIN departments d ON e.department_id = d.id;

-- FULL OUTER JOIN (all from both)
SELECT e.name, d.name AS department
FROM employees e
FULL OUTER JOIN departments d ON e.department_id = d.id;

-- CROSS JOIN (Cartesian product)
SELECT e.name, d.name
FROM employees e
CROSS JOIN departments d;
```

### Self Join

```sql
-- Find employees and their managers
SELECT 
    e.name AS employee,
    m.name AS manager
FROM employees e
LEFT JOIN employees m ON e.manager_id = m.id;

-- Find employees earning more than their manager
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.id
WHERE e.salary > m.salary;
```

### Multiple Joins

```sql
-- Employees with department and manager info
SELECT 
    e.name AS employee,
    d.name AS department,
    m.name AS manager
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN employees m ON e.manager_id = m.id;
```

---

## 📊 Aggregation & Grouping

### Aggregate Functions

```sql
-- COUNT
SELECT COUNT(*) AS total_employees FROM employees;
SELECT COUNT(DISTINCT department_id) AS departments_count FROM employees;

-- SUM, AVG, MIN, MAX
SELECT 
    SUM(salary) AS total_salary,
    AVG(salary) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary
FROM employees;

-- GROUP BY
SELECT 
    department_id,
    COUNT(*) AS employee_count,
    AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;

-- HAVING (filter after grouping)
SELECT 
    department_id,
    COUNT(*) AS employee_count
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 2;
```

### Group By with Joins

```sql
-- Department-wise stats with department names
SELECT 
    d.name AS department,
    COUNT(e.id) AS employee_count,
    ROUND(AVG(e.salary), 2) AS avg_salary,
    SUM(e.salary) AS total_salary
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC;
```

---

## 🪟 Window Functions

### ROW_NUMBER, RANK, DENSE_RANK

```sql
-- ROW_NUMBER: Unique sequential numbers
SELECT 
    name,
    salary,
    department_id,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;

-- RANK: Same rank for ties, skips numbers
SELECT 
    name,
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rank
FROM employees;

-- DENSE_RANK: Same rank for ties, no gaps
SELECT 
    name,
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank
FROM employees;

-- PARTITION BY: Rank within each department
SELECT 
    name,
    department_id,
    salary,
    ROW_NUMBER() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank
FROM employees;
```

### Running Totals and Moving Averages

```sql
-- Running total of salaries
SELECT 
    name,
    salary,
    SUM(salary) OVER (ORDER BY hire_date) AS running_total
FROM employees;

-- Running total per department
SELECT 
    name,
    department_id,
    salary,
    SUM(salary) OVER (
        PARTITION BY department_id 
        ORDER BY hire_date
    ) AS dept_running_total
FROM employees;
```

### LAG and LEAD

```sql
-- Previous and next salary
SELECT 
    name,
    salary,
    LAG(salary, 1) OVER (ORDER BY salary) AS prev_salary,
    LEAD(salary, 1) OVER (ORDER BY salary) AS next_salary
FROM employees;

-- Salary difference from previous employee
SELECT 
    name,
    salary,
    salary - LAG(salary, 1, 0) OVER (ORDER BY hire_date) AS salary_increase
FROM employees;
```

---

## 📦 Subqueries & CTEs

### Subqueries

```sql
-- Scalar subquery in SELECT
SELECT 
    name,
    salary,
    (SELECT AVG(salary) FROM employees) AS company_avg,
    salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;

-- Subquery in WHERE
SELECT * FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);

-- Subquery with IN
SELECT * FROM employees
WHERE department_id IN (
    SELECT id FROM departments WHERE budget > 350000
);

-- Correlated subquery
SELECT e.name, e.salary
FROM employees e
WHERE e.salary > (
    SELECT AVG(e2.salary) 
    FROM employees e2 
    WHERE e2.department_id = e.department_id
);
```

### Common Table Expressions (CTEs)

```sql
-- Basic CTE
WITH high_earners AS (
    SELECT * FROM employees WHERE salary > 75000
)
SELECT * FROM high_earners;

-- Multiple CTEs
WITH dept_stats AS (
    SELECT 
        department_id,
        AVG(salary) AS avg_salary
    FROM employees
    GROUP BY department_id
),
above_avg AS (
    SELECT e.*, ds.avg_salary
    FROM employees e
    JOIN dept_stats ds ON e.department_id = ds.department_id
    WHERE e.salary > ds.avg_salary
)
SELECT * FROM above_avg;

-- Recursive CTE (organizational hierarchy)
WITH RECURSIVE org_chart AS (
    -- Base case: top-level managers
    SELECT id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: employees with managers
    SELECT e.id, e.name, e.manager_id, oc.level + 1
    FROM employees e
    JOIN org_chart oc ON e.manager_id = oc.id
)
SELECT * FROM org_chart ORDER BY level, name;
```

---

## ❓ Common Interview Questions

### 1. Find Second Highest Salary

```sql
-- Method 1: Using LIMIT OFFSET
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Method 2: Using subquery
SELECT MAX(salary)
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Method 3: Using DENSE_RANK (handles duplicates)
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
    FROM employees
) ranked
WHERE rank = 2;

-- Method 4: Nth highest salary (parameterized)
SELECT salary FROM (
    SELECT DISTINCT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rank
    FROM employees
) ranked
WHERE rank = 2;  -- Change to N for Nth highest
```

### 2. Find Duplicate Records

```sql
-- Find duplicate emails
SELECT email, COUNT(*) AS count
FROM employees
GROUP BY email
HAVING COUNT(*) > 1;

-- Find duplicate rows (all columns)
SELECT name, email, department_id, COUNT(*)
FROM employees
GROUP BY name, email, department_id
HAVING COUNT(*) > 1;
```

### 3. Delete Duplicate Records (Keep One)

```sql
-- PostgreSQL / MySQL 8+
DELETE FROM employees
WHERE id NOT IN (
    SELECT MIN(id)
    FROM employees
    GROUP BY email
);

-- Using CTE
WITH duplicates AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY email ORDER BY id) AS rn
    FROM employees
)
DELETE FROM employees
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);
```

### 4. Department with Highest Average Salary

```sql
SELECT d.name, AVG(e.salary) AS avg_salary
FROM departments d
JOIN employees e ON d.id = e.department_id
GROUP BY d.id, d.name
ORDER BY avg_salary DESC
LIMIT 1;
```

### 5. Employees with Highest Salary in Each Department

```sql
-- Using window function
WITH ranked AS (
    SELECT 
        e.*,
        d.name AS department_name,
        RANK() OVER (PARTITION BY e.department_id ORDER BY e.salary DESC) AS rank
    FROM employees e
    JOIN departments d ON e.department_id = d.id
)
SELECT name, department_name, salary
FROM ranked
WHERE rank = 1;

-- Using subquery
SELECT e.name, d.name AS department, e.salary
FROM employees e
JOIN departments d ON e.department_id = d.id
WHERE (e.department_id, e.salary) IN (
    SELECT department_id, MAX(salary)
    FROM employees
    GROUP BY department_id
);
```

### 6. Find Employees Not in Any Department

```sql
SELECT * FROM employees
WHERE department_id IS NULL
   OR department_id NOT IN (SELECT id FROM departments);

-- Using LEFT JOIN
SELECT e.*
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.id IS NULL;
```

### 7. Calculate Year-over-Year Growth

```sql
WITH yearly_sales AS (
    SELECT 
        EXTRACT(YEAR FROM order_date) AS year,
        SUM(amount) AS total_sales
    FROM orders
    GROUP BY EXTRACT(YEAR FROM order_date)
)
SELECT 
    year,
    total_sales,
    LAG(total_sales) OVER (ORDER BY year) AS prev_year_sales,
    ROUND(
        (total_sales - LAG(total_sales) OVER (ORDER BY year)) * 100.0 /
        LAG(total_sales) OVER (ORDER BY year), 2
    ) AS yoy_growth_percent
FROM yearly_sales;
```

### 8. Find Consecutive Days

```sql
-- Employees who logged in for 3+ consecutive days
WITH login_groups AS (
    SELECT 
        user_id,
        login_date,
        login_date - INTERVAL '1 day' * ROW_NUMBER() OVER (
            PARTITION BY user_id ORDER BY login_date
        ) AS grp
    FROM logins
)
SELECT user_id, COUNT(*) AS consecutive_days
FROM login_groups
GROUP BY user_id, grp
HAVING COUNT(*) >= 3;
```

---

## ⚡ Performance Optimization

### Indexing Strategies

```sql
-- Single column index
CREATE INDEX idx_employees_email ON employees(email);

-- Composite index (order matters)
CREATE INDEX idx_employees_dept_salary ON employees(department_id, salary);

-- Unique index
CREATE UNIQUE INDEX idx_employees_email_unique ON employees(email);

-- Covering index (includes non-key columns)
CREATE INDEX idx_employees_dept_covering 
ON employees(department_id) INCLUDE (name, salary);
```

### Query Optimization Tips

```sql
-- 1. Use EXPLAIN ANALYZE to check query plan
EXPLAIN ANALYZE SELECT * FROM employees WHERE salary > 70000;

-- 2. Avoid SELECT * - specify columns
SELECT name, salary FROM employees;

-- 3. Use EXISTS instead of IN for large subqueries
-- Slower:
SELECT * FROM employees WHERE department_id IN (
    SELECT id FROM departments WHERE budget > 300000
);

-- Faster:
SELECT * FROM employees e
WHERE EXISTS (
    SELECT 1 FROM departments d 
    WHERE d.id = e.department_id AND d.budget > 300000
);

-- 4. Avoid functions on indexed columns
-- Bad (can't use index):
SELECT * FROM employees WHERE UPPER(email) = 'JOHN@EXAMPLE.COM';

-- Good:
SELECT * FROM employees WHERE email = 'john@example.com';

-- 5. Use UNION ALL instead of UNION when duplicates are OK
-- UNION removes duplicates (slower)
-- UNION ALL keeps all rows (faster)

-- 6. Limit result sets
SELECT * FROM employees LIMIT 100;
```

### Common Performance Issues

| Issue | Solution |
|-------|----------|
| Full table scans | Add appropriate indexes |
| N+1 query problem | Use JOINs instead of loops |
| Large IN clauses | Use temporary tables or EXISTS |
| Sorting large datasets | Add indexes on ORDER BY columns |
| SELECT * | Specify only needed columns |

---

## 🎯 Quick Reference

### SQL Execution Order

```
1. FROM      - Tables and joins
2. WHERE     - Row filtering
3. GROUP BY  - Grouping
4. HAVING    - Group filtering
5. SELECT    - Column selection
6. DISTINCT  - Remove duplicates
7. ORDER BY  - Sorting
8. LIMIT     - Row limiting
```

### String Functions

```sql
-- Concatenation
SELECT CONCAT(first_name, ' ', last_name) AS full_name FROM employees;
-- Or: first_name || ' ' || last_name (PostgreSQL)

-- Length
SELECT LENGTH(name) FROM employees;

-- Substring
SELECT SUBSTRING(email, 1, 5) FROM employees;

-- Upper/Lower
SELECT UPPER(name), LOWER(email) FROM employees;

-- Trim
SELECT TRIM(name) FROM employees;

-- Replace
SELECT REPLACE(email, '@example.com', '@company.com') FROM employees;
```

### Date Functions

```sql
-- Current date/time
SELECT NOW(), CURRENT_DATE, CURRENT_TIMESTAMP;

-- Extract parts
SELECT 
    EXTRACT(YEAR FROM hire_date) AS year,
    EXTRACT(MONTH FROM hire_date) AS month,
    EXTRACT(DAY FROM hire_date) AS day
FROM employees;

-- Date arithmetic
SELECT hire_date + INTERVAL '1 year' FROM employees;

-- Date difference
SELECT AGE(NOW(), hire_date) AS tenure FROM employees;
```

---

## ✅ Practice Checklist

- [ ] Basic SELECT, WHERE, ORDER BY
- [ ] All JOIN types (INNER, LEFT, RIGHT, FULL)
- [ ] Self JOIN for hierarchies
- [ ] GROUP BY with HAVING
- [ ] Window functions (ROW_NUMBER, RANK, DENSE_RANK)
- [ ] LAG, LEAD for comparisons
- [ ] Subqueries (scalar, correlated)
- [ ] CTEs (WITH clause)
- [ ] Second/Nth highest salary problem
- [ ] Find duplicates
- [ ] Indexing basics

---

**Good luck with your Barclays interview! 🍀**
