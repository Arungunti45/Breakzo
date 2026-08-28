import os
import asyncpg
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv()

# We'll use the PostgreSQL database URL setup from .env explicitly
user = os.getenv('POSTGRES_USER', 'postgres')
password = quote_plus(os.getenv('POSTGRES_PASSWORD', ''))
host = os.getenv('POSTGRES_HOST', 'localhost')
port = os.getenv('POSTGRES_PORT', '5432')
db_name = os.getenv('POSTGRES_DB', 'food_app_db')

DB_URL = f"postgres://{user}:{password}@{host}:{port}/{db_name}"

class Database:
    def __init__(self):
        self.pool = None

    async def connect(self):
        self.pool = await asyncpg.create_pool(DB_URL)
        print("Connected to PostgreSQL (FastAPI Asyncpg)")

    async def disconnect(self):
        if self.pool:
            await self.pool.close()
            print("Disconnected from PostgreSQL")

    async def fetch(self, query: str, *args):
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)

    async def fetchrow(self, query: str, *args):
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)

    async def execute(self, query: str, *args):
        async with self.pool.acquire() as connection:
            return await connection.execute(query, *args)

db = Database()
