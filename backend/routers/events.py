"""
Router: /api/events — CRUD event deteksi
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.event import Event

router = APIRouter(prefix="/api/events", tags=["events"])


class EventStatusUpdate(BaseModel):
    status: str   # pending | in_progress | resolved
    notes: str = ""


@router.get("")
def list_events(
    session_id: int | None = Query(default=None),
    camera_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Daftar event dengan filter opsional."""
    q = db.query(Event).order_by(Event.occurred_at.desc())
    if session_id is not None:
        q = q.filter(Event.session_id == session_id)
    if camera_id is not None:
        q = q.filter(Event.camera_id == camera_id)
    if status:
        q = q.filter(Event.status == status)

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "items": [_serialize(e) for e in items],
    }


@router.get("/{event_id}")
def get_event(event_id: int, db: Session = Depends(get_db)):
    """Detail satu event."""
    e = db.get(Event, event_id)
    if not e:
        raise HTTPException(404, "Event tidak ditemukan.")
    return _serialize(e)


@router.patch("/{event_id}/status")
def update_event_status(
    event_id: int,
    body: EventStatusUpdate,
    db: Session = Depends(get_db),
):
    """Update status penanganan event oleh petugas."""
    valid_statuses = {"pending", "in_progress", "resolved"}
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Status tidak valid. Pilihan: {valid_statuses}")

    e = db.get(Event, event_id)
    if not e:
        raise HTTPException(404, "Event tidak ditemukan.")

    e.status = body.status
    if body.notes:
        e.notes = body.notes
    if body.status == "resolved" and e.resolved_at is None:
        from datetime import datetime, timezone
        e.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(e)
    return _serialize(e)


def _serialize(e: Event) -> dict:
    return {
        "id": e.id,
        "session_id": e.session_id,
        "camera_id": e.camera_id,
        "category": e.category,
        "confidence_score": e.confidence_score,
        "screenshot_path": e.screenshot_path,
        "detected_objects": e.detected_objects,
        "video_timestamp_sec": e.video_timestamp_sec,
        "status": e.status,
        "notes": e.notes,
        "occurred_at": e.occurred_at.isoformat() if e.occurred_at else None,
        "resolved_at": e.resolved_at.isoformat() if e.resolved_at else None,
    }
