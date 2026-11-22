# syntax=docker/dockerfile:1
# One image, one Fly Machine: Caddy + Next.js + dotwire + Postgres/TimescaleDB + NATS under s6-overlay.
# Build context is the repo root:  docker build -f deploy/Dockerfile .

# ---- Next.js (standalone) ----------------------------------------------------------------------
FROM node:24-bookworm-slim AS web
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Public; inlined into the client bundle at build time.
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Binaries copied out of their official images ----------------------------------------------
# Tag format from dotwire's release workflow (version without the "v"). If this tag doesn't exist,
# pin the current `latest` by digest instead (ghcr.io/pasztor-mark/dotwire@sha256:...).
FROM ghcr.io/pasztor-mark/dotwire:0.5.0 AS dotwire
FROM nats:2.10-alpine AS nats
FROM caddy:2 AS caddy

# ---- Runtime -----------------------------------------------------------------------------------
# Ubuntu 24.04, not Debian: the .NET 10 SDK/runtime-deps images are noble-based, so the AOT binary
# expects noble's glibc.
FROM ubuntu:24.04

ARG S6_OVERLAY_VERSION=3.2.0.2
ARG TARGETARCH

# PGDG Postgres 17 + TimescaleDB, s6-overlay, and the unprivileged `app` user. The package is told
# not to create a cluster: the boot script runs its own initdb on the rootfs every start.
RUN set -eux; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg openssl wget xz-utils libicu74; \
    install -d /usr/share/postgresql-common/pgdg /etc/apt/keyrings /etc/postgresql-common/createcluster.d; \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc; \
    echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main" > /etc/apt/sources.list.d/pgdg.list; \
    curl -fsSL https://packagecloud.io/timescale/timescaledb/gpgkey | gpg --dearmor -o /etc/apt/keyrings/timescaledb.gpg; \
    echo "deb [signed-by=/etc/apt/keyrings/timescaledb.gpg] https://packagecloud.io/timescale/timescaledb/ubuntu/ noble main" > /etc/apt/sources.list.d/timescaledb.list; \
    echo "create_main_cluster = false" > /etc/postgresql-common/createcluster.d/no-main-cluster.conf; \
    apt-get update; \
    apt-get install -y --no-install-recommends postgresql-17 timescaledb-2-postgresql-17; \
    case "${TARGETARCH:-amd64}" in amd64) s6arch=x86_64 ;; arm64) s6arch=aarch64 ;; *) echo "unsupported arch" >&2; exit 1 ;; esac; \
    base="https://github.com/just-containers/s6-overlay/releases/download/v${S6_OVERLAY_VERSION}"; \
    curl -fsSL "$base/s6-overlay-noarch.tar.xz" | tar -C / -Jxp; \
    curl -fsSL "$base/s6-overlay-${s6arch}.tar.xz" | tar -C / -Jxp; \
    apt-get purge -y gnupg xz-utils; \
    apt-get autoremove -y; \
    rm -rf /var/lib/apt/lists/*; \
    useradd --uid 1654 --no-create-home --shell /usr/sbin/nologin app

COPY --from=dotwire /app/dotwire /usr/local/bin/dotwire
COPY --from=nats /usr/local/bin/nats-server /usr/local/bin/nats-server
COPY --from=caddy /usr/bin/caddy /usr/local/bin/caddy
COPY --from=web /usr/local/bin/node /usr/local/bin/node

COPY --from=web /app/.next/standalone /app/web
COPY --from=web /app/.next/static /app/web/.next/static
COPY --from=web /app/public /app/web/public

COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/nats.conf /etc/nats.conf
COPY deploy/loading.html /srv/loading.html
COPY deploy/boot /etc/dw-boot
COPY deploy/s6-rc.d /etc/s6-overlay/s6-rc.d

# Windows checkouts lose the executable bit; set it here. Next writes its cache under .next.
RUN chmod +x /etc/dw-boot/*.sh /etc/s6-overlay/s6-rc.d/*/run /etc/s6-overlay/s6-rc.d/*/finish \
 && chown -R app:app /app/web/.next

# Don't set S6_KEEP_ENV=1: it turns with-contenv into a no-op, and the per-boot secrets init.sh
# writes to /run/s6/container_environment would never reach the services.
ENV S6_CMD_WAIT_FOR_SERVICES_MAXTIME=0 \
    S6_BEHAVIOUR_IF_STAGE2_FAILS=2 \
    PATH=/usr/lib/postgresql/17/bin:$PATH

EXPOSE 8000
ENTRYPOINT ["unshare", "--pid", "--fork", "--mount-proc", "/init"]
