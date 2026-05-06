#!/usr/bin/env bash
# Jalankan frontend AquaWatch AI
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting AquaWatch AI Frontend..."
cd "$SCRIPT_DIR/frontend"

npm run dev -- --host 0.0.0.0
