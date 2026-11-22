#!/command/with-contenv sh
# initdb into the rootfs data dir. Runs in parallel with Caddy starting.
set -eu

pwfile=/run/dw/pgpw
(umask 077 && printf '%s' "$PG_OWNER_PASSWORD" > "$pwfile")
chown postgres:postgres "$pwfile"
/command/s6-setuidgid postgres /usr/lib/postgresql/17/bin/initdb -D /var/lib/dw/pg -U dotwire --pwfile="$pwfile" \
  --auth=scram-sha-256 --encoding=UTF8 --locale=C.UTF-8 >/dev/null
rm -f "$pwfile"
