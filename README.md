# Site Analytics

Customised [Plausible CE v3.2.1](https://github.com/plausible/community-edition/tree/v3.2.1) including:

- User registration disabled
- User setup via [bin/create-user.sh](bin/create-user.sh)
- Email features disabled
- Customised Docker config

> This document has been altered in this fork. Refer to [Plausible's Readme](https://github.com/plausible/community-edition/blob/v3.2.1/README.md) for official documentation.

## Requirements

- **[Docker](https://docs.docker.com/engine/install/)**
- **[Docker Compose](https://docs.docker.com/compose/install/)**
- **CPU** must support **SSE 4.2** or **NEON** instruction set or higher
- At least **2 GB of RAM**

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

This section covers deploying this app to [Railway](https://railway.com/).

### Architecture

Three Railway services make up the stack:

| Service | Type | Notes |
|---|---|---|
| **postgres** | Railway PostgreSQL plugin | Managed by Railway |
| **clickhouse** | Docker service (custom Dockerfile) | Built from `docker/ServiceClickHouse.Dockerfile` |
| **plausible** | Docker service (custom Dockerfile) | Built from `docker/ServicePlausible.Dockerfile` |

Both ClickHouse and Plausible use custom Dockerfiles. ClickHouse bakes its XML config directly into the image (Railway volume mounts can't replicate the bind-mount approach used locally). Plausible's Dockerfile bakes in non-secret defaults (`DISABLE_REGISTRATION`, `ENABLE_EMAIL_VERIFICATION`, `TMPDIR`) so Railway only needs secret and connection-string variables.

### Requirements

- A [Railway](https://railway.com/) account using a Hobby plan or higher, as the free tier does not support persistent volumes
- The [Railway CLI](https://docs.railway.com/guides/cli) installed and authenticated: `railway login`
- This repository pushed to GitHub (Railway deploys from a Git repo)

### Step 1: Create a Railway project

1. In the Railway dashboard, click **New Project**.
2. Choose **Empty project** and give it a name (e.g. `analytics`).

### Step 2: Add PostgreSQL

1. Inside the project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway provisions the database and exposes a `DATABASE_URL` reference variable automatically. No further configuration is needed.

### Step 3: Deploy ClickHouse

1. Click **+ New** → **GitHub Repo** and select this repository.
2. In the service settings, set the **Root Directory** to `/`.
3. Under **Settings → Build**, set the **Dockerfile Path** to `docker/ServiceClickHouse.Dockerfile`.
4. Under **Settings → Networking**, add a **Private Networking** port: `8123` (HTTP). Do **not** expose this publicly.
5. Rename the service to `clickhouse` (used to form the internal hostname).
6. Under **Variables**, add:

   | Variable | Value |
   |---|---|
   | `CLICKHOUSE_SKIP_USER_SETUP` | `1` |

7. Under **Settings → Deploy**, add a **Volume** mounted at `/var/lib/clickhouse` for persistent event data.
8. Click **Deploy**.

### Step 4: Deploy Plausible

1. Click **+ New** → **GitHub Repo** and select this repository.
2. In the service settings, set the **Root Directory** to `/`.
3. Under **Settings → Build**, set the **Dockerfile Path** to `docker/ServicePlausible.Dockerfile`.
4. Under **Settings → Networking**:
   - Set the **Private port** to `8000`.
   - Click **Generate Domain** to get a public HTTPS URL (e.g. `https://analytics-production-xxxx.up.railway.app`). Note this URL: you will use it for `BASE_URL`.
5. Under **Settings → Deploy**, add a **Volume** mounted at `/var/lib/plausible` for persistent data.
6. Rename the service to `plausible`.

#### Environment variables

Add the following variables to the **plausible** service under **Variables**:

| Variable | Value |
|---|---|
| `BASE_URL` | The public HTTPS domain from Step 4 (e.g. `https://analytics-production-xxxx.up.railway.app`) |
| `SECRET_KEY_BASE` | Output of `openssl rand -base64 48`, generate this locally |
| `DATABASE_URL` | Click **+ Add Reference** → select the PostgreSQL service → `DATABASE_URL` |
| `CLICKHOUSE_DATABASE_URL` | `http://clickhouse.railway.internal:8123/plausible_events` |
| `HTTP_PORT` | `8000` |

> **Note:** `DISABLE_REGISTRATION`, `ENABLE_EMAIL_VERIFICATION`, and `TMPDIR` are baked into `docker/ServicePlausible.Dockerfile` and do not need to be set here.

> **Note:** `DATABASE_URL` should be added as a Railway [reference variable](https://docs.railway.com/guides/variables#referencing-another-services-variable), do not copy the value directly, as it may rotate.

Click **Deploy**.

### Step 5: Create the app user

Once all three services are running and healthy, create your app user using the Railway CLI.

```bash
# From inside the analytics repo directory
railway run --service plausible -- \
  bin/plausible rpc \
  'Plausible.Auth.User.new(%{name: "Your Name", email: "you@example.com", password: "your-password", password_confirmation: "your-password"}) |> Plausible.Repo.insert'
```

Replace the name, email, and password with your credentials, then store them in your password manager.

### Step 6: Verify

1. Visit your `BASE_URL` in a browser.
2. Log in with the credentials created in Step 5.
3. Add a site and copy the tracking snippet into your website's `<head>`.

### Operations

#### Redeploying

Push changes to GitHub, Railway redeploys automatically on new commits.

#### Updating Plausible

1. Change the version in the `FROM` line in `docker/ServicePlausible.Dockerfile`
2. Push to GitHub, Railway rebuilds the image and re-runs migrations automatically on startup.

#### Updating ClickHouse config

Edit the XML files in `clickhouse/`, push to GitHub, and Railway will rebuild the `clickhouse` service image.

#### Scaling and resource limits

The ClickHouse XML configs (`low-resources.xml`, `default-profile-low-resources-overrides.xml`) tune ClickHouse for environments with less than 16 GB RAM, which is suitable for Railway's standard instance sizes. If you upgrade to a larger Railway instance, you can remove or adjust those overrides.

### Troubleshooting

- **Plausible won't start / crashes on boot**: Check that `DATABASE_URL` and `CLICKHOUSE_DATABASE_URL` are correct and that both database services are healthy before the first Plausible deploy.
- **ClickHouse unreachable**: Confirm the ClickHouse service is named exactly `clickhouse` in Railway, the internal hostname is derived from the service name (`clickhouse.railway.internal`).
- **Migrations fail**: Ensure the PostgreSQL plugin is running and the reference variable is properly linked. You can verify by opening a Railway shell on the `plausible` service and running `echo $DATABASE_URL`.