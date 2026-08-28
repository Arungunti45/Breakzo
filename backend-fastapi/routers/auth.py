from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from database import db

SECRET_KEY = "super_secret_jwt_key_for_smart_campus" # In production, use env var
ALGORITHM = "HS256"

router = APIRouter()

class SendOTPRequest(BaseModel):
    mobile_number: str

class VerifyOTPRequest(BaseModel):
    name: str
    mobile_number: str
    otp: str

@router.post("/send-otp")
async def send_otp(request: SendOTPRequest):
    return {"message": f"OTP sent to {request.mobile_number} successfully", "mock_otp": "1234"}

@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    if request.otp != "1234":
        raise HTTPException(status_code=401, detail="Invalid OTP")

    try:
        # Check if user exists
        user = await db.fetchrow("SELECT * FROM users WHERE mobile_number = $1", request.mobile_number)
        
        if not user:
            # Create new user
            role = "admin" if "admin" in request.name.lower() else "student"
            user = await db.fetchrow(
                "INSERT INTO users (name, mobile_number, role) VALUES ($1, $2, $3) RETURNING *",
                request.name, request.mobile_number, role
            )

        # Generate JWT
        expire = datetime.utcnow() + timedelta(days=7)
        to_encode = {"exp": expire, "user_id": user['id'], "role": user['role']}
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

        return {
            "token": encoded_jwt,
            "user": {
                "id": user['id'],
                "name": user['name'],
                "mobile_number": user['mobile_number'],
                "role": user['role']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
