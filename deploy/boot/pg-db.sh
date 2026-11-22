#!/command/with-contenv sh
# Waits for Postgres, then creates the dotwire database. The "dotwire" role is the initdb
# superuser (as in dotwire's compose setup), so migration 0002's CREATE EXTENSION timescaledb works.
set -eu

deadline=$(( $(date +%s) + 60 ))
until /usr/lib/postgresql/17/bin/pg_isready -q -h 127.0.0.1 -p 5432; do
  [ "$(date +%s)" -lt "$deadline" ] || { echo "pg-db: postgres not ready after 60s" >&2; exit 1; }
  sleep 0.5
done

PGPASSWORD="$PG_OWNER_PASSWORD" /usr/lib/postgresql/17/bin/createdb -h 127.0.0.1 -U dotwire dotwire
/etc/dw-boot/status.sh database
