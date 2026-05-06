#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${1:-5173}"

cd "$ROOT_DIR"

echo "Starting Showtime on http://localhost:${PORT}"
echo "Press Ctrl+C to stop."

python3 -m http.server "$PORT"
