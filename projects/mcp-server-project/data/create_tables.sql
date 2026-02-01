-- Sample SQLite database for MCP Server demo
-- Run: sqlite3 sample.db < create_tables.sql

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    company TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price DECIMAL(10,2),
    stock INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    total_amount DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Sample data
INSERT INTO customers (name, email, company) VALUES
    ('John Doe', 'john@example.com', 'Acme Corp'),
    ('Jane Smith', 'jane@example.com', 'Tech Solutions'),
    ('Bob Johnson', 'bob@example.com', 'Startup Inc');

INSERT INTO products (name, category, price, stock) VALUES
    ('Laptop Pro', 'Electronics', 1299.99, 50),
    ('Wireless Mouse', 'Electronics', 49.99, 200),
    ('Office Chair', 'Furniture', 299.99, 30),
    ('Standing Desk', 'Furniture', 599.99, 15);

INSERT INTO orders (customer_id, product_id, quantity, total_amount, status) VALUES
    (1, 1, 2, 2599.98, 'completed'),
    (1, 2, 5, 249.95, 'completed'),
    (2, 3, 1, 299.99, 'pending'),
    (3, 4, 1, 599.99, 'shipped');
