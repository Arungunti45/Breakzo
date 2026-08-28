import socketio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import db
from routers import auth, canteens, menu, orders, ai
from routers import inventory, waste, analytics, payments, student, pickup, optimizer, wallet, offers
from contextlib import asynccontextmanager

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db.connect()
    yield
    # Shutdown
    await db.disconnect()

app = FastAPI(title="Smart Campus Food API (FastAPI)", lifespan=lifespan)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inject Socket.IO instance into FastAPI app state so routers can use it
app.state.sio = sio


@sio.event
async def connect(sid, environ):
    print(f"Client connected to Socket.IO: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected from Socket.IO: {sid}")

# Register Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(canteens.router, prefix="/api/canteens", tags=["canteens"])
app.include_router(menu.router, prefix="/api/menu_items", tags=["menu"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])
app.include_router(ai.router, prefix="/predict", tags=["ai"])

# New comprehensive modules
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])
app.include_router(waste.router, prefix="/api/waste", tags=["waste"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(student.router, prefix="/api/student", tags=["student"])
app.include_router(pickup.router, prefix="/api/pickup", tags=["pickup"])
app.include_router(optimizer.router, prefix="/api/optimizer", tags=["optimizer"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["wallet"])
app.include_router(offers.router, prefix="/api/offers", tags=["offers"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Smart Campus Food Operations FastAPI is running"}

@app.get("/api/migrate")
async def run_migration():
    try:
        await db.execute("ALTER TABLE menu_items ADD COLUMN image_url TEXT;")
        return {"status": "success", "message": "Column image_url added"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Wrap FastAPI with Socket.IO ASGI app
app = socketio.ASGIApp(sio, other_asgi_app=app)
