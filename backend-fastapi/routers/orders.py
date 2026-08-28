from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional
from database import db
from routers.ai import predict_wait_time
import uuid
from datetime import datetime
import json

router = APIRouter()

class OrderItem(BaseModel):
    menu_item_id: int
    quantity: int
    price: float
    selected_options: dict = {}

class CreateOrderRequest(BaseModel):
    user_id: int
    canteen_id: int
    total_amount: float
    items: List[OrderItem]
    pickup_slot_id: Optional[int] = None
    payment_method: str = "online"
    coupon_code: Optional[str] = None
    original_amount: Optional[float] = None
    is_preorder: bool = False
    scheduled_pickup_time: Optional[str] = None

class UpdateOrderStatusRequest(BaseModel):
    status: str

@router.get("/capacity")
async def get_kitchen_capacity():
    try:
        active_orders_row = await db.fetchrow("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing')")
        active_orders_count = active_orders_row['count'] if active_orders_row else 0
        
        # Assuming 20 is the max active orders the kitchen can handle at once
        MAX_CAPACITY = 20
        is_full = active_orders_count >= MAX_CAPACITY
        
        return {
            "active_orders": active_orders_count,
            "max_capacity": MAX_CAPACITY,
            "is_full": is_full
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/active")
async def get_active_orders():
    try:
        query = """
            SELECT o.id as order_id, o.canteen_id, o.total_amount, o.status, 
                   o.coupon_code, o.original_amount,
                   u.name, u.mobile_number, o.created_at,
                   o.is_preorder, o.scheduled_pickup_time
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.status IN ('pending', 'accepted', 'preparing', 'ready')
            ORDER BY o.id DESC
        """
        rows = await db.fetch(query)
        orders = []
        for row in rows:
            orders.append({
                'order_id': row['order_id'],
                'canteen_id': row['canteen_id'],
                'total_amount': float(row['total_amount']),
                'status': row['status'],
                'coupon_code': row['coupon_code'],
                'original_amount': float(row['original_amount']) if row['original_amount'] else None,
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'is_preorder': row.get('is_preorder', False),
                'scheduled_pickup_time': row['scheduled_pickup_time'].isoformat() if row.get('scheduled_pickup_time') else None,
                'user': {
                    'name': row['name'],
                    'mobile_number': row['mobile_number']
                }
            })
        return orders
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_order(req: Request, order: CreateOrderRequest):
    try:
        # Start transaction
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                user_row = await conn.fetchrow('SELECT name, mobile_number FROM users WHERE id = $1', order.user_id)
                
                # Handle wallet payment
                if order.payment_method == "wallet":
                    wallet = await conn.fetchrow("SELECT * FROM wallets WHERE user_id = $1", order.user_id)
                    if not wallet or wallet['balance'] < order.total_amount:
                        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
                    
                    # Deduct balance
                    updated_wallet = await conn.fetchrow(
                        "UPDATE wallets SET balance = balance - $1 WHERE id = $2 RETURNING balance",
                        order.total_amount, wallet['id']
                    )
                    
                    # Log transaction
                    await conn.execute(
                        "INSERT INTO transactions (wallet_id, amount, transaction_type, status, created_at) VALUES ($1, $2, $3, $4, $5)",
                        wallet['id'], -order.total_amount, 'payment', 'completed', datetime.now()
                    )
                    
                    # Optional sync to users table
                    await conn.execute("UPDATE users SET wallet_balance = $1 WHERE id = $2", updated_wallet['balance'], order.user_id)
                
                # 2. Get active orders for AI Wait Time Prediction
                active_orders_row = await conn.fetchrow("SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'preparing')")
                active_orders_count = active_orders_row['count'] if active_orders_row else 0
                
                # Fetch wait time from AI module directly
                wait_prediction = await predict_wait_time(active_orders=active_orders_count)
                predicted_wait = wait_prediction["estimated_wait_minutes"]

                import random
                qr_code = str(random.randint(100000, 999999))
                
                # 3. Create Order
                order_row = await conn.fetchrow(
                    'INSERT INTO orders (user_id, canteen_id, total_amount, estimated_wait_time, pickup_slot_id, qr_code, coupon_code, original_amount, is_preorder, scheduled_pickup_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, created_at',
                    order.user_id, order.canteen_id, order.total_amount, predicted_wait, order.pickup_slot_id, qr_code, order.coupon_code, order.original_amount,
                    order.is_preorder,
                    datetime.fromisoformat(order.scheduled_pickup_time.replace("Z", "+00:00")).replace(tzinfo=None) if order.scheduled_pickup_time else None
                )
                order_id = order_row['id']
                created_at = order_row['created_at'].isoformat() if order_row['created_at'] else None
                
                # Increment bookings for the pickup slot if selected
                if order.pickup_slot_id:
                    await conn.execute('UPDATE pickup_slots SET current_bookings = current_bookings + 1 WHERE id = $1', order.pickup_slot_id)

                # 4. Insert Items and Deduct Stock
                for item in order.items:
                    await conn.execute(
                        'INSERT INTO order_items (order_id, menu_item_id, quantity, price_at_time, selected_options) VALUES ($1, $2, $3, $4, $5)',
                        order_id, item.menu_item_id, item.quantity, item.price, json.dumps(item.selected_options)
                    )
                    
                    stock_row = await conn.fetchrow(
                        'UPDATE menu_items SET stock_quantity = stock_quantity - $1 WHERE id = $2 RETURNING stock_quantity, name',
                        item.quantity, item.menu_item_id
                    )
                    
                    if stock_row and stock_row['stock_quantity'] < 10:
                        sio = req.app.state.sio
                        await sio.emit('low_stock_alert', {
                            'menu_item_id': item.menu_item_id,
                            'name': stock_row['name'],
                            'remaining_stock': stock_row['stock_quantity'],
                            'canteen_id': order.canteen_id
                        })

        # Emit new order to kitchen dashboard (outside transaction so we know it committed)
        sio = req.app.state.sio
        await sio.emit('new_order', {
            'order_id': order_id,
            'canteen_id': order.canteen_id,
            'total_amount': order.total_amount,
            'items': [i.dict() for i in order.items],
            'status': 'pending',
            'coupon_code': order.coupon_code,
            'original_amount': order.original_amount,
            'created_at': created_at,
            'is_preorder': order.is_preorder,
            'scheduled_pickup_time': order.scheduled_pickup_time if order.scheduled_pickup_time else None,
            'user': {
                'name': user_row['name'] if user_row else 'Unknown',
                'mobile_number': user_row['mobile_number'] if user_row else 'N/A'
            }
        })

        return {"message": "Order placed successfully", "order_id": order_id, "qr_code": qr_code}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}/status")
async def update_order_status(id: int, req: Request, update: UpdateOrderStatusRequest):
    try:
        await db.execute('UPDATE orders SET status = $1 WHERE id = $2', update.status, id)
        sio = req.app.state.sio

        if update.status == 'preparing':
            # Deduct ingredient stock when preparation starts
            order = await db.fetchrow("SELECT canteen_id FROM orders WHERE id = $1", id)
            if order:
                order_items = await db.fetch("SELECT menu_item_id, quantity FROM order_items WHERE order_id = $1", id)
                for item in order_items:
                    recipe_items = await db.fetch("SELECT ingredient_id, quantity_required FROM recipe_items WHERE menu_item_id = $1", item['menu_item_id'])
                    for recipe in recipe_items:
                        total_deduct = float(recipe['quantity_required']) * item['quantity']
                        stock_row = await db.fetchrow(
                            "UPDATE ingredients SET current_stock = current_stock - $1 WHERE id = $2 RETURNING current_stock, name, minimum_stock",
                            total_deduct, recipe['ingredient_id']
                        )
                        if stock_row and stock_row['current_stock'] <= stock_row['minimum_stock']:
                            await sio.emit('low_ingredient_alert', {
                                'ingredient_id': recipe['ingredient_id'],
                                'name': stock_row['name'],
                                'current_stock': stock_row['current_stock'],
                                'canteen_id': order['canteen_id']
                            })
        
        # Notify tracking screen
        await sio.emit('order_updated', {
            'order_id': id,
            'status': update.status
        })
        
        # Notify kitchen dashboard
        await sio.emit('order_status_updated', {
            'order_id': id,
            'status': update.status
        })

        return {"message": "Order status updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_order(id: int):
    try:
        row = await db.fetchrow('SELECT status, qr_code, estimated_wait_time, created_at FROM orders WHERE id = $1', id)
        if row:
            return {"status": row['status'], "qr_code": row['qr_code'], "estimated_wait_time": row['estimated_wait_time'], "created_at": row['created_at'].isoformat() if row['created_at'] else None}
        raise HTTPException(status_code=404, detail="Order not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_order(id: int):
    try:
        await db.execute('DELETE FROM order_items WHERE order_id = $1', id)
        await db.execute('DELETE FROM orders WHERE id = $1', id)
        return {"message": "Order deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
