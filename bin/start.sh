#!/usr/bin/env bash

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

bash "$REPO/bin/stop.sh" > /dev/null 2>&1

ENVFILE="$REPO/.env"
if [ -f "$ENVFILE" ]; then
  echo "Env file found, loading vars from it."
  source "$ENVFILE"
else
  echo "No env file found, relying on system environment vars."
fi

echo "Starting Docker containers"
docker compose --project-directory "$REPO" up -d > /dev/null 2>&1
