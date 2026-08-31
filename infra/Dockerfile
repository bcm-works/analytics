FROM clickhouse/clickhouse-server:24.12-alpine

COPY clickhouse/logs.xml /etc/clickhouse-server/config.d/logs.xml
COPY clickhouse/ipv4-only.xml /etc/clickhouse-server/config.d/ipv4-only.xml
COPY clickhouse/low-resources.xml /etc/clickhouse-server/config.d/low-resources.xml
COPY clickhouse/default-profile-low-resources-overrides.xml /etc/clickhouse-server/users.d/default-profile-low-resources-overrides.xml
