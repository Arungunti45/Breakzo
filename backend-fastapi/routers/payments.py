from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db

router = APIRouter()

class AddFundsRequest(BaseModel):
    user_id: int
    amount: float
    payment_method: str

class RefundRequest(BaseModel):
    order_id: int

# Wallet endpoints removed
@router.get("/refunds/pending")
async def get_pending_refunds():
    try:
        query = """
            SELECT o.id as order_id, o.total_amount, o.status, 
                   u.id as user_id, u.name, u.mobile_number
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.status = 'cancelled'
            ORDER BY o.id DESC
        """
        rows = await db.fetch(query)
        return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refund")
async def process_refund(request: RefundRequest):
    try:
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                # Get the order
                order = await conn.fetchrow("SELECT user_id, total_amount, status FROM orders WHERE id = $1", request.order_id)
                if not order:
                    raise HTTPException(status_code=404, detail="Order not found")
                if order['status'] != 'cancelled':
                    raise HTTPException(status_code=400, detail="Only cancelled orders can be refunded")
                
                # Wallet update removed. Assuming refund to external payment provider.
                
                # Mark order as refunded
                await conn.execute("UPDATE orders SET status = 'refunded' WHERE id = $1", request.order_id)
                
        return {"message": f"Refund of ${order['total_amount']} processed successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
