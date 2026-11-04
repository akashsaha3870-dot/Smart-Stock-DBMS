-- ============================================
-- SMART STOCK DATABASE
-- Core Database Schema
-- ============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (role IN ('admin', 'manager', 'staff'))
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

CREATE TABLE suppliers (
    supplier_id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    category_id INT NOT NULL,
    supplier_id INT,
    sku VARCHAR(50) UNIQUE NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    cost_price NUMERIC(10,2) NOT NULL,
    reorder_level INT DEFAULT 10,
    shelf_life_days INT,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT fk_product_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id),

    CONSTRAINT fk_product_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id),

    CHECK (unit_price >= 0),
    CHECK (cost_price >= 0),
    CHECK (reorder_level >= 0)
);

CREATE TABLE inventory (
    inventory_id SERIAL PRIMARY KEY,
    product_id INT UNIQUE NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_inventory_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE,

    CHECK (quantity >= 0),
    CHECK (reserved_quantity >= 0)
);

CREATE TABLE inventory_batches (
    batch_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    quantity INT NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE NOT NULL,
    purchase_price NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE,

    CHECK (quantity >= 0),
    CHECK (purchase_price >= 0),
    CHECK (expiry_date >= manufacturing_date)
);

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_name VARCHAR(150),
    phone VARCHAR(20),
    email VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    customer_id INT,
    user_id INT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT fk_sale_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_sale_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CHECK (total_amount >= 0)
);

CREATE TABLE sale_items (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_sale_item_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_sale_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0)
);

CREATE TABLE purchases (
    purchase_id SERIAL PRIMARY KEY,
    supplier_id INT NOT NULL,
    user_id INT,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending',

    CONSTRAINT fk_purchase_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id),

    CONSTRAINT fk_purchase_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CHECK (total_amount >= 0),
    CHECK (status IN ('pending', 'approved', 'received', 'cancelled'))
);

CREATE TABLE purchase_items (
    purchase_item_id SERIAL PRIMARY KEY,
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost NUMERIC(10,2) NOT NULL,

    CONSTRAINT fk_purchase_item_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(purchase_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_purchase_item_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CHECK (quantity > 0),
    CHECK (unit_cost >= 0)
);

CREATE TABLE forecasts (
    forecast_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    forecast_date DATE NOT NULL,
    predicted_quantity NUMERIC(10,2) NOT NULL,
    model_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_forecast_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
        ON DELETE CASCADE,

    CHECK (predicted_quantity >= 0)
);

CREATE TABLE reorder_recommendations (
    recommendation_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    recommended_quantity INT NOT NULL,
    reason TEXT,
    priority VARCHAR(20) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recommendation_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id),

    CHECK (recommended_quantity >= 0),
    CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CHECK (status IN ('pending', 'approved', 'rejected', 'completed'))
);

CREATE TABLE expiry_alerts (
    alert_id SERIAL PRIMARY KEY,
    batch_id INT NOT NULL,
    days_remaining INT NOT NULL,
    risk_level VARCHAR(20) NOT NULL,
    suggested_action TEXT,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_expiry_batch
        FOREIGN KEY (batch_id)
        REFERENCES inventory_batches(batch_id)
        ON DELETE CASCADE,

    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    CHECK (status IN ('active', 'resolved', 'ignored'))
);

CREATE TABLE agent_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT,
    query_text TEXT NOT NULL,
    tool_used VARCHAR(100),
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_agent_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- ============================================
-- SMART STOCK
-- PERFORMANCE INDEXES
-- ============================================

CREATE INDEX idx_products_category
ON products(category_id);

CREATE INDEX idx_products_supplier
ON products(supplier_id);

CREATE INDEX idx_inventory_product
ON inventory(product_id);

CREATE INDEX idx_batches_product
ON inventory_batches(product_id);

CREATE INDEX idx_batches_expiry
ON inventory_batches(expiry_date);

CREATE INDEX idx_sales_date
ON sales(sale_date);

CREATE INDEX idx_sale_items_product
ON sale_items(product_id);

CREATE INDEX idx_purchase_date
ON purchases(purchase_date);

CREATE INDEX idx_purchase_items_product
ON purchase_items(product_id);

CREATE INDEX idx_forecasts_product_date
ON forecasts(product_id, forecast_date);

CREATE INDEX idx_recommendations_product
ON reorder_recommendations(product_id);

CREATE INDEX idx_expiry_alerts_batch
ON expiry_alerts(batch_id);

CREATE INDEX idx_agent_logs_user
ON agent_logs(user_id);

CREATE INDEX idx_agent_logs_created
ON agent_logs(created_at);

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'categories'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'suppliers'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'customers'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'inventory'
ORDER BY ordinal_position;