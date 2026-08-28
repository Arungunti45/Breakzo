import asyncpg, asyncio
async def test():
    passwords = ['postgres', 'admin', 'root', '1234', 'password', 'food_app']
    for p in passwords:
        try:
            await asyncpg.connect(f'postgres://postgres:{p}@localhost:5432/food_ops_db')
            print(f'Success with {p}')
            return
        except Exception as e:
            print(f'Failed {p}: {e}')
asyncio.run(test())
