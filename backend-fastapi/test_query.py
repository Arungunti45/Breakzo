import asyncio
from database import db

async def test():
    await db.connect()
    try:
        import datetime
        from datetime import timedelta
        import random
        
        query = """
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '1 day' THEN total_amount ELSE 0 END) as daily,
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN total_amount ELSE 0 END) as weekly,
            SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN total_amount ELSE 0 END) as monthly
        FROM orders
        """
        row = await db.fetchrow(query)
        daily = float(row['daily'] or 0)
        weekly = float(row['weekly'] or 0)
        monthly = float(row['monthly'] or 0)
        total_orders = row['total_orders'] or 0
        
        chart_data = []
        for i in range(6, -1, -1):
            date_label = (datetime.datetime.now() - timedelta(days=i)).strftime('%a')
            base_val = max(100, (weekly / 7) if weekly > 0 else 500)
            chart_data.append({
                "name": date_label,
                "revenue": round(base_val * random.uniform(0.7, 1.3), 2)
            })

        chart_data[-1]['revenue'] = round(daily, 2)
        print("Success")
    except Exception as e:
        print("Error:", e)

asyncio.run(test())
