import asyncpg, asyncio
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

user = os.getenv('POSTGRES_USER', 'postgres')
password = quote_plus(os.getenv('POSTGRES_PASSWORD', 'Arunkumar@45'))
host = os.getenv('POSTGRES_HOST', 'localhost')
port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'food_app_db')

DB_URL = f"postgres://{user}:{password}@{host}:{port}/{db_name}"

MIGRATION = """
-- Student Preferences
CREATE TABLE IF NOT EXISTS student_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    favorite_canteen_id INTEGER REFERENCES canteens(id),
    is_vegan BOOLEAN DEFAULT false,
    is_vegetarian BOOLEAN DEFAULT false,
    spice_tolerance VARCHAR(50) DEFAULT 'medium',
    allergens TEXT
);

-- Wallet & Transactions
CREATE TABLE IF NOT EXISTS wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    wallet_id INTEGER REFERENCES wallets(id),
    amount DECIMAL(10,2) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'topup', 'payment', 'refund'
    order_id INTEGER, -- Optional, links to an order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'completed'
);

-- Loyalty & Coupons
CREATE TABLE IF NOT EXISTS loyalty_points (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) UNIQUE,
    points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    highest_streak INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_percentage DECIMAL(5,2),
    max_discount_amount DECIMAL(10,2),
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Update Menu Items with Dietary Flags
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegan BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS is_vegetarian BOOLEAN DEFAULT false;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS spice_level VARCHAR(50) DEFAULT 'none';
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT;
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS calories INTEGER DEFAULT 0;

-- Food Waste Tracking
CREATE TABLE IF NOT EXISTS food_waste (
    id SERIAL PRIMARY KEY,
    canteen_id INTEGER REFERENCES canteens(id),
    menu_item_id INTEGER REFERENCES menu_items(id),
    quantity DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255),
    cost_lost DECIMAL(10,2) DEFAULT 0.00,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

async def run_advanced_migrations():
    print(f"Connecting to {DB_URL} to run Phase 1 Migrations...")
    conn = await asyncpg.connect(DB_URL)
    await conn.execute(MIGRATION)
    print("Successfully ran Phase 1 migrations.")

asyncio.run(run_advanced_migrations())
