#!/usr/bin/env bash

REPO="$(cd "$(dirname "$0")" && pwd)"

docker compose down || true
