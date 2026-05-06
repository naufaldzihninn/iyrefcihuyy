"""
FastAPI main application — AquaWatch AI Backend
"""
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load .env sebelum import lainnya
load_dotenv(Path(__file__).parent / ".env")

from backend.database import create_tables
from backend.routers import analyze, cameras, events
from backend.services.websocket_manager import ws_manager

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

SCREENSHOT_DIR = Path(os.getenv("SCREENSHOT_DIR", "./storage/screenshots"))
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./storage/uploads"))

# Buat direktori sebelum app diinisialisasi (StaticFiles butuh dir sudah ada)
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    create_tables()
    print("✅ AquaWatch AI Backend siap.")
    yield
    # Shutdown — cleanup jika diperlukan


app = FastAPI(
    title="AquaWatch AI",
    description="API Backend Sistem Pemantauan Sampah Sungai",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static files (screenshot hasil deteksi) ─────────────────────────────────
app.mount(
    "/screenshots",
    StaticFiles(directory=str(SCREENSHOT_DIR)),
    name="screenshots",
)

# ─── Routers ─────────────────────────────────────────────────────────────────
app.include_router(analyze.router)
app.include_router(events.router)
app.include_router(cameras.router)


# ─── WebSocket endpoint ───────────────────────────────────────────────────────
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    Client connect ke sini untuk menerima progress real-time.
    session_id bisa berupa ID sesi analisis atau ID kamera.
    """
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            # Tunggu pesan dari client (ping/pong untuk keep-alive)
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "AquaWatch AI"}


@app.get("/")
def root():
    return {"message": "AquaWatch AI Backend v1.0. Docs: /docs"}
