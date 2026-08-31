# Site Analytics

Customised [Plausible CE v3.2.1](https://github.com/plausible/community-edition/tree/v3.2.1) including:

- User registration disabled
- User setup via [bin/create-user.sh](bin/create-user.sh)
- Email features disabled
- Customised Docker config

> This document has been altered in this fork. Refer to [Plausible's Readme](https://github.com/plausible/community-edition/blob/v3.2.1/README.md) for official documentation.

## Requirements

- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- **CPU**: Must support **SSE 4.2** or **NEON** instruction set or higher
- **RAM**: At least 2GB

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

## Infrastructure

[Railway](https://railway.com/) Infrastructure as Code and documentation is in the [infra directory](infra/).
