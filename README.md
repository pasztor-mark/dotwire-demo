# dw-demo

A public, try-it-yourself chat demo of [dotwire](https://github.com/pasztor-mark/dotwire), a
self-hosted realtime chat backend. Open it, get a random name, create a private room, share the
invite code (or open a second tab), and chat. Typing indicators and presence included.

It costs close to nothing to run: the whole stack scales to zero, and every boot starts from an
empty database.

## Try it

Open the deployed URL. If nobody has used it for a while, you'll see a "Waking up the demo…" page
for a few seconds while the stack boots. Then:

1. Pass the Cloudflare check and click **Enter the demo**. You get a name like `amber-otter-42`.
2. **Create a private room.** You'll see its invite code, e.g. `7KQ2-M9XA`.
3. In another browser (or a private window), enter the demo again and **join with the code**.

## Landing page and demo flag

The home page doubles as dotwire's project landing page. The demo section on it only appears when
`DEMO_ENABLED=true` (a runtime variable, set in `fly.toml` under `[env]`). With any other value the
page is the landing page alone: sessions can't be created, existing session cookies are ignored,
every room route behaves as signed out, and the Turnstile keys aren't needed.

## How it works

```
                 Internet (Fly proxy, TLS, auto-start / auto-stop)
                                   │ :8000
┌──────────────────────────────────┼───────────────────────────────────────────┐
│ ONE Fly Machine (shared-cpu-1x, 1 GB, ephemeral rootfs, no volumes)          │
│                                  ▼                                           │
│   Caddy ─┬─ not ready ──► static loading page (+ /__status JSON)             │
│          ├─ /dw/* ──────► dotwire gateway   127.0.0.1:8080  (prefix stripped)│
│          ├─ /api/hooks/presend*, /api/otlp* ──► 404 (loopback only)          │
│          └─ /* ─────────► Next.js           127.0.0.1:3000                   │
│                                                                              │
│   dotwire ──► Postgres 17 + TimescaleDB  127.0.0.1:5432  (data on rootfs)    │
│          ──► NATS JetStream              127.0.0.1:4222  (store on rootfs)   │
│          ──► presend webhook ──► Next.js 127.0.0.1:3000/api/hooks/presend    │
│          ──► OTLP metrics ─────► Next.js 127.0.0.1:3000/api/otlp (every 5 s) │
│                                                                              │
│   Next.js ──► dotwire admin/HTTP API via @dotwire/host                       │
└──────────────────────────────────────────────────────────────────────────────┘
Browser: @dotwire/react → /dw (SignalR + REST), tokens from /api/dotwire/token
```

**Scale to zero, wipe on boot.** Fly stops the Machine when no connections are open and starts it
on the next request. Postgres and NATS keep their data on the Machine's root filesystem, which Fly
resets on every start, so each boot is a blank slate. The boot script also deletes the data
directories before `initdb`, so the wipe doesn't depend on Fly's behavior. If any process crashes,
the whole container stops and restarts, so app state and database state always reset together.

**Per-boot secrets.** Every start generates new Postgres passwords, a new AES-256 key for
dotwire's encryption at rest, a new RS256 keypair for JWTs, a new webhook HMAC secret and a new
cookie-signing secret. The Turnstile secret is the only long-lived secret. A side effect: cookies
from before a restart simply stop verifying.

**Loading page.** Caddy starts first and serves a 2 KB static page while Postgres, NATS, dotwire
and Next.js boot. The page shows each step as it finishes and reloads into the app once
everything is ready. It returns HTTP 200 with the same Open Graph tags as the app, so a link
preview crawler that wakes the Machine still gets a proper preview.

**Identity.** There are no accounts. After a Turnstile check you get a server-generated username,
and that username is your dotwire user id (the JWT `sub`). A signed, httpOnly session cookie
carries it, and Next.js mints short-lived dotwire tokens from that cookie.

**Live metrics.** Inside a room, a third column (a collapsed **Metrics** toggle on small screens)
shows dotwire's own OpenTelemetry metrics: messages per second, send latency (p50 and p99), fanout
lag p99, live connections, CPU and memory. dotwire pushes them over loopback every 5 seconds, and
Next.js keeps the last 5 minutes in memory, so they're wiped on every boot like everything else.
Only signed-in visitors can read them. They're totals for the whole demo and carry no user ids,
room ids or message content.

**Private rooms.** Rooms are joined only with an invite code: 8 characters of Crockford base32,
about 40 bits. dotwire itself enforces membership on every subscription and history read, so the
code is the only way in.

**Abuse protection.**
- Cloudflare Turnstile when a session is created.
- Hidden honeypot fields and a signed render-time check on every form. Bots get a fake success
  and nothing happens.
- Per-IP and per-session rate limits, plus dotwire's own per-user send limit.
- Hard caps on users, rooms and members (see below).
- **No links of any kind.** dotwire's presend webhook runs every message through a link filter
  before it's accepted, and fails closed. The filter catches full-width and zero-width tricks,
  `[.]`/`(dot)` spellings and spaced-out domains. It deliberately over-blocks: `Node.js` is
  rejected too.

## Limits

| Limit | Value |
|---|---|
| Users per boot | 500 |
| Rooms in total | 200 |
| Rooms per user | 3 |
| Members per room | 20 |
| Message length | 500 characters |
| Room name length | 1–40 characters |
| Session creation | 5 per 10 minutes per IP |
| Token requests | 30 per minute per session |
| Join attempts | 10 per minute per session, 20 per 10 minutes per IP |
| Room creation | 5 per 10 minutes per session |
| Message sends (dotwire) | burst of 5, then 1 every 2 seconds |
| dotwire token lifetime | 10 minutes |

All app-side values live in [`lib/caps.ts`](lib/caps.ts).

## Cost model

A stopped Machine costs only its root filesystem storage, a few cents a month. A running one costs
about the price of a 1 GB `shared-cpu-1x` Machine for the hours it's awake. Check
[Fly's pricing](https://fly.io/docs/about/pricing/) for current numbers, and set a spend alert.

## Deploy

1. `pnpm install`. This updates `pnpm-lock.yaml`, which the image build installs from frozen.
2. In the Cloudflare dashboard, create a Turnstile widget whose hostname is your app's host
   (e.g. `dw-demo.fly.dev`). Put its site key in `fly.toml` under `[build.args]`.
3. `fly launch --no-deploy`. Keep the existing `fly.toml`, and adjust `app` and `PUBLIC_HOST` if
   the name is taken.
4. `fly secrets set TURNSTILE_SECRET_KEY=<secret key>`
5. `fly deploy --ha=false`
6. `fly scale count 1`. There must be exactly one Machine, because rooms and sessions live in
   that Machine's memory.
7. Set a spend alert in the Fly dashboard.

## Local development

You need a running dotwire stack. From the dotwire repo, `docker compose up` (see its README).
Configure it to trust this app's tokens and call its presend hook:

- `Auth__Issuer=dw-demo`, `Auth__Audience=dotwire`, `Auth__Keys__demo=<public half of your dev key>`
- `Dotwire__Webhooks__Presend__Url=http://host.docker.internal:3000/api/hooks/presend`,
  `Dotwire__Webhooks__AllowInsecureUrls=true` (dotwire refuses non-loopback `http` otherwise) and
  `Dotwire__Webhooks__Secret=<same as WEBHOOK_SECRET>`
- For the live metrics column: `OTEL_EXPORTER_OTLP_ENDPOINT=http://host.docker.internal:3000/api/otlp`,
  `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf` and `OTEL_METRIC_EXPORT_INTERVAL=5000`

Then copy `.env.example` to `.env.local`, fill it in, and run `pnpm dev`. The browser expects the
gateway at `/dw` on the same origin, so put a small proxy in front of both: `/dw/*` with the
prefix stripped to `:8080`, everything else to `:3000`. `deploy/Caddyfile` won't work as-is,
because its readiness gate waits for a file only the image's boot script creates. The simplest
end-to-end check is running the full image:
`docker build -f deploy/Dockerfile --build-arg NEXT_PUBLIC_TURNSTILE_SITE_KEY=... -t dw-demo .`,
then `docker run -p 8000:8000 -e TURNSTILE_SECRET_KEY=... -e PUBLIC_HOST=localhost dw-demo`.

## Known limitations

- The link filter can't catch everything. A domain written with a space only after the dot
  (`example. com`) reads exactly like normal punctuation and gets through, and so do spellings
  with no separator at all. It also over-blocks, in any script. Because `。` is a real domain
  separator, CJK sentences where `。` is followed directly by more text are rejected.
- Presence has no snapshot. You see someone as online once they join or leave after you open the
  room.
- It's a single Machine with in-memory state. That's on purpose here, but it doesn't scale out.
- dotwire is in early development and not production-ready. Neither is this demo.
