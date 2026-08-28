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
-- Pickup Slots
CREATE TABLE IF NOT EXISTS pickup_slots (
    id SERIAL PRIMARY KEY,
    canteen_id INTEGER REFERENCES canteens(id),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_capacity INTEGER DEFAULT 30,
    current_bookings INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Extend Orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_slot_id INTEGER REFERENCES pickup_slots(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS qr_verified BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_pickup_time TIMESTAMP;

-- Ingredients & Recipes
CREATE TABLE IF NOT EXISTS ingredients (
    id SERIAL PRIMARY KEY,
    canteen_id INTEGER REFERENCES canteens(id),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    minimum_stock DECIMAL(10,2) DEFAULT 0,
    current_stock DECIMAL(10,2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_items (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER REFERENCES menu_items(id),
    ingredient_id INTEGER REFERENCES ingredients(id),
    quantity_required DECIMAL(10,2) NOT NULL
);

-- Events for Prediction
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_date DATE NOT NULL,
    expected_attendance INTEGER DEFAULT 0,
    event_type VARCHAR(100)
);

-- Weather Records for Prediction
CREATE TABLE IF NOT EXISTS weather_records (
    id SERIAL PRIMARY KEY,
    record_date DATE NOT NULL,
    condition VARCHAR(100),
    temperature DECIMAL(5,2)
);

-- Customizations
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS customization_options JSONB DEFAULT '{"sizes": [], "addons": []}'::jsonb;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_options JSONB DEFAULT '{}'::jsonb;
"""

async def run_migrations():
    print(f"Connecting to {DB_URL}")
    conn = await asyncpg.connect(DB_URL)
    await conn.execute(MIGRATION)
    print("Successfully ran migrations.")

asyncio.run(run_migrations())
