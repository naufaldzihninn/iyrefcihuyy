#!/usr/bin/env bash
# Jalankan backend AquaWatch AI
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="$SCRIPT_DIR/backend/.venv/bin"

echo "🚀 Starting AquaWatch AI Backend..."
cd "$SCRIPT_DIR"

PYTHONPATH="$SCRIPT_DIR" \
"$VENV/uvicorn" backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --reload-dir backend
