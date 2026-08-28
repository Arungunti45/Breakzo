import asyncio
import os
import asyncpg
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

user = os.getenv('POSTGRES_USER', 'postgres')
password = quote_plus(os.getenv('POSTGRES_PASSWORD', ''))
host = os.getenv('POSTGRES_HOST', 'localhost')
port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'food_app_db')

DB_URL = f"postgres://{user}:{password}@{host}:{port}/{db_name}"

async def main():
    conn = await asyncpg.connect(DB_URL)
    try:
        await conn.execute("ALTER TABLE menu_items ADD COLUMN image_url TEXT;")
        print("Column image_url added.")
    except Exception as e:
        print("Error:", e)
    finally:
        await conn.close()

asyncio.run(main())
