#!/usr/bin/env bash
# Runs on every container start (not just first create).
# Brings up the local Docker Compose preview stack (detached) so
# the app is immediately reachable on ports 3000 and 5173.
set -euo pipefail

echo "[post-start] Bringing up local preview stack …"

if ! command -v docker >/dev/null 2>&1; then
	echo "[post-start] WARNING: Docker CLI is not available in this container session."
	echo "[post-start] Skipping preview stack startup; you can run it later manually."
	exit 0
fi

if ! docker compose version >/dev/null 2>&1; then
	echo "[post-start] WARNING: Docker Compose plugin is unavailable."
	echo "[post-start] Skipping preview stack startup; you can run it later manually."
	exit 0
fi

if ! docker compose -f docker-compose.local.yml up -d --build; then
	echo "[post-start] WARNING: Failed to start the local preview stack."
	echo "[post-start] The dev container is still usable; rerun when Docker is ready:"
	echo "[post-start]   docker compose -f docker-compose.local.yml up -d --build"
	exit 0
fi

echo "[post-start] Stack is up."
echo "  web      → http://localhost:5173"
echo "  mock-api → http://localhost:3000"
echo "  Logs: docker compose -f docker-compose.local.yml logs -f"
