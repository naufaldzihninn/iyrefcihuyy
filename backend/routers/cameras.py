"""
Router: /api/cameras — CRUD kamera
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.camera import Camera

router = APIRouter(prefix="/api/cameras", tags=["cameras"])


class CameraCreate(BaseModel):
    name: str
    stream_url: str = ""
    latitude: float = 0.0
    longitude: float = 0.0
    confidence_threshold: float = 0.6


class CameraUpdate(BaseModel):
    name: str | None = None
    stream_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    confidence_threshold: float | None = None
    is_active: bool | None = None


@router.get("")
def list_cameras(db: Session = Depends(get_db)):
    cameras = db.query(Camera).order_by(Camera.created_at.desc()).all()
    return [_serialize(c) for c in cameras]


@router.post("", status_code=201)
def create_camera(body: CameraCreate, db: Session = Depends(get_db)):
    cam = Camera(**body.model_dump())
    db.add(cam)
    db.commit()
    db.refresh(cam)
    return _serialize(cam)


@router.get("/{camera_id}")
def get_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.get(Camera, camera_id)
    if not cam:
        raise HTTPException(404, "Kamera tidak ditemukan.")
    return _serialize(cam)


@router.patch("/{camera_id}")
def update_camera(camera_id: int, body: CameraUpdate, db: Session = Depends(get_db)):
    cam = db.get(Camera, camera_id)
    if not cam:
        raise HTTPException(404, "Kamera tidak ditemukan.")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(cam, field, value)
    db.commit()
    db.refresh(cam)
    return _serialize(cam)


@router.delete("/{camera_id}", status_code=204)
def delete_camera(camera_id: int, db: Session = Depends(get_db)):
    cam = db.get(Camera, camera_id)
    if not cam:
        raise HTTPException(404, "Kamera tidak ditemukan.")
    db.delete(cam)
    db.commit()


def _serialize(c: Camera) -> dict:
    return {
        "id": c.id,
        "name": c.name,
        "stream_url": c.stream_url,
        "latitude": c.latitude,
        "longitude": c.longitude,
        "confidence_threshold": c.confidence_threshold,
        "is_active": c.is_active,
        "created_at": c.created_at.isoformat() if c.created_at else None,
        "last_seen_at": c.last_seen_at.isoformat() if c.last_seen_at else None,
    }
