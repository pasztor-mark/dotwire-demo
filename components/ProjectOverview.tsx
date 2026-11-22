import type { ReactNode } from "react";

const FEATURES = [
  {
    title: "Realtime rooms",
    body: "Messages, history paging, typing indicators and presence, over SignalR with a REST API alongside.",
  },
  {
    title: "Your auth",
    body: "dotwire trusts RS256 JWTs your app signs, checked against issuer, audience and key id. The token's sub is the user id.",
  },
  {
    title: "Enforced membership",
    body: "Every subscription and history read is checked against room membership by dotwire itself, not by your frontend.",
  },
  {
    title: "Presend webhooks",
    body: "An HMAC-signed hook sees each message before it's accepted and can reject it. This demo uses it to block links.",
  },
  {
    title: "Encrypted at rest",
    body: "Data at rest is encrypted with an AES-256 key. Storage is Postgres with TimescaleDB, the message bus is NATS JetStream.",
  },
  {
    title: "Send limits",
    body: "A per-user send rate limit is built in, on top of whatever your app enforces.",
  },
];

const PACKAGES = [
  { name: "@dotwire/client", body: "The browser connection: rooms, messages, typing and presence." },
  { name: "@dotwire/react", body: "A provider and hooks: useRoom, useTyping, usePresence, useConnectionState." },
  { name: "@dotwire/host", body: "Server side: mints user tokens, manages roles and members, verifies webhooks." },
];

const RUNS = [
  {
    title: "Scale to zero",
    body: "Fly stops the Machine when nobody is connected and starts it on the next request. Every boot starts from an empty database.",
  },
  {
    title: "Per-boot secrets",
    body: "Each start generates new database passwords, encryption key, JWT keypair, webhook and cookie secrets. Old cookies simply stop verifying.",
  },
  {
    title: "Abuse protection",
    body: "Turnstile on sign-in, honeypots and signed form timestamps, per-IP and per-session rate limits, hard caps, and no links of any kind.",
  },
];

type Route = { via: string; to: string; note?: string };
type Service = { name: string; routes: Route[] };

const BROWSER: Service = {
  name: "Browser",
  routes: [
    { via: "@dotwire/react", to: "/dw", note: "SignalR + REST" },
    { via: "tokens", to: "/api/dotwire/token" },
  ],
};

const MACHINE_SPECS = ["shared-cpu-1x", "1 GB", "ephemeral rootfs", "no volumes"];

const SERVICES: Service[] = [
  {
    name: "Caddy",
    routes: [
      { via: "not ready", to: "Static loading page", note: "+ /__status JSON" },
      { via: "/dw/*", to: "dotwire gateway", note: "127.0.0.1:8080, prefix stripped" },
      { via: "/*", to: "Next.js", note: "127.0.0.1:3000" },
    ],
  },
  {
    name: "dotwire",
    routes: [
      { via: "data", to: "Postgres 17 + TimescaleDB", note: "127.0.0.1:5432, on rootfs" },
      { via: "bus", to: "NATS JetStream", note: "127.0.0.1:4222, on rootfs" },
      { via: "presend webhook", to: "Next.js", note: "/api/hooks/presend" },
    ],
  },
  {
    name: "Next.js",
    routes: [{ via: "admin / HTTP API", to: "dotwire", note: "via @dotwire/host" }],
  },
];

export const REPO_URL = "https://github.com/pasztor-mark/dotwire";

function Card({ title, body }: { title: string; body: string }) {
  return (
    <li data-m="up" className="tint flex flex-col gap-2 p-6">
      <h3 className="text-2xl font-extrabold tracking-tight">{title}</h3>
      <p className="text-ink2">{body}</p>
    </li>
  );
}

function ServiceCard({ name, routes }: Service) {
  return (
    <div data-m="up" className="tint flex flex-col gap-3 p-6">
      <h3 className="text-2xl font-extrabold tracking-tight">{name}</h3>
      <ul className="flex flex-col gap-3">
        {routes.map((r) => (
          <li key={r.via + r.to} className="flex flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="chip-sm text-sm">{r.via}</span>
              <span aria-hidden="true" className="text-accent">
                →
              </span>
              <span className="sr-only">to</span>
              <strong className="font-bold">{r.to}</strong>
            </span>
            {r.note && <span className="pl-3 text-sm text-muted">{r.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Architecture() {
  return (
    <div className="flex flex-col gap-3">
      <ServiceCard {...BROWSER} />
      <p data-m="up" className="flex flex-wrap items-center justify-center gap-2 text-center text-muted">
        <span aria-hidden="true" className="text-xl text-accent">
          ↓
        </span>
        Internet · Fly proxy · TLS · auto-start / auto-stop
        <span className="chip-sm text-sm">:8000</span>
      </p>
      <div className="flex flex-col gap-4 rounded-[28px] border border-dashed border-border p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-2 text-xl font-extrabold">One Fly Machine</h3>
          {MACHINE_SPECS.map((s) => (
            <span key={s} className="chip-sm text-sm">
              {s}
            </span>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <ServiceCard key={s.name} {...s} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HowItRuns() {
  return (
    <section className="glass glass-column gap-6">
      <h2 data-m="up" className="title-card">
        How this demo runs
      </h2>
      <p data-m="up" className="text-lg text-ink2">
        The whole stack runs on one small Fly Machine and costs close to nothing.
      </p>
      <Architecture />
      <ul className="grid gap-3 lg:grid-cols-3">
        {RUNS.map((r) => (
          <Card key={r.title} {...r} />
        ))}
      </ul>
    </section>
  );
}

export function ProjectOverview({ children }: { children?: ReactNode }) {
  return (
    <>
      <section className="glass glass-column gap-6">
        <h2 data-m="up" className="title-card">
          What it does
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} {...f} />
          ))}
        </ul>
        <h2 data-m="up" className="title-card pt-4">
          Packages
        </h2>
        <ul className="grid gap-3 lg:grid-cols-3">
          {PACKAGES.map((p) => (
            <li key={p.name} data-m="up" className="tint flex flex-col gap-2 p-6">
              <a
                href={`https://www.npmjs.com/package/${p.name}`}
                className="self-start font-mono text-lg font-bold text-accent normal-case hover:underline"
              >
                <code>{p.name}</code> <span aria-hidden="true">↗</span>
                <span className="sr-only">on npm</span>
              </a>
              <p className="text-ink2">{p.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {children}

      <section data-m="up" className="glass glass-column flex-row flex-wrap items-center justify-between gap-4">
        <p className="text-lg text-ink2">dotwire is in early development and not production-ready yet.</p>
        <a href={REPO_URL} className="btn-light">
          View on GitHub ↗
        </a>
      </section>
    </>
  );
}
