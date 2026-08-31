FROM ghcr.io/plausible/community-edition:v3.2.1

# Bake in non-secret defaults so Railway only needs to supply secrets
# and connection strings as environment variables.
ENV DISABLE_REGISTRATION=true \
    ENABLE_EMAIL_VERIFICATION=false \
    TMPDIR=/var/lib/plausible/tmp

# Run migrations then start the server. Railway sets PORT automatically;
# Plausible reads HTTP_PORT, so pass it through in the Railway variables.
CMD ["/bin/sh", "-c", "/entrypoint.sh db createdb && /entrypoint.sh db migrate && /entrypoint.sh run"]
