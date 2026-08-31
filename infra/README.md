# Infrastructure

This directory contains the [Railway IaC](https://docs.railway.com/infrastructure-as-code) configuration for the analytics project.

Three Railway services make up the stack:

| Service | Type | Notes |
|---|---|---|
| **postgres** | Railway PostgreSQL plugin | Managed by Railway |
| **clickhouse** | Docker service (custom Dockerfile) | Built from [ServiceClickHouse.Dockerfile](docker/ServiceClickHouse.Dockerfile) |
| **plausible** | Docker service (custom Dockerfile) | Built from [ServicePlausible.Dockerfile](docker/ServicePlausible.Dockerfile) |

All commands shown below must be run from a terminal in this `infra` directory.

## Initial Setup

- Install the [Node](https://nodejs.org/) version defined in [.nvmrc](.nvmrc), one option is to use my [Node setup script](https://github.com/bcm-works/dotfiles/blob/main/dev/node.sh)
- Install the [Railway CLI](https://docs.railway.com/cli#installing-the-cli)
- Install dependencies: `npm install`
- Login to your Railway account: `npm run login`
- Check [.railway/railway.ts](.railway/railway.ts) and confirm `GITHUB_REPO` is set to the correct GitHub `owner/repo` value
- Create the initial infra in your Railway account: `railway config apply`

Apply the following one-off configuration in the Railway dashboard:

1. **Dockerfile paths** — for both `clickhouse` and `plausible` services, go to
   **Settings → Build → Dockerfile Path** and set:
   - `clickhouse` → `docker/ServiceClickHouse.Dockerfile`
   - `plausible` → `docker/ServicePlausible.Dockerfile`

2. **`BASE_URL`** — after the first deploy of the `plausible` service, copy its
   Railway-generated domain and set it as a variable:
   ```bash
   railway variable set --service plausible BASE_URL=https://analytics-production-xxxx.up.railway.app
   ```

3. **`SECRET_KEY_BASE`** — generate a secret and set it as a variable:
   ```bash
   railway variable set --service plausible SECRET_KEY_BASE=$(openssl rand -base64 48)
   ```

## Commands

- `npm run apply` - Preview and apply changes after confirmation
- `npm run login` - Login and link account
- `npm run plan` - Preview changes without applying them
- `npm run pull` - Import current Railway state into `railway.ts`

## Scaling and Resource Limits

The ClickHouse XML configs (`low-resources.xml`, `default-profile-low-resources-overrides.xml`) tune ClickHouse for environments with less than 16 GB RAM, which is suitable for Railway's standard instance sizes. If you upgrade to a larger Railway instance, you can remove or adjust those overrides. Volume sizes are configured in [.railway/railway.ts](.railway/railway.ts) (`sizeMB`) and can be increased with `railway config apply`.

## Troubleshooting

- **Plausible won't start / crashes on boot**: Check that `DATABASE_URL` and `CLICKHOUSE_DATABASE_URL` are correct and that both database services are healthy before the first Plausible deploy.
- **ClickHouse unreachable**: Confirm the ClickHouse service is named exactly `clickhouse` in Railway, the internal hostname is derived from the service name (`clickhouse.railway.internal`).
- **Migrations fail**: Ensure the PostgreSQL plugin is running and the reference variable is properly linked. You can verify by opening a Railway shell on the `plausible` service and running `echo $DATABASE_URL`.