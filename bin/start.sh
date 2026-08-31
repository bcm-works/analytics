#!/usr/bin/env bash

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

bash "$REPO/bin/stop.sh"

ENVFILE="$REPO/.env"
if [ -f "$ENVFILE" ]; then
  echo "Env file found, loading vars from it."
  source "$ENVFILE"
else
  echo "No env file found, relying on system environment vars."
fi

docker compose --project-directory "$REPO" up -d
