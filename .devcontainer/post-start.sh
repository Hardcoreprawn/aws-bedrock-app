#!/usr/bin/env bash
# Runs on every container start (not just first create).
# Brings up the local Docker Compose preview stack (detached) so
# the app is immediately reachable on ports 3000 and 5173.
set -euo pipefail

echo "[post-start] Bringing up local preview stack …"
docker compose -f docker-compose.local.yml up -d --build

echo "[post-start] Stack is up."
echo "  web      → http://localhost:5173"
echo "  mock-api → http://localhost:3000"
echo "  Logs: docker compose -f docker-compose.local.yml logs -f"
