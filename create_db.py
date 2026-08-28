import asyncpg, asyncio
async def make():
    conn = await asyncpg.connect('postgres://postgres:Arunkumar%4045@localhost:5432/postgres')
    await conn.execute('CREATE DATABASE food_app_db;')
    print("Database food_app_db created successfully.")
asyncio.run(make())
