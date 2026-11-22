"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { guardFields, postJson } from "@/lib/clientApi";
import { FormError } from "./FormError";
import { Honeypot } from "./Honeypot";

type Turnstile = {
  render(el: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId?: string): void;
  remove(widgetId: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function EnterForm({ ts, siteKey }: { ts: string; siteKey: string }) {
  const router = useRouter();
  const widgetEl = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string; expired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);

  function renderWidget() {
    if (!window.turnstile || !widgetEl.current) return;
    if (widgetId.current) window.turnstile.remove(widgetId.current);
    widgetId.current = window.turnstile.render(widgetEl.current, {
      sitekey: siteKey,
      action: "session",
      theme: "dark",
      callback: (t: string) => setToken(t),
      "expired-callback": () => setToken(null),
      "error-callback": () => setToken(null),
    });
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !accepted) return;
    setBusy(true);
    setError(null);
    const res = await postJson<{ username?: string }>("/api/session", {
      turnstileToken: token,
      acceptedTerms: accepted,
      ...guardFields(e.currentTarget, ts),
    });
    setBusy(false);
    if (res.ok) {
      if (res.data.username) router.refresh();
      return;
    }
    setError({ message: res.message, expired: res.status === 409 });
    setToken(null);
    if (widgetId.current) window.turnstile?.reset(widgetId.current);
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col items-start gap-4">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={renderWidget}
      />
      <Honeypot />
      <label className="flex items-start gap-3 text-ink2">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 size-4 shrink-0"
        />
        <span>
          I have read and agree to the{" "}
          <a href="/terms" target="_blank" rel="noopener" className="underline text-accent">
            terms of use
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noopener" className="underline text-accent">
            privacy policy
          </a>
          .
        </span>
      </label>
      <div ref={widgetEl} className="min-h-[65px]" />
      <button type="submit" disabled={!token || !accepted || busy} className="btn-accent">
        {busy ? "Entering…" : "Enter the demo →"}
      </button>
      <FormError error={error} />
    </form>
  );
}
