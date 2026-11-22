#!/command/with-contenv sh
# First boot step (s6 oneshot, root). Wipes all state and generates this boot's secrets.
# Must stay fast: Caddy — and with it the loading page — starts as soon as this exits.
# Never echo a secret.
set -eu

# The rootfs is already fresh on every Fly start; this makes the wipe hold even if it isn't.
rm -rf /var/lib/dw /run/dw
mkdir -p /var/lib/dw/pg /var/lib/dw/nats /run/dw/steps /run/postgresql /tmp/caddy
chown postgres:postgres /var/lib/dw/pg /run/postgresql
chmod 700 /var/lib/dw/pg
chown app:app /var/lib/dw/nats /tmp/caddy
chmod 755 /run/dw

envdir=/run/s6/container_environment
put() { # NAME VALUE — services read these via with-contenv
  umask 077
  printf '%s' "$2" > "$envdir/$1"
}

put PG_OWNER_PASSWORD "$(openssl rand -hex 24)"
put PG_APP_PASSWORD "$(openssl rand -hex 24)"
put DW_ENC_KEY "$(openssl rand -base64 32)"
put WEBHOOK_SECRET "$(openssl rand -hex 32)"
put SIGNING_SECRET "$(openssl rand -hex 32)"

key=/run/dw/jwt.key
(umask 077 && openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$key" 2>/dev/null)
put DOTWIRE_PRIVATE_KEY_PEM "$(cat "$key")"
put DW_JWT_PUBLIC_PEM "$(openssl pkey -in "$key" -pubout)"
rm -f "$key"

/etc/dw-boot/status.sh
