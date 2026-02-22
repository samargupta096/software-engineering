[🏠 Home](../../../README.md) | [⬅️ DBMS Fundamentals](./03b-dbms-fundamentals.md)

# Top 30 SQL Interview Queries (MySQL & Oracle)

Essential SQL queries frequently asked in technical interviews, with both MySQL and Oracle syntax where they differ.

---

## Table of Contents

1. [Basic Queries](#1-basic-queries)
2. [Aggregation & Grouping](#2-aggregation--grouping)
3. [Joins & Subqueries](#3-joins--subqueries)
4. [Window Functions](#4-window-functions)
5. [Advanced Queries](#5-advanced-queries)

---

## Sample Schema

```sql
-- Employees
CREATE TABLE employees (
    emp_id INT PRIMARY KEY,
    name VARCHAR(100),
    dept_id INT,
    salary DECIMAL(10,2),
    manager_id INT,
    hire_date DATE
);

-- Departments
CREATE TABLE departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(100),
    location VARCHAR(100)
);

-- Orders
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    amount DECIMAL(10,2),
    status VARCHAR(20)
);
```

---

## 1. Basic Queries

### Q1: Find Second Highest Salary

```sql
-- MySQL
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Using LIMIT
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Oracle
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);

-- Using ROWNUM
SELECT salary FROM (
    SELECT DISTINCT salary
    FROM employees
    ORDER BY salary DESC
)
WHERE ROWNUM = 2;
```

### Q2: Find Nth Highest Salary

```sql
-- MySQL (find 5th highest)
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 4;

-- Oracle
SELECT salary FROM (
    SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rnk
    FROM employees
)
WHERE rnk = 5;
```

### Q3: Find Duplicate Records

```sql
-- Find duplicate emails
SELECT email, COUNT(*) AS count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- Delete duplicates (keep lowest ID)
-- MySQL
DELETE e1 FROM employees e1
INNER JOIN employees e2
WHERE e1.emp_id > e2.emp_id AND e1.email = e2.email;

-- Oracle (using ROWID)
DELETE FROM employees
WHERE ROWID NOT IN (
    SELECT MIN(ROWID) FROM employees GROUP BY email
);
```

### Q4: Find Employees with No Manager

```sql
SELECT emp_id, name
FROM employees
WHERE manager_id IS NULL;
```

### Q5: Find Employees Hired in Last N Days

```sql
-- MySQL (last 30 days)
SELECT * FROM employees
WHERE hire_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- Oracle
SELECT * FROM employees
WHERE hire_date >= SYSDATE - 30;
```

---

## 2. Aggregation & Grouping

### Q6: Department-wise Highest Salary

```sql
SELECT d.dept_name, MAX(e.salary) AS max_salary
FROM employees e
JOIN departments d ON e.dept_id = d.dept_id
GROUP BY d.dept_name;
```

### Q7: Employee with Highest Salary in Each Department

```sql
-- Using subquery
SELECT e.name, e.dept_id, e.salary
FROM employees e
WHERE e.salary = (
    SELECT MAX(salary) FROM employees WHERE dept_id = e.dept_id
);

-- Using window function
SELECT name, dept_id, salary
FROM (
    SELECT name, dept_id, salary,
           RANK() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rnk
    FROM employees
) ranked
WHERE rnk = 1;
```

### Q8: Count Employees per Department (Include Empty)

```sql
SELECT d.dept_name, COUNT(e.emp_id) AS emp_count
FROM departments d
LEFT JOIN employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name;
```

### Q9: Departments with More Than 5 Employees

```sql
SELECT dept_id, COUNT(*) AS emp_count
FROM employees
GROUP BY dept_id
HAVING COUNT(*) > 5;
```

### Q10: Average Salary by Department (Exclude Below Average)

```sql
SELECT dept_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY dept_id
HAVING AVG(salary) > (SELECT AVG(salary) FROM employees);
```

---

## 3. Joins & Subqueries

### Q11: Employees Earning More Than Their Manager

```sql
SELECT e.name AS employee, e.salary AS emp_salary,
       m.name AS manager, m.salary AS mgr_salary
FROM employees e
JOIN employees m ON e.manager_id = m.emp_id
WHERE e.salary > m.salary;
```

### Q12: Employees Who Never Placed an Order

```sql
-- Using NOT IN
SELECT * FROM employees
WHERE emp_id NOT IN (SELECT DISTINCT customer_id FROM orders WHERE customer_id IS NOT NULL);

-- Using LEFT JOIN (preferred)
SELECT e.*
FROM employees e
LEFT JOIN orders o ON e.emp_id = o.customer_id
WHERE o.order_id IS NULL;

-- Using NOT EXISTS
SELECT * FROM employees e
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = e.emp_id);
```

### Q13: Find Common Records Between Tables

```sql
-- INTERSECT (Oracle)
SELECT emp_id, name FROM employees_old
INTERSECT
SELECT emp_id, name FROM employees_new;

-- MySQL (no INTERSECT, use JOIN)
SELECT a.emp_id, a.name
FROM employees_old a
INNER JOIN employees_new b ON a.emp_id = b.emp_id AND a.name = b.name;
```

### Q14: Find Customers with Orders in All Months

```sql
SELECT customer_id
FROM orders
WHERE YEAR(order_date) = 2024
GROUP BY customer_id
HAVING COUNT(DISTINCT MONTH(order_date)) = 12;
```

### Q15: Recursive: Employee Hierarchy

```sql
-- MySQL 8.0+ / Oracle
WITH RECURSIVE emp_hierarchy AS (
    -- Anchor: top-level managers
    SELECT emp_id, name, manager_id, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive: employees under managers
    SELECT e.emp_id, e.name, e.manager_id, h.level + 1
    FROM employees e
    JOIN emp_hierarchy h ON e.manager_id = h.emp_id
)
SELECT * FROM emp_hierarchy ORDER BY level, name;
```

---

## 4. Window Functions

### Q16: Rank Employees by Salary

```sql
SELECT 
    name, 
    salary,
    RANK() OVER (ORDER BY salary DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY salary DESC) AS dense_rank,
    ROW_NUMBER() OVER (ORDER BY salary DESC) AS row_num
FROM employees;

-- RANK: 1, 2, 2, 4 (gaps after ties)
-- DENSE_RANK: 1, 2, 2, 3 (no gaps)
-- ROW_NUMBER: 1, 2, 3, 4 (unique)
```

### Q17: Running Total of Sales

```sql
SELECT 
    order_date,
    amount,
    SUM(amount) OVER (ORDER BY order_date) AS running_total
FROM orders;

-- Running total by month
SELECT 
    order_date,
    amount,
    SUM(amount) OVER (
        PARTITION BY YEAR(order_date), MONTH(order_date)
        ORDER BY order_date
    ) AS monthly_running_total
FROM orders;
```

### Q18: Compare with Previous Row (LAG/LEAD)

```sql
SELECT 
    order_date,
    amount,
    LAG(amount, 1) OVER (ORDER BY order_date) AS prev_amount,
    amount - LAG(amount, 1) OVER (ORDER BY order_date) AS diff_from_prev,
    LEAD(amount, 1) OVER (ORDER BY order_date) AS next_amount
FROM orders;
```

### Q19: Top N per Group

```sql
-- Top 3 highest paid employees per department
SELECT * FROM (
    SELECT 
        name, dept_id, salary,
        ROW_NUMBER() OVER (PARTITION BY dept_id ORDER BY salary DESC) AS rn
    FROM employees
) ranked
WHERE rn <= 3;
```

### Q20: Moving Average

```sql
-- 3-day moving average
SELECT 
    order_date,
    amount,
    AVG(amount) OVER (
        ORDER BY order_date
        ROWS BETWEEN 2 PRECEDING AND CURRENT ROW
    ) AS moving_avg_3day
FROM orders;
```

---

## 5. Advanced Queries

### Q21: Pivot Table (Rows to Columns)

```sql
-- MySQL
SELECT 
    customer_id,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'cancelled' THEN amount ELSE 0 END) AS cancelled
FROM orders
GROUP BY customer_id;

-- Oracle PIVOT
SELECT * FROM (
    SELECT customer_id, status, amount FROM orders
)
PIVOT (
    SUM(amount) FOR status IN ('pending', 'completed', 'cancelled')
);
```

### Q22: Unpivot (Columns to Rows)

```sql
-- Oracle UNPIVOT
SELECT * FROM quarterly_sales
UNPIVOT (
    sales FOR quarter IN (q1, q2, q3, q4)
);

-- MySQL (UNION ALL)
SELECT product_id, 'Q1' AS quarter, q1 AS sales FROM quarterly_sales
UNION ALL
SELECT product_id, 'Q2', q2 FROM quarterly_sales
UNION ALL
SELECT product_id, 'Q3', q3 FROM quarterly_sales
UNION ALL
SELECT product_id, 'Q4', q4 FROM quarterly_sales;
```

### Q23: Find Consecutive Days with Orders

```sql
SELECT customer_id, order_date,
       order_date - ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS grp
FROM orders;

-- Count consecutive days
WITH grouped AS (
    SELECT customer_id, order_date,
           order_date - INTERVAL ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) DAY AS grp
    FROM orders
)
SELECT customer_id, MIN(order_date) AS start_date, MAX(order_date) AS end_date,
       COUNT(*) AS consecutive_days
FROM grouped
GROUP BY customer_id, grp
HAVING COUNT(*) >= 3;  -- At least 3 consecutive days
```

### Q24: Find Gaps in Sequence

```sql
SELECT 
    emp_id + 1 AS gap_start,
    next_id - 1 AS gap_end
FROM (
    SELECT emp_id, LEAD(emp_id) OVER (ORDER BY emp_id) AS next_id
    FROM employees
) t
WHERE next_id - emp_id > 1;
```

### Q25: Median Salary

```sql
-- MySQL 8.0+
SELECT AVG(salary) AS median
FROM (
    SELECT salary,
           ROW_NUMBER() OVER (ORDER BY salary) AS rn,
           COUNT(*) OVER () AS cnt
    FROM employees
) t
WHERE rn IN (FLOOR((cnt + 1) / 2), CEIL((cnt + 1) / 2));

-- Oracle
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY salary) AS median
FROM employees;
```

### Q26: Year-over-Year Growth

```sql
WITH yearly_sales AS (
    SELECT 
        YEAR(order_date) AS year,
        SUM(amount) AS total_sales
    FROM orders
    GROUP BY YEAR(order_date)
)
SELECT 
    year,
    total_sales,
    LAG(total_sales) OVER (ORDER BY year) AS prev_year_sales,
    ROUND((total_sales - LAG(total_sales) OVER (ORDER BY year)) / 
          LAG(total_sales) OVER (ORDER BY year) * 100, 2) AS yoy_growth_pct
FROM yearly_sales;
```

### Q27: Find Employees with Same Salary

```sql
SELECT e1.name, e1.salary
FROM employees e1
WHERE EXISTS (
    SELECT 1 FROM employees e2 
    WHERE e1.salary = e2.salary AND e1.emp_id != e2.emp_id
);

-- Alternative with COUNT window function
SELECT name, salary
FROM (
    SELECT name, salary, COUNT(*) OVER (PARTITION BY salary) AS cnt
    FROM employees
) t
WHERE cnt > 1;
```

### Q28: Cumulative Distribution

```sql
SELECT 
    name,
    salary,
    CUME_DIST() OVER (ORDER BY salary) AS cumulative_dist,
    PERCENT_RANK() OVER (ORDER BY salary) AS percent_rank,
    NTILE(4) OVER (ORDER BY salary) AS quartile
FROM employees;
```

### Q29: First and Last Value per Group

```sql
SELECT DISTINCT
    dept_id,
    FIRST_VALUE(name) OVER (PARTITION BY dept_id ORDER BY salary DESC) AS highest_paid,
    LAST_VALUE(name) OVER (
        PARTITION BY dept_id ORDER BY salary DESC
        ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING
    ) AS lowest_paid
FROM employees;
```

### Q30: Complex: Identify Fraud Patterns

```sql
-- Find customers with multiple orders in 1 hour from different locations
WITH order_pairs AS (
    SELECT 
        o1.customer_id,
        o1.order_id AS order1,
        o2.order_id AS order2,
        o1.location AS loc1,
        o2.location AS loc2,
        o1.order_time AS time1,
        o2.order_time AS time2
    FROM orders o1
    JOIN orders o2 ON o1.customer_id = o2.customer_id
        AND o1.order_id < o2.order_id
        AND o1.location != o2.location
        AND ABS(TIMESTAMPDIFF(MINUTE, o1.order_time, o2.order_time)) <= 60
)
SELECT * FROM order_pairs;
```

---

## Quick Reference

### Syntax Differences: MySQL vs Oracle

| Operation | MySQL | Oracle |
|-----------|-------|--------|
| Current Date | `CURDATE()`, `NOW()` | `SYSDATE`, `CURRENT_DATE` |
| Limit Rows | `LIMIT 10` | `FETCH FIRST 10 ROWS ONLY` or `ROWNUM <= 10` |
| String Concat | `CONCAT(a, b)` or `a || b` (8.0) | `a || b` or `CONCAT(a, b)` |
| Substring | `SUBSTRING(str, pos, len)` | `SUBSTR(str, pos, len)` |
| NVL/IFNULL | `IFNULL(col, default)` | `NVL(col, default)` |
| Auto Increment | `AUTO_INCREMENT` | `GENERATED AS IDENTITY` or Sequence |
| Date Arithmetic | `DATE_ADD(date, INTERVAL n DAY)` | `date + n` |

### Window Function Frames

```sql
ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW    -- Default
ROWS BETWEEN 2 PRECEDING AND 2 FOLLOWING            -- 5-row window
ROWS BETWEEN CURRENT ROW AND UNBOUNDED FOLLOWING    -- Current to end
RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW   -- Value-based
```

### Common Aggregate Functions

| Function | Description |
|----------|-------------|
| `COUNT(*)` | Count all rows |
| `COUNT(DISTINCT col)` | Count unique values |
| `SUM(col)` | Sum of values |
| `AVG(col)` | Average |
| `MIN(col)` / `MAX(col)` | Min/Max |
| `GROUP_CONCAT(col)` (MySQL) | Concatenate values |
| `LISTAGG(col, ',')` (Oracle) | Concatenate values |

---

## Further Reading

- [SQL Practice - LeetCode Database](https://leetcode.com/problemset/database/)
- [HackerRank SQL Challenges](https://www.hackerrank.com/domains/sql)
- [Oracle SQL Reference](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/)
- [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)

---

[🏠 Home](../../../README.md) | [⬅️ DBMS Fundamentals](./03b-dbms-fundamentals.md)
