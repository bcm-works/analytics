#!/usr/bin/env bash

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

ENVFILE="$REPO/.env"
if [ -f "$ENVFILE" ]; then
  echo "Env file found, loading vars from it."
  source "$ENVFILE"
else
  echo "No env file found, relying on system environment vars."
fi

if [ -z "$APP_USER_EMAIL" ] || [ -z "$APP_USER_PASS" ]; then
  echo "Error: The environment vars APP_USER_EMAIL and APP_USER_PASS must be set."
  exit 1
fi

echo "Creating app user for $APP_USER_EMAIL"

docker compose --project-directory "$REPO" \
  exec plausible bin/plausible rpc \
  "Plausible.Auth.User.new(%{name: \"$APP_USER_NAME\", email: \"$APP_USER_EMAIL\", password: \"$APP_USER_PASS\", password_confirmation: \"$APP_USER_PASS\"}) |> Plausible.Repo.insert"

echo "Restart the app services to use this app user"
