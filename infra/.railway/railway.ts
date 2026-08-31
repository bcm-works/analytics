import {
  defineRailway,
  github,
  postgres,
  preserve,
  project,
  service,
  volume,
} from "railway/iac";

const GITHUB_REPO = "bcm-works/analytics";

export default defineRailway(() => {
  // -------------------------------------------------------------------------
  // PostgreSQL - managed by Railway; DATABASE_URL is exposed automatically
  // -------------------------------------------------------------------------
  const db = postgres("postgres");

  // -------------------------------------------------------------------------
  // Volumes
  // -------------------------------------------------------------------------
  const clickhouseData = volume("clickhouse-data", {
    sizeMB: 250,
  });

  const plausibleData = volume("plausible-data", {
    sizeMB: 250,
  });

  // -------------------------------------------------------------------------
  // ClickHouse - private only (no public domain)
  // Dockerfile: docker/ServiceClickHouse.Dockerfile  (set in Railway settings)
  // Internal hostname: clickhouse.railway.internal:8123
  // -------------------------------------------------------------------------
  const clickhouse = service("clickhouse", {
    source: github(GITHUB_REPO),
    env: {
      CLICKHOUSE_SKIP_USER_SETUP: "1",
    },
    volumeMounts: {
      "/var/lib/clickhouse": clickhouseData,
    },
  });

  // -------------------------------------------------------------------------
  // Plausible - public-facing analytics app
  // Dockerfile: docker/ServicePlausible.Dockerfile  (set in Railway settings)
  // After first deploy, copy the Railway-generated domain into BASE_URL.
  // -------------------------------------------------------------------------
  const plausible = service("plausible", {
    source: github(GITHUB_REPO),
    env: {
      // Set this to the Railway-generated domain after the first deploy,
      // e.g. https://analytics-production-xxxx.up.railway.app
      BASE_URL: preserve(),

      // Generate locally: openssl rand -base64 48
      SECRET_KEY_BASE: preserve(),

      // Linked reference variable - auto-updates if the credential rotates
      DATABASE_URL: db.env.DATABASE_URL,

      // ClickHouse private network address (service name = "clickhouse")
      CLICKHOUSE_DATABASE_URL:
        "http://clickhouse.railway.internal:8123/plausible_events",

      HTTP_PORT: "8000",
    },
    volumeMounts: {
      "/var/lib/plausible": plausibleData,
    },
  });

  return project("analytics", {
    resources: [
      db,
      clickhouseData,
      plausibleData,
      clickhouse,
      plausible,
    ],
  });
});
