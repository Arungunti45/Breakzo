from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import db

router = APIRouter()

class ReviewCreate(BaseModel):
    user_id: int
    rating: int
    comment: str = None

@router.get("/")
async def get_canteens():
    try:
        rows = await db.fetch("SELECT * FROM canteens")
        canteens = []
        for r in rows:
            c = dict(r)
            if 'opening_time' in c and c['opening_time']:
                c['opening_time'] = c['opening_time'].strftime("%H:%M:%S")
            if 'closing_time' in c and c['closing_time']:
                c['closing_time'] = c['closing_time'].strftime("%H:%M:%S")
            canteens.append(c)
        return canteens
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ToggleStatusRequest(BaseModel):
    is_manually_closed: bool

@router.post("/{id}/toggle-status")
async def toggle_canteen_status(id: int, request: ToggleStatusRequest, req: Request):
    try:
        await db.execute(
            "UPDATE canteens SET is_manually_closed = $1 WHERE id = $2",
            request.is_manually_closed, id
        )
        # Emit real-time event to all connected clients
        sio = req.app.state.sio
        await sio.emit('canteen_status_updated', {
            'canteen_id': id,
            'is_manually_closed': request.is_manually_closed
        })
        return {"message": "Canteen status updated successfully", "is_manually_closed": request.is_manually_closed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import json

@router.get("/{id}/menu")
async def get_canteen_menu(id: int):
    try:
        rows = await db.fetch("SELECT * FROM menu_items WHERE canteen_id = $1", id)
        menu = []
        for r in rows:
            d = dict(r)
            if isinstance(d.get('customization_options'), str):
                try:
                    d['customization_options'] = json.loads(d['customization_options'])
                except:
                    d['customization_options'] = {"sizes": [], "addons": []}
            menu.append(d)
        return menu
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/menu/{item_id}/details")
async def get_menu_item_details(id: int, item_id: int):
    try:
        # Fetch ingredients
        ingredient_rows = await db.fetch("""
            SELECT i.name, i.unit, ri.quantity_required 
            FROM recipe_items ri
            JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.menu_item_id = $1
        """, item_id)
        ingredients = [dict(r) for r in ingredient_rows]

        # Fetch reviews
        review_rows = await db.fetch("""
            SELECT r.rating, r.comment, r.created_at, u.name as user_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.menu_item_id = $1
            ORDER BY r.created_at DESC
        """, item_id)
        reviews = [dict(r) for r in review_rows]

        # Calculate average rating
        avg_rating = 0
        if reviews:
            avg_rating = sum(r['rating'] for r in reviews) / len(reviews)

        return {
            "ingredients": ingredients,
            "reviews": reviews,
            "average_rating": round(avg_rating, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/menu/{item_id}/reviews")
async def add_menu_item_review(id: int, item_id: int, review: ReviewCreate):
    try:
        from datetime import datetime
        await db.execute(
            "INSERT INTO reviews (menu_item_id, user_id, rating, comment, created_at) VALUES ($1, $2, $3, $4, $5)",
            item_id, review.user_id, review.rating, review.comment, datetime.now()
        )
        return {"message": "Review added successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}/reviews")
async def get_canteen_reviews(id: int):
    try:
        query = """
            SELECT r.id, r.rating, r.comment, r.created_at, 
                   u.name as user_name, u.mobile_number,
                   mi.name as item_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            JOIN menu_items mi ON r.menu_item_id = mi.id
            WHERE mi.canteen_id = $1
            ORDER BY r.created_at DESC
        """
        rows = await db.fetch(query, id)
        
        reviews = []
        for r in rows:
            reviews.append({
                "id": r['id'],
                "rating": r['rating'],
                "comment": r['comment'],
                "created_at": r['created_at'].isoformat() if r['created_at'] else None,
                "user_name": r['user_name'] or 'Anonymous',
                "mobile_number": r['mobile_number'] or 'N/A',
                "item_name": r['item_name']
            })
        return reviews
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
