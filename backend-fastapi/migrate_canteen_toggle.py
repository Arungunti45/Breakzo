import asyncio
import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

from urllib.parse import quote_plus

async def run_migration():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = quote_plus(os.getenv("POSTGRES_PASSWORD", "Arunkumar@45"))
    host = os.getenv("POSTGRES_HOST", "localhost")
    port = os.getenv("POSTGRES_PORT", "5432")
    db = os.getenv("POSTGRES_DB", "food_app_db")
    
    DATABASE_URL = f"postgres://{user}:{password}@{host}:{port}/{db}"
        
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        # Check if column exists
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='canteens' and column_name='is_manually_closed';
        """
        result = await conn.fetchval(check_query)
        
        if not result:
            print("Adding is_manually_closed column to canteens table...")
            await conn.execute("""
                ALTER TABLE canteens 
                ADD COLUMN is_manually_closed BOOLEAN DEFAULT FALSE;
            """)
            print("Migration successful.")
        else:
            print("Column already exists.")
            
        await conn.close()
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
