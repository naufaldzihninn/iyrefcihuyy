#!/usr/bin/env bash
# Jalankan backend AquaWatch AI
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/backend/.venv/bin"

echo "🚀 Starting AquaWatch AI Backend..."
cd "$SCRIPT_DIR"

LATEST_MODEL="$SCRIPT_DIR/runs/detect/runs/aquawatch_v2/weights/best.pt"
if [[ -f "$LATEST_MODEL" ]]; then
  export MODEL_PATH="$LATEST_MODEL"
  echo "🧠 Using model: $MODEL_PATH"
fi
export INFER_IMGSZ="${INFER_IMGSZ:-1536}"
export INFER_IOU="${INFER_IOU:-0.45}"
export INFER_AUGMENT="${INFER_AUGMENT:-true}"
export FRAME_SKIP="${FRAME_SKIP:-2}"
export EVENT_DEDUP_SECONDS="${EVENT_DEDUP_SECONDS:-1.0}"
echo "⚙️ Inference config: imgsz=$INFER_IMGSZ iou=$INFER_IOU augment=$INFER_AUGMENT frame_skip=$FRAME_SKIP dedup=${EVENT_DEDUP_SECONDS}s"

PYTHONPATH="$SCRIPT_DIR" \
"$VENV/uvicorn" backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --reload-dir backend
