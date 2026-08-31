# Site Analytics

Custom site analytics based on [Plausible CE v3.2.1](https://github.com/plausible/community-edition).

> This document has been altered in this fork, also refer to [Plausible's readme](https://github.com/plausible/community-edition/blob/v3.2.1/README.md).__

## Requirements

- **[Docker](https://docs.docker.com/engine/install/)** and **[Docker Compose](https://docs.docker.com/compose/install/)** must be installed on your machine.
- **CPU** must support **SSE 4.2** or **NEON** instruction set or higher (required by ClickHouse).
- At least **2 GB of RAM** is recommended for running ClickHouse and Plausible without fear of OOMs.

## Initial Setup

- Copy [.sample.env](.sample.env) to a new file named `.env`
- Start the services with Docker Compose: `docker compose up -d`
- Visit your instance at `$BASE_URL` and create the first user.
