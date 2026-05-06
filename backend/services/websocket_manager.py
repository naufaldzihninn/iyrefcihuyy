"""
WebSocket connection manager — broadcast progress & events ke semua
client yang sedang listen pada session_id tertentu.
"""
import json
from typing import Any
from fastapi import WebSocket


class WebSocketManager:
    def __init__(self):
        # { session_id (str) -> [WebSocket, ...] }
        self._connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        self._connections.setdefault(session_id, []).append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self._connections:
            self._connections[session_id].discard(websocket) \
                if hasattr(self._connections[session_id], "discard") \
                else None
            try:
                self._connections[session_id].remove(websocket)
            except ValueError:
                pass
            if not self._connections[session_id]:
                del self._connections[session_id]

    async def broadcast(self, session_id: str, payload: dict[str, Any]):
        dead: list[WebSocket] = []
        for ws in self._connections.get(session_id, []):
            try:
                await ws.send_text(json.dumps(payload, ensure_ascii=False))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(session_id, ws)

    async def broadcast_progress(
        self,
        session_id: str,
        percent: float,
        frames_done: int,
        total_frames: int,
        events_found: int,
        frame_b64: str = None,
    ):
        await self.broadcast(session_id, {
            "type": "progress",
            "percent": round(percent, 1),
            "frames_done": frames_done,
            "total_frames": total_frames,
            "events_found": events_found,
            "frame_b64": frame_b64,
        })

    async def broadcast_event(self, session_id: str, event_data: dict):
        await self.broadcast(session_id, {
            "type": "event",
            "event": event_data,
        })

    async def broadcast_complete(self, session_id: str, summary: dict):
        await self.broadcast(session_id, {
            "type": "complete",
            "summary": summary,
        })

    async def broadcast_error(self, session_id: str, message: str):
        await self.broadcast(session_id, {
            "type": "error",
            "message": message,
        })


# Singleton — di-import oleh routers dan vision_engine
ws_manager = WebSocketManager()
