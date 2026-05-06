from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from backend.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"), nullable=True)
    category = Column(String(50), nullable=False, default="waste_surface")
    confidence_score = Column(Float, nullable=False)
    screenshot_path = Column(Text, nullable=True)
    detected_objects = Column(JSON, nullable=True)  # [{class, conf, bbox}]
    video_timestamp_sec = Column(Float, nullable=True)
    # pending | in_progress | resolved
    status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    occurred_at = Column(DateTime, nullable=False)
    resolved_at = Column(DateTime, nullable=True)
