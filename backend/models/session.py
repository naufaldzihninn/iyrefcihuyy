from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Text
from sqlalchemy.sql import func
from backend.database import Base


class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    original_filename = Column(String(200), nullable=False)
    location_name = Column(String(100), nullable=True)
    video_duration_sec = Column(Float, nullable=True)
    total_frames = Column(Integer, nullable=True)
    frames_processed = Column(Integer, default=0)
    confidence_threshold = Column(Float, default=0.6)
    # pending | processing | completed | failed | resolved | in_progress
    status = Column(String(20), default="queued")
    notes = Column(Text, nullable=True)
    total_events = Column(Integer, default=0)
    recorded_at = Column(String(20), nullable=True)   # date string from user
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    completed_at = Column(DateTime, nullable=True)
