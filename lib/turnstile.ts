import "server-only";
import { env } from "./env";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Fails closed: any network error, timeout or mismatch is a failed verification. */
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  if (ip !== "unknown") form.set("remoteip", ip);
  try {
    const res = await fetch(SITEVERIFY, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean; hostname?: string; action?: string };
    if (data.success !== true) return false;
    if (process.env.NODE_ENV === "development") return true;
    return data.hostname === env.PUBLIC_HOST && data.action === "session";
  } catch {
    return false;
  }
}
