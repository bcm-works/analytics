#!/usr/bin/env bash

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

echo "Stopping Docker containers"
docker compose \
  --project-directory "$REPO" \
  --file "$REPO/docker/docker-compose.yml" \
  down > /dev/null 2>&1 || true
