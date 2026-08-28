import asyncpg, asyncio
async def test():
    try:
        conn = await asyncpg.connect('postgres://postgres:Arunkumar%4045@localhost:5432/postgres')
        rows = await conn.fetch('SELECT datname FROM pg_database WHERE datistemplate = false;')
        print('Databases:', [r['datname'] for r in rows])
    except Exception as e:
        print(f'Failed: {e}')
asyncio.run(test())
