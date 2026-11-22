import type { Metadata } from "next";
import { HeroCard, MaskedTitle } from "@/components/HeroCard";

export const metadata: Metadata = { title: "terms — dotwire demo" };

const CONTACT = "contact@pasztormark.dev";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "A demo, as is",
    body: "This is a free, public demo of an early-development project, run by Márk Pásztor. It is provided as is, without any warranty or uptime promise. It may be slow, change, break or go offline at any time, and everything in it is deleted whenever it restarts.",
  },
  {
    title: "Be decent",
    body: "No harassment, hate, illegal content, spam or personal data about other people. Don't try to attack, overload or probe the service, and don't work around the rate limits, caps or link filter. Links are blocked on purpose.",
  },
  {
    title: "Your messages",
    body: "You are responsible for what you send, and other people in your room can read it. Don't share anything private or sensitive.",
  },
  {
    title: "My right to act",
    body: "I can remove rooms, block access or wipe the whole demo at any time, without notice.",
  },
  {
    title: "Liability",
    body: "To the extent the law allows, I'm not liable for any loss or damage from using the demo. Nothing here limits rights you have by law that can't be waived.",
  },
  {
    title: "Source code",
    body: "The project's code is on GitHub under its own licence. These terms cover only use of the hosted demo.",
  },
  {
    title: "Contact",
    body: `Questions or abuse reports: ${CONTACT}. See also the privacy page for how data is handled.`,
  },
];

export default function Terms() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <HeroCard>
        <div className="flex flex-col gap-6">
          <MaskedTitle lines={["terms"]} className="display-section" />
          <p className="lead text-ink2">Using the demo means you agree to these short terms.</p>
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
