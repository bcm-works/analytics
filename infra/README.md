# Railway Deployment

This document covers deploying the analytics stack to [Railway](https://railway.com/).

## Architecture

Three Railway services make up the stack:

| Service | Type | Notes |
|---|---|---|
| **postgres** | Railway PostgreSQL plugin | Managed by Railway |
| **clickhouse** | Docker service (custom Dockerfile) | Built from `infra/Dockerfile` |
| **plausible** | Docker image service | Pre-built image from GHCR |

ClickHouse cannot use Railway's volume mounts the same way Docker Compose does, so `infra/Dockerfile` bakes the XML config files directly into the image.

## Prerequisites

- A [Railway](https://railway.com/) account (Hobby plan or higher — the free tier does not support persistent volumes)
- The [Railway CLI](https://docs.railway.com/guides/cli) installed and authenticated: `railway login`
- This repository pushed to GitHub (Railway deploys from a Git repo)

## Step 1 — Create a Railway project

1. In the Railway dashboard, click **New Project**.
2. Choose **Empty project** and give it a name (e.g. `analytics`).

## Step 2 — Add PostgreSQL

1. Inside the project, click **+ New** → **Database** → **Add PostgreSQL**.
2. Railway provisions the database and exposes a `DATABASE_URL` reference variable automatically. No further configuration is needed.

## Step 3 — Deploy ClickHouse

1. Click **+ New** → **GitHub Repo** and select this repository.
2. In the service settings, set the **Root Directory** to `/`.
3. Railway will detect `Clickhouse.Dockerfile` and use it to build the image.
4. Under **Settings → Networking**, add a **Private Networking** port: `8123` (HTTP). Do **not** expose this publicly.
5. Rename the service to `clickhouse` (used to form the internal hostname).
6. Under **Variables**, add:

   | Variable | Value |
   |---|---|
   | `CLICKHOUSE_SKIP_USER_SETUP` | `1` |

7. Under **Settings → Deploy**, add a **Volume** mounted at `/var/lib/clickhouse` for persistent event data.
8. Click **Deploy**.

## Step 4 — Deploy Plausible

1. Click **+ New** → **Docker Image** and enter:
   ```
   ghcr.io/plausible/community-edition:v3.2.1
   ```
2. Under **Settings → Deploy**, set the **Start Command** to:
   ```
   sh -c "/entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"
   ```
3. Under **Settings → Networking**:
   - Set the **Private port** to `8000`.
   - Click **Generate Domain** to get a public HTTPS URL (e.g. `https://analytics-production-xxxx.up.railway.app`). Note this URL — you will use it for `BASE_URL`.
4. Under **Settings → Deploy**, add a **Volume** mounted at `/var/lib/plausible` for persistent data.
5. Rename the service to `plausible`.

### Environment variables

Add the following variables to the **plausible** service under **Variables**:

| Variable | Value |
|---|---|
| `BASE_URL` | The public HTTPS domain from Step 4 (e.g. `https://analytics-production-xxxx.up.railway.app`) |
| `SECRET_KEY_BASE` | Output of `openssl rand -base64 48` — generate this locally |
| `DATABASE_URL` | Click **+ Add Reference** → select the PostgreSQL service → `DATABASE_URL` |
| `CLICKHOUSE_DATABASE_URL` | `http://clickhouse.railway.internal:8123/plausible_events` |
| `HTTP_PORT` | `8000` |
| `DISABLE_REGISTRATION` | `true` |
| `ENABLE_EMAIL_VERIFICATION` | `false` |
| `TMPDIR` | `/var/lib/plausible/tmp` |

> **Note:** `DATABASE_URL` should be added as a Railway [reference variable](https://docs.railway.com/guides/variables#referencing-another-services-variable) — do not copy the value directly, as it may rotate.

Click **Deploy**.

## Step 5 — Create the admin user

Once all three services are running and healthy, create your admin account using the Railway CLI.

```bash
# From inside the analytics repo directory
railway run --service plausible -- \
  bin/plausible rpc \
  'Plausible.Auth.User.new(%{name: "Your Name", email: "you@example.com", password: "your-password", password_confirmation: "your-password"}) |> Plausible.Repo.insert'
```

Replace the name, email, and password with your credentials, then store them in your password manager.

After the user is created, redeploy the `plausible` service (the run command re-runs migrations on each start, so no special action is needed beyond the deploy).

## Step 6 — Verify

1. Visit your `BASE_URL` in a browser.
2. Log in with the credentials created in Step 5.
3. Add a site and copy the tracking snippet into your website's `<head>`.

## Ongoing operations

### Redeploying

Push changes to GitHub — Railway redeploys automatically on new commits.

### Updating Plausible

1. Change the Docker image tag in the Railway service settings (e.g. `v3.3.0`).
2. Railway will pull the new image; the start command re-runs migrations automatically on startup.

### Updating ClickHouse config

Edit the XML files in `clickhouse`, push to GitHub, and Railway will rebuild the `clickhouse` service image.

### Scaling and resource limits

The ClickHouse XML configs (`low-resources.xml`, `default-profile-low-resources-overrides.xml`) tune ClickHouse for environments with less than 16 GB RAM — suitable for Railway's standard instance sizes. If you upgrade to a larger Railway instance, you can remove or adjust those overrides.

## Troubleshooting

- **Plausible won't start / crashes on boot**: Check that `DATABASE_URL` and `CLICKHOUSE_DATABASE_URL` are correct and that both database services are healthy before the first Plausible deploy.
- **ClickHouse unreachable**: Confirm the ClickHouse service is named exactly `clickhouse` in Railway — the internal hostname is derived from the service name (`clickhouse.railway.internal`).
- **Migrations fail**: Ensure the PostgreSQL plugin is running and the reference variable is properly linked. You can verify by opening a Railway shell on the `plausible` service and running `echo $DATABASE_URL`.
