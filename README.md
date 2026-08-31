# Site Analytics

Customised [Plausible CE v3.2.1](https://github.com/plausible/community-edition/tree/v3.2.1) including:

- User registration disabled
- User setup via 
- Email features disabled
- 

> This document has been altered in this fork, also refer to [Plausible's readme](https://github.com/plausible/community-edition/blob/v3.2.1/README.md).

## Requirements

- **[Docker](https://docs.docker.com/engine/install/)** and **[Docker Compose](https://docs.docker.com/compose/install/)** must be installed on your machine.
- **CPU** must support **SSE 4.2** or **NEON** instruction set or higher (required by ClickHouse).
- At least **2 GB of RAM** is recommended for running ClickHouse and Plausible without fear of OOMs.

## Initial Setup

- Copy [.sample.env](.sample.env) to a new file named `.env`
- Generate a new secret key: `openssl rand -base64 48`
- Edit `.env` and set the value of `SECRET_KEY_BASE` variable to the secret key value
- Add suitable values for the other variables in `.env`
- Start the app services: `bash ./bin/start.sh`
- Create your app user from the `APP_USER_EMAIL` and `APP_USER_PASS` variables in `.env`: `bash ./bin/create-user.sh`
- Move your app user credentials out of `.env` and in to your password management system
- Retart the app services: `bash ./bin/start.sh`
- Visit the the address set in the `BASE_URL`  variable in `.env` and login with your app user credentials

## Commands

- `bash ./bin/start.sh`: Start the app services
- `bash ./bin/stop.sh`: Stop the app services
- `bash ./bin/create-user.sh`: Create an app user from the `APP_USER_EMAIL` and `APP_USER_PASS` variables in `.env`
