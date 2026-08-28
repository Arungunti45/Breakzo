import asyncpg, asyncio

SCHEMA = """
CREATE TABLE IF NOT EXISTS canteens (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    mobile_number VARCHAR(20) UNIQUE,
    role VARCHAR(50) DEFAULT 'student',
    wallet_balance DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    canteen_id INTEGER REFERENCES canteens(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    canteen_id INTEGER REFERENCES canteens(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    estimated_wait_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL
);

-- Insert some initial dummy data so the app isn't completely empty
INSERT INTO canteens (name, location) VALUES ('Main Cafeteria', 'Block A') ON CONFLICT DO NOTHING;
INSERT INTO users (name, mobile_number, wallet_balance, role) VALUES ('Admin', '1234567890', 500.00, 'admin') ON CONFLICT DO NOTHING;
"""

async def seed():
    conn = await asyncpg.connect('postgres://postgres:Arunkumar%4045@localhost:5432/food_app_db')
    await conn.execute(SCHEMA)
    print("Successfully created tables and seeded initial data.")

asyncio.run(seed())
