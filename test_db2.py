import asyncpg, asyncio
async def test():
    try:
        await asyncpg.connect('postgres://postgres:Arunkumar%4045@localhost:5432/food_ops_db')
        print('Success')
    except Exception as e:
        print(f'Failed: {e}')
asyncio.run(test())
