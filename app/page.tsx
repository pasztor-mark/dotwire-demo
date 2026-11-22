import { connection } from "next/server";
import { Suspense, type CSSProperties } from "react";
import { EnterForm } from "@/components/EnterForm";
import { HeroCard, MaskedTitle } from "@/components/HeroCard";
import { Lobby } from "@/components/Lobby";
import { HowItRuns, ProjectOverview, REPO_URL } from "@/components/ProjectOverview";
import { env } from "@/lib/env";
import { issueFormTs } from "@/lib/formGuard";
import { getCurrentUserFromCookies } from "@/lib/session";

const STACK = ["Self-hosted", "SignalR + REST", "Postgres + TimescaleDB", "NATS JetStream", "Early development"];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <HeroCard>
        <div className="flex flex-col gap-6">
          <MaskedTitle lines={["dotwire"]} className="display-section" />
          <p className="lead m-load-up text-ink2" style={{ "--d": "240ms" } as CSSProperties}>
            A self-hosted realtime chat backend: private rooms, history, typing indicators and presence,
            behind your own auth.
          </p>
          <ul className="m-load-up flex flex-wrap gap-2" style={{ "--d": "360ms" } as CSSProperties}>
            {STACK.map((s) => (
              <li key={s} className="chip-sm">
                {s}
              </li>
            ))}
          </ul>
          <a
            href={REPO_URL}
            className="btn-accent m-load-up self-start"
            style={{ "--d": "480ms" } as CSSProperties}
          >
            View on GitHub ↗
          </a>
        </div>
      </HeroCard>

      {/* The session read is request-time, so it streams in behind this boundary (Cache Components). */}
      <Suspense fallback={null}>
        <Demo />
      </Suspense>

      <ProjectOverview>
        <Suspense fallback={null}>
          <DemoRuns />
        </Suspense>
      </ProjectOverview>
    </main>
  );
}

async function DemoRuns() {
  await connection();
  return env.DEMO_ENABLED ? <HowItRuns /> : null;
}

async function Demo() {
  await connection();
  if (!env.DEMO_ENABLED) return null;
  const user = await getCurrentUserFromCookies();
  const ts = issueFormTs();
  return (
    <section id="demo" className="glass glass-column gap-6">
      <h2 className="title-card">Try the live demo</h2>
      <ul className="flex flex-wrap gap-2">
        <li className="chip-sm">You get a random name, no sign-up.</li>
        <li className="chip-sm">Rooms are private: only people with the invite code can read them.</li>
        <li className="chip-sm">The demo scales to zero and wipes all data whenever it sleeps.</li>
      </ul>
      {user ? <Lobby username={user} ts={ts} /> : <EnterForm ts={ts} siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />}
    </section>
  );
}
