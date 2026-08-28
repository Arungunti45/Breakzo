import asyncpg, asyncio
import os
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

user = os.getenv('POSTGRES_USER', 'postgres')
password = quote_plus(os.getenv('POSTGRES_PASSWORD', ''))
host = os.getenv('POSTGRES_HOST', 'localhost')
port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'food_app_db')

DB_URL = f"postgres://{user}:{password}@{host}:{port}/{db_name}"

MIGRATION = """
-- Update coupons table
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description TEXT;

-- Create fest_offers table
CREATE TABLE IF NOT EXISTS fest_offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount VARCHAR(50),
    color VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

async def run_migration():
    print(f"Connecting to {DB_URL} to run offers migration...")
    conn = await asyncpg.connect(DB_URL)
    await conn.execute(MIGRATION)
    print("Successfully ran offers migration.")
    await conn.close()

asyncio.run(run_migration())
