from fastapi import APIRouter, HTTPException
from database import db

router = APIRouter()

@router.get("/profile/{user_id}")
async def get_student_profile(user_id: int):
    try:
        user = await db.fetchrow("SELECT id, name, mobile_number, role FROM users WHERE id = $1", user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        orders = await db.fetch("SELECT id, total_amount, status FROM orders WHERE user_id = $1 ORDER BY id DESC LIMIT 5", user_id)
        
        return {
            "user_id": user['id'],
            "name": user['name'],
            "mobile_number": user['mobile_number'],
            "role": user['role'],
            "recent_orders": [
                {
                    "order_id": o['id'],
                    "total_amount": float(o['total_amount']),
                    "status": o['status']
                } for o in orders
            ]
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/favorites/{user_id}")
async def get_student_favorites(user_id: int):
    try:
        # Get actual favorites by calculating most ordered items for this user
        query = """
            SELECT mi.id as menu_item_id, mi.name, SUM(oi.quantity) as order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.user_id = $1
            GROUP BY mi.id, mi.name
            ORDER BY order_count DESC
            LIMIT 3
        """
        rows = await db.fetch(query, user_id)
        favorites = [
            {"menu_item_id": r['menu_item_id'], "name": r['name'], "order_count": r['order_count']}
            for r in rows
        ]
        
        return {"favorites": favorites}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{user_id}")
async def get_student_orders(user_id: int):
    try:
        # Get orders
        order_rows = await db.fetch("SELECT id, canteen_id, total_amount, status, created_at, coupon_code, estimated_wait_time FROM orders WHERE user_id = $1 ORDER BY created_at DESC", user_id)
        
        # Get items for these orders
        if not order_rows:
            return []
            
        order_ids = [r['id'] for r in order_rows]
        items_query = """
            SELECT oi.order_id, oi.quantity, oi.price_at_time, mi.name as item_name
            FROM order_items oi
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE oi.order_id = ANY($1)
        """
        item_rows = await db.fetch(items_query, order_ids)
        
        # Group items by order
        items_by_order = {}
        for item in item_rows:
            oid = item['order_id']
            if oid not in items_by_order:
                items_by_order[oid] = []
            items_by_order[oid].append({
                "item_name": item['item_name'],
                "quantity": item['quantity'],
                "price": float(item['price_at_time'])
            })
            
        orders = []
        for o in order_rows:
            orders.append({
                "order_id": o['id'],
                "canteen_id": o['canteen_id'],
                "total_amount": float(o['total_amount']),
                "status": o['status'],
                "created_at": o['created_at'].isoformat() if o['created_at'] else None,
                "estimated_wait_time": o.get('estimated_wait_time', 0),
                "coupon_code": o['coupon_code'],
                "items": items_by_order.get(o['id'], [])
            })
            
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/reviews/{user_id}")
async def get_student_reviews(user_id: int):
    try:
        query = """
            SELECT r.id, r.rating, r.comment, r.created_at, mi.name as item_name, c.name as canteen_name
            FROM reviews r
            JOIN menu_items mi ON r.menu_item_id = mi.id
            JOIN canteens c ON mi.canteen_id = c.id
            WHERE r.user_id = $1
            ORDER BY r.created_at DESC
        """
        rows = await db.fetch(query, user_id)
        
        reviews = []
        for r in rows:
            reviews.append({
                "id": r['id'],
                "item_name": r['item_name'],
                "canteen_name": r['canteen_name'],
                "rating": r['rating'],
                "comment": r['comment'],
                "created_at": r['created_at'].isoformat() if r['created_at'] else None
            })
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
