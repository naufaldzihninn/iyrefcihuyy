"""
Vision Engine — YOLOv8 inference pipeline untuk mode video upload.

Alur:
  1. Terima path file video + konfigurasi sesi
  2. Buka video dengan OpenCV frame-by-frame
  3. Setiap FRAME_SKIP frame → inferensikan dengan YOLOv8
  4. Jika deteksi melebihi threshold → buat event (dengan deduplication 2-4 dtk)
  5. Broadcast progress via WebSocket setiap N frame
  6. Simpan screenshot frame dengan bounding box terannotasi
  7. Setelah selesai → update status sesi ke 'completed'
"""

import asyncio
import base64
import io
import os
import time
from datetime import datetime, timezone
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from sqlalchemy.orm import Session
from ultralytics import YOLO

from backend.models.event import Event
from backend.models.session import AnalysisSession
from backend.services.websocket_manager import ws_manager

# ─── Config (dari .env via os.getenv) ────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MODEL_PATH = PROJECT_ROOT / "yolov8s.pt"
MODEL_PATH = os.getenv("MODEL_PATH", str(DEFAULT_MODEL_PATH))
SCREENSHOT_DIR = Path(os.getenv("SCREENSHOT_DIR", "./storage/screenshots"))
FRAME_SKIP = int(os.getenv("FRAME_SKIP", "2"))
EVENT_DEDUP_SECONDS = float(os.getenv("EVENT_DEDUP_SECONDS", "1.0"))
INFER_IMGSZ = int(os.getenv("INFER_IMGSZ", "1280"))
INFER_IOU = float(os.getenv("INFER_IOU", "0.45"))
INFER_AUGMENT = os.getenv("INFER_AUGMENT", "false").lower() in {"1", "true", "yes", "on"}
WS_BROADCAST_EVERY_N = 30   # broadcast progress setiap 30 frame diproses

# ─── Load model sekali saat modul diimport ────────────────────────────────────
_model: YOLO | None = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        model_path = Path(MODEL_PATH)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model tidak ditemukan: {model_path}. "
                "Set env MODEL_PATH ke file weights yang valid."
            )
        print(f"[VisionEngine] Loading model from: {model_path}")
        _model = YOLO(str(model_path))
    return _model


# ─── Helper: annotate frame & simpan screenshot ──────────────────────────────
def save_screenshot(
    frame: np.ndarray,
    detections: list[dict],
    session_id: int,
    event_index: int,
) -> str:
    """Simpan frame dengan bounding box. Return relative path dari screenshot."""
    SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

    # Convert BGR (OpenCV) → RGB (PIL)
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img)

    for det in detections:
        x1, y1, x2, y2 = det["bbox"]
        conf = det["confidence"]
        label = f"{det['class_name']} {conf:.0%}"

        # Bounding box
        draw.rectangle([x1, y1, x2, y2], outline="#FF3B30", width=3)

        # Label background
        text_bbox = draw.textbbox((x1, y1 - 20), label)
        draw.rectangle(text_bbox, fill="#FF3B30")
        draw.text((x1, y1 - 20), label, fill="white")

    # Kompres ke JPEG maks 200 KB
    filename = f"session_{session_id}_event_{event_index:04d}.jpg"
    filepath = SCREENSHOT_DIR / filename

    quality = 85
    while quality >= 40:
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=quality, optimize=True)
        if buf.tell() <= 200 * 1024:
            break
        quality -= 10

    with open(filepath, "wb") as f:
        f.write(buf.getvalue())

    return str(filepath)


# ─── Core processing function (dijalankan sebagai BackgroundTask) ─────────────
async def process_video(
    db: Session,
    session_id: int,
    video_path: str,
    confidence_threshold: float,
):
    """
    Main video processing coroutine.
    Dipanggil oleh BackgroundTasks FastAPI.
    """
    ws_session_id = str(session_id)
    db_session: AnalysisSession = db.get(AnalysisSession, session_id)

    if not db_session:
        return

    # Update status → processing
    db_session.status = "processing"
    db.commit()

    try:
        model = get_model()
        cap = cv2.VideoCapture(video_path)

        if not cap.isOpened():
            raise RuntimeError(f"Tidak bisa membuka video: {video_path}")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration_sec = total_frames / fps

        # Update metadata sesi
        db_session.total_frames = total_frames
        db_session.video_duration_sec = round(duration_sec, 2)
        db.commit()

        frame_number = 0
        frames_processed = 0
        events_found = 0
        last_event_video_sec: float = -999.0   # tracker deduplication
        event_index = 0

        start_time = time.time()

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            frame_number += 1

            # Skip frame — hanya proses setiap FRAME_SKIP frame
            if frame_number % FRAME_SKIP != 0:
                continue

            frames_processed += 1
            video_timestamp_sec = frame_number / fps

            # ── Inferensi YOLOv8 ─────────────────────────────────────────
            results = model.predict(
                frame,
                conf=confidence_threshold,
                iou=INFER_IOU,
                imgsz=INFER_IMGSZ,
                max_det=300,
                augment=INFER_AUGMENT,
                verbose=False,
            )
            detections = []

            for result in results:
                for box in result.boxes:
                    conf = float(box.conf[0])
                    class_id = int(box.cls[0])
                    class_name = model.names.get(class_id, str(class_id))
                    x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]
                    detections.append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": conf,
                        "bbox": [x1, y1, x2, y2],
                    })

            # ── Event creation dengan deduplication ──────────────────────
            if detections:
                gap = video_timestamp_sec - last_event_video_sec
                if gap >= EVENT_DEDUP_SECONDS:
                    last_event_video_sec = video_timestamp_sec
                    event_index += 1
                    events_found += 1

                    max_conf = max(d["confidence"] for d in detections)

                    # Simpan screenshot
                    screenshot_path = save_screenshot(
                        frame, detections, session_id, event_index
                    )

                    # Simpan event ke DB
                    db_event = Event(
                        session_id=session_id,
                        camera_id=None,
                        category="waste_surface",
                        confidence_score=round(max_conf, 4),
                        screenshot_path=screenshot_path,
                        detected_objects=detections,
                        video_timestamp_sec=round(video_timestamp_sec, 2),
                        status="pending",
                        occurred_at=datetime.now(timezone.utc),
                    )
                    db.add(db_event)
                    db.commit()
                    db.refresh(db_event)

                    # Broadcast event ke dashboard
                    await ws_manager.broadcast_event(ws_session_id, {
                        "id": db_event.id,
                        "confidence_score": max_conf,
                        "video_timestamp_sec": video_timestamp_sec,
                        "screenshot_path": screenshot_path,
                        "category": "waste_surface",
                    })

            # ── Broadcast progress & Live Preview ─────────────────────────
            # Update DB less frequently to save IO
            if frames_processed % WS_BROADCAST_EVERY_N == 0:
                db_session.frames_processed = frame_number
                db.commit()

            # Encode preview image for frontend
            percent = (frame_number / total_frames) * 100
            
            # We already have `frame` and `detections`
            preview_img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if detections:
                draw = ImageDraw.Draw(preview_img)
                for det in detections:
                    x1, y1, x2, y2 = det["bbox"]
                    conf = det["confidence"]
                    label = f"{det['class_name']} {conf:.0%}"
                    draw.rectangle([x1, y1, x2, y2], outline="#FF3B30", width=3)
                    text_bbox = draw.textbbox((x1, y1 - 20), label)
                    draw.rectangle(text_bbox, fill="#FF3B30")
                    draw.text((x1, y1 - 20), label, fill="white")
            
            preview_img.thumbnail((640, 480))
            buf = io.BytesIO()
            preview_img.save(buf, format="JPEG", quality=45)
            frame_b64 = base64.b64encode(buf.getvalue()).decode('utf-8')

            await ws_manager.broadcast_progress(
                ws_session_id,
                percent=percent,
                frames_done=frame_number,
                total_frames=total_frames,
                events_found=events_found,
                frame_b64=frame_b64,
            )
            
            # Sinkronisasi kecepatan pemutaran dengan waktu asli video (1x normal speed)
            elapsed_wall_time = time.time() - start_time
            if video_timestamp_sec > elapsed_wall_time:
                await asyncio.sleep(video_timestamp_sec - elapsed_wall_time)
            else:
                await asyncio.sleep(0)

        cap.release()

        # ── Selesai ──────────────────────────────────────────────────────
        processing_time = round(time.time() - start_time, 1)

        # Set status to 'pending' to require review by default
        db_session.status = "pending"
        db_session.total_events = events_found
        db_session.frames_processed = total_frames
        db_session.completed_at = datetime.now(timezone.utc)
        db.commit()

        summary = {
            "session_id": session_id,
            "total_frames": total_frames,
            "total_events": events_found,
            "video_duration_sec": duration_sec,
            "processing_time_sec": processing_time,
        }

        await ws_manager.broadcast_complete(ws_session_id, summary)

        # Hapus file video setelah selesai (hemat storage)
        try:
            os.remove(video_path)
        except OSError:
            pass

    except Exception as exc:
        db_session.status = "failed"
        db.commit()
        await ws_manager.broadcast_error(ws_session_id, str(exc))
        raise
