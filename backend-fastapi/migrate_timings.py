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
-- Add opening and closing times to canteens
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS opening_time TIME DEFAULT '08:00:00';
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS closing_time TIME DEFAULT '22:00:00';
"""

async def run_migrations():
    print(f"Connecting to {DB_URL}")
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute(MIGRATION)
        print("Successfully added timings to canteens.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(run_migrations())
