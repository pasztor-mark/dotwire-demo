import type { Metadata } from "next";
import type { ReactNode } from "react";
import { HeroCard, MaskedTitle } from "@/components/HeroCard";

export const metadata: Metadata = { title: "privacy — dotwire demo" };

const CONTACT = "contact@pasztormark.dev";

const LINK = "underline text-accent";

const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: "What this is",
    body: "A public demo of dotwire, run by Márk Pásztor as a personal project. There are no accounts, no email addresses and no payments.",
  },
  {
    title: "What you type",
    body: "You get a generated username. Messages, room names and usernames are kept only while the demo's server is running and are deleted whenever it restarts or redeploys, which happens regularly. Don't share anything sensitive: other people in your room can read what you send.",
  },
  {
    title: "Cookie",
    body: "One signed, HttpOnly session cookie (dw_session) links your browser to your generated username. It expires when you close the browser and is not used for tracking, so there is no consent banner.",
  },
  {
    title: "IP addresses",
    body: (
      <>
        Your IP address is used in memory for rate limiting and abuse prevention and is not stored in the chat
        data. Fly.io, which hosts the demo in Frankfurt, may process IP addresses in its own network and logs (
        <a className={LINK} href="https://fly.io/legal/privacy-policy/">
          Fly.io privacy policy
        </a>
        ).
      </>
    ),
  },
  {
    title: "Cloudflare Turnstile",
    body: (
      <>
        The forms use Cloudflare Turnstile to block bots. Cloudflare receives data from your browser to do this,
        under its own{" "}
        <a className={LINK} href="https://www.cloudflare.com/privacypolicy/">
          privacy policy
        </a>
        .
      </>
    ),
  },
  {
    title: "What is not here",
    body: "No analytics, no advertising and no third-party trackers.",
  },
  {
    title: "Your rights and contact",
    body: `Under the GDPR you can ask what is held about you, or ask for it to be deleted. Since the demo wipes itself and holds no identity data, there is usually nothing beyond the current session. Write to ${CONTACT}.`,
  },
];

export default function Privacy() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <HeroCard>
        <div className="flex flex-col gap-6">
          <MaskedTitle lines={["privacy"]} className="display-section" />
          <p className="lead text-ink2">
            Short version: nothing identifying is collected, and chat data disappears when the demo restarts.
          </p>
        </div>
      </HeroCard>
      <ul className="flex flex-col gap-3">
        {SECTIONS.map((s) => (
          <li key={s.title} className="tint flex flex-col gap-2 p-6">
            <h2 className="text-2xl font-extrabold tracking-tight">{s.title}</h2>
            <p className="text-ink2">{s.body}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
