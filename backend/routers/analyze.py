"""
Router: /api/analyze — Upload video & tracking sesi analisis
"""
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.event import Event
from backend.models.session import AnalysisSession
from backend.services.vision_engine import process_video

router = APIRouter(prefix="/api", tags=["analyze"])

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "./storage/uploads"))
SCREENSHOT_DIR = Path(os.getenv("SCREENSHOT_DIR", "./storage/screenshots"))
MAX_UPLOAD_MB = int(os.getenv("MAX_UPLOAD_SIZE_MB", "200"))
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}


@router.post("/analyze")
async def start_analysis(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    location_name: str = Form(default=""),
    confidence_threshold: float = Form(default=0.6),
    recorded_at: str = Form(default=""),
    db: Session = Depends(get_db),
):
    """Upload video dan mulai analisis asinkron."""
    # Validasi ekstensi
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Format tidak didukung: {ext}. Gunakan MP4/AVI/MOV/MKV.")

    # Validasi ukuran (baca semua ke memory sementara untuk cek)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Buat record sesi dulu agar dapat ID
    db_session = AnalysisSession(
        original_filename=file.filename or "unknown",
        location_name=location_name or None,
        confidence_threshold=confidence_threshold,
        recorded_at=recorded_at or None,
        status="queued",
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    session_id = db_session.id

    # Simpan file dengan nama unik
    upload_path = UPLOAD_DIR / f"session_{session_id}{ext}"
    try:
        with open(upload_path, "wb") as f:
            total_bytes = 0
            chunk_size = 1024 * 1024  # 1 MB per chunk
            while chunk := await file.read(chunk_size):
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_MB * 1024 * 1024:
                    db_session.status = "failed"
                    db.commit()
                    upload_path.unlink(missing_ok=True)
                    raise HTTPException(413, f"File melebihi batas {MAX_UPLOAD_MB} MB.")
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        db_session.status = "failed"
        db.commit()
        raise HTTPException(500, f"Gagal menyimpan file: {e}")

    # Jalankan vision engine sebagai background task
    background_tasks.add_task(
        process_video,
        db=db,
        session_id=session_id,
        video_path=str(upload_path),
        confidence_threshold=confidence_threshold,
    )

    return {
        "session_id": session_id,
        "status": "queued",
        "message": "Video diterima. Analisis dimulai.",
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Ambil status & hasil sesi analisis."""
    db_session = db.get(AnalysisSession, session_id)
    if not db_session:
        raise HTTPException(404, "Sesi tidak ditemukan.")

    events = (
        db.query(Event)
        .filter(Event.session_id == session_id)
        .order_by(Event.video_timestamp_sec)
        .all()
    )

    return {
        "id": db_session.id,
        "original_filename": db_session.original_filename,
        "location_name": db_session.location_name,
        "status": db_session.status,
        "confidence_threshold": db_session.confidence_threshold,
        "video_duration_sec": db_session.video_duration_sec,
        "total_frames": db_session.total_frames,
        "frames_processed": db_session.frames_processed,
        "total_events": db_session.total_events,
        "recorded_at": db_session.recorded_at,
        "notes": db_session.notes,
        "created_at": db_session.created_at.isoformat() if db_session.created_at else None,
        "completed_at": db_session.completed_at.isoformat() if db_session.completed_at else None,
        "events": [
            {
                "id": e.id,
                "category": e.category,
                "confidence_score": e.confidence_score,
                "video_timestamp_sec": e.video_timestamp_sec,
                "screenshot_path": e.screenshot_path,
                "detected_objects": e.detected_objects,
                "status": e.status,
                "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None,
            }
            for e in events
        ],
    }


@router.get("/sessions")
def list_sessions(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """Daftar sesi analisis terbaru."""
    sessions = (
        db.query(AnalysisSession)
        .order_by(AnalysisSession.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    total = db.query(AnalysisSession).count()
    return {
        "total": total,
        "items": [
            {
                "id": s.id,
                "original_filename": s.original_filename,
                "location_name": s.location_name,
                "status": s.status,
                "total_events": s.total_events,
                "notes": s.notes,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in sessions
        ],
    }

class SessionStatusUpdate(BaseModel):
    status: str
    notes: str = ""

@router.patch("/sessions/{session_id}/status")
def update_session_status(
    session_id: int,
    body: SessionStatusUpdate,
    db: Session = Depends(get_db),
):
    valid_statuses = {"pending", "in_progress", "resolved", "completed"}
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Status tidak valid. Pilihan: {valid_statuses}")
    
    db_session = db.get(AnalysisSession, session_id)
    if not db_session:
        raise HTTPException(404, "Sesi tidak ditemukan.")
    
    db_session.status = body.status
    if body.notes:
        db_session.notes = body.notes

    db.commit()
    db.refresh(db_session)
    return {"id": db_session.id, "status": db_session.status, "notes": db_session.notes}
