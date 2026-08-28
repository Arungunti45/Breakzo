import asyncpg
import asyncio

async def main():
    conn = await asyncpg.connect('postgres://postgres:Arunkumar%4045@localhost:5432/food_app_db')
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS waste_logs (
        id SERIAL PRIMARY KEY,
        item_name VARCHAR(255) NOT NULL,
        quantity_unsold INTEGER NOT NULL,
        reason VARCHAR(255),
        logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("Waste table created")
    await conn.close()

asyncio.run(main())
