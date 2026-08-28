from fastapi import APIRouter, HTTPException
from database import db
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter()

# Models
class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discount_percentage: Optional[float] = None
    max_discount_amount: Optional[float] = None
    valid_until: Optional[str] = None
    is_active: bool = True

class FestOfferCreate(BaseModel):
    title: str
    description: Optional[str] = None
    discount: Optional[str] = None
    color: Optional[str] = None
    is_active: bool = True

# --- Coupons ---

@router.get("/coupons")
async def get_coupons():
    query = "SELECT * FROM coupons WHERE is_active = true ORDER BY id DESC"
    records = await db.fetch(query)
    return [dict(r) for r in records]

@router.get("/coupons/all")
async def get_all_coupons():
    query = "SELECT * FROM coupons ORDER BY id DESC"
    records = await db.fetch(query)
    return [dict(r) for r in records]

@router.post("/coupons")
async def create_coupon(coupon: CouponCreate):
    try:
        query = """
            INSERT INTO coupons (code, description, discount_percentage, max_discount_amount, valid_until, is_active)
            VALUES ($1, $2, $3, $4, $5::timestamp, $6)
            RETURNING id
        """
        record = await db.fetchrow(
            query, 
            coupon.code, coupon.description, coupon.discount_percentage, 
            coupon.max_discount_amount, coupon.valid_until, coupon.is_active
        )
        return {"status": "success", "id": record['id'], "message": "Coupon created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: int):
    query = "DELETE FROM coupons WHERE id = $1"
    await db.execute(query, coupon_id)
    return {"status": "success", "message": "Coupon deleted"}

# --- Fest Offers ---

@router.get("/fest_offers")
async def get_fest_offers():
    query = "SELECT * FROM fest_offers WHERE is_active = true ORDER BY id DESC"
    records = await db.fetch(query)
    return [dict(r) for r in records]

@router.get("/fest_offers/all")
async def get_all_fest_offers():
    query = "SELECT * FROM fest_offers ORDER BY id DESC"
    records = await db.fetch(query)
    return [dict(r) for r in records]

@router.post("/fest_offers")
async def create_fest_offer(offer: FestOfferCreate):
    try:
        query = """
            INSERT INTO fest_offers (title, description, discount, color, is_active)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        """
        record = await db.fetchrow(
            query, 
            offer.title, offer.description, offer.discount, 
            offer.color, offer.is_active
        )
        return {"status": "success", "id": record['id'], "message": "Fest offer created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/fest_offers/{offer_id}")
async def delete_fest_offer(offer_id: int):
    query = "DELETE FROM fest_offers WHERE id = $1"
    await db.execute(query, offer_id)
    return {"status": "success", "message": "Fest offer deleted"}
