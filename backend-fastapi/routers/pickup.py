from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import db
import uuid
from datetime import datetime, date, timedelta

router = APIRouter()

class VerifyQRRequest(BaseModel):
    qr_data: str
    counter_id: int

@router.get("/slots/{canteen_id}")
async def get_pickup_slots(canteen_id: int):
    try:
        # Fetch active slots for this canteen
        query = """
            SELECT id, start_time, end_time, max_capacity, current_bookings
            FROM pickup_slots
            WHERE canteen_id = $1 AND is_active = true
            ORDER BY start_time ASC
        """
        rows = await db.fetch(query, canteen_id)
        
        # If no slots exist, generate some dummy ones for today for the demo
        if not rows:
            await generate_dummy_slots(canteen_id)
            rows = await db.fetch(query, canteen_id)

        # Get active kitchen workload to dynamically adjust capacity
        row = await db.fetchrow("SELECT COUNT(*) FROM orders WHERE canteen_id = $1 AND status IN ('pending', 'accepted', 'preparing')", canteen_id)
        active_orders = row['count'] if row else 0
        
        # dynamic penalty: for every 10 active orders, reduce max capacity by 5 (just a simple mock logic)
        capacity_penalty = (active_orders // 10) * 5

        slots = []
        for r in rows:
            adjusted_max = max(5, r['max_capacity'] - capacity_penalty)
            remaining = adjusted_max - r['current_bookings']
            if remaining < 0:
                remaining = 0
                
            capacity_status = "full"
            if remaining > 10:
                capacity_status = "low"
            elif remaining > 0:
                capacity_status = "medium"

            slots.append({
                "id": r['id'],
                "time": f"{r['start_time'].strftime('%I:%M %p')} - {r['end_time'].strftime('%I:%M %p')}",
                "capacity": capacity_status,
                "remaining": remaining,
                "estimated_wait": 5 if capacity_status == "low" else (10 if capacity_status == "medium" else 25)
            })

        return {
            "canteen_id": canteen_id,
            "available_slots": slots
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_dummy_slots(canteen_id: int):
    # Generates some slots from 10:00 to 14:00
    from datetime import time
    times = [
        (time(10, 0), time(10, 30)),
        (time(10, 30), time(11, 0)),
        (time(11, 0), time(11, 30)),
        (time(11, 30), time(12, 0)),
        (time(12, 0), time(12, 30)),
        (time(12, 30), time(13, 0)),
        (time(13, 0), time(13, 30)),
        (time(13, 30), time(14, 0))
    ]
    for st, et in times:
        await db.execute(
            "INSERT INTO pickup_slots (canteen_id, start_time, end_time, max_capacity, current_bookings, is_active) VALUES ($1, $2, $3, 30, 0, true)",
            canteen_id, st, et
        )

@router.post("/verify")
async def verify_pickup_qr(req: Request, request: VerifyQRRequest):
    try:
        # Check if the QR code is valid
        order = await db.fetchrow(
            "SELECT id, status, qr_verified FROM orders WHERE qr_code = $1", 
            request.qr_data
        )

        if not order:
            raise HTTPException(status_code=400, detail="Invalid Pickup code")

        if order['qr_verified']:
            raise HTTPException(status_code=400, detail="Pickup code has already been used")

        if order['status'] != 'ready':
            raise HTTPException(status_code=400, detail=f"Order is {order['status']}, not ready for pickup yet")

        # Deduct ingredient stock based on recipe
        order_items = await db.fetch("SELECT menu_item_id, quantity FROM order_items WHERE order_id = $1", order['id'])
        for item in order_items:
            recipe_items = await db.fetch("SELECT ingredient_id, quantity_required FROM recipe_items WHERE menu_item_id = $1", item['menu_item_id'])
            for recipe in recipe_items:
                total_deduct = float(recipe['quantity_required']) * item['quantity']
                await db.execute(
                    "UPDATE ingredients SET current_stock = current_stock - $1 WHERE id = $2",
                    total_deduct, recipe['ingredient_id']
                )

        # Mark as verified and completed
        await db.execute(
            "UPDATE orders SET qr_verified = true, status = 'completed', actual_pickup_time = $1 WHERE id = $2",
            datetime.now(), order['id']
        )
        
        sio = req.app.state.sio
        await sio.emit('order_status_updated', {
            'order_id': order['id'],
            'status': 'completed'
        })
        await sio.emit('order_updated', {
            'order_id': order['id'],
            'status': 'completed'
        })

        return {
            "message": "Code Verified successfully",
            "order_id": order['id'],
            "counter_assigned": request.counter_id
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
