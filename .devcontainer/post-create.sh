#!/usr/bin/env bash
set -euo pipefail

echo "[post-create] Installing workspace dependencies..."
echo "[post-create] Using npm ci for lockfile parity (prefers local cache when available)."

if npm ci --prefer-offline --no-audit; then
	echo "[post-create] Dependencies installed successfully."
	exit 0
fi

echo "[post-create] WARNING: Dependency install failed (likely no registry access in this network)."
echo "[post-create] The container is ready, but Node dependencies are missing."
echo "[post-create] Configure an internal npm registry mirror, then run: npm ci"
