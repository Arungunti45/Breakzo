from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from datetime import datetime

router = APIRouter()

class TopupRequest(BaseModel):
    amount: float

@router.get("/{user_id}")
async def get_wallet(user_id: int):
    try:
        # First check if wallet exists, if not, create it
        wallet = await db.fetchrow("SELECT * FROM wallets WHERE user_id = $1", user_id)
        if not wallet:
            wallet = await db.fetchrow(
                "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *",
                user_id, 0.0
            )
            
        transactions = await db.fetch(
            "SELECT * FROM transactions WHERE wallet_id = $1 ORDER BY created_at DESC", 
            wallet['id']
        )
        
        return {
            "balance": float(wallet['balance']),
            "transactions": [dict(t) for t in transactions]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{user_id}/topup")
async def topup_wallet(user_id: int, req: TopupRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid topup amount")
        
    try:
        async with db.pool.acquire() as conn:
            async with conn.transaction():
                wallet = await conn.fetchrow("SELECT * FROM wallets WHERE user_id = $1", user_id)
                if not wallet:
                    wallet = await conn.fetchrow(
                        "INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *",
                        user_id, 0.0
                    )
                
                # Update balance
                updated = await conn.fetchrow(
                    "UPDATE wallets SET balance = balance + $1 WHERE id = $2 RETURNING balance",
                    req.amount, wallet['id']
                )
                
                # Insert transaction log
                await conn.execute(
                    "INSERT INTO transactions (wallet_id, amount, transaction_type, status, created_at) VALUES ($1, $2, $3, $4, $5)",
                    wallet['id'], req.amount, 'topup', 'completed', datetime.now()
                )
                
                # Optionally sync to user.wallet_balance if used elsewhere
                await conn.execute("UPDATE users SET wallet_balance = $1 WHERE id = $2", updated['balance'], user_id)
                
                return {"message": "Topup successful", "new_balance": float(updated['balance'])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
