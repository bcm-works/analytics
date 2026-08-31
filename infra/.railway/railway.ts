import { defineRailway, github, postgres, preserve, project, service, volume } from "railway/iac";

export default defineRailway(() => {
  const analytics = github("bcm-works/analytics", { checkSuites: false });

  const postgresDatabase = postgres("postgres", { region: "ams" });
  const plausibleData = volume("plausible-data", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "ams", sizeMB: 250 });
  const postgresVolumeEFwE = volume("postgres-volume-eFwE", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "ams", sizeMB: 500 });
  const clickhouseData = volume("clickhouse-data", { alerts: { usage: { "100": {}, "80": {}, "95": {} } }, allowOnlineResize: true, region: "ams", sizeMB: 250 });
  const clickhouse = service("clickhouse", {
    source: analytics,
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "/docker/ServiceClickHouse.Dockerfile" },
    replicas: { "ams": 1 },
    volumeMounts: { "/var/lib/clickhouse": clickhouseData },
    env: { CLICKHOUSE_SKIP_USER_SETUP: preserve() },
  });
  const plausible = service("plausible", {
    source: analytics,
    build: { buildEnvironment: "V3", builder: "DOCKERFILE", dockerfilePath: "/docker/ServicePlausible.Dockerfile" },
    replicas: { "ams": 1 },
    volumeMounts: { "/var/lib/plausible": plausibleData },
    env: { BASE_URL: preserve(), CLICKHOUSE_DATABASE_URL: preserve(), DATABASE_URL: preserve(), HTTP_PORT: preserve(), SECRET_KEY_BASE: preserve() },
  });

  return project("analytics", {
    resources: [clickhouse, postgresDatabase, plausible, plausibleData, postgresVolumeEFwE, clickhouseData],
  });
});
