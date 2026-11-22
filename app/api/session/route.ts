import { CAPS } from "@/lib/caps";
import { clientIp } from "@/lib/clientIp";
import { host } from "@/lib/dotwire";
import { env } from "@/lib/env";
import { checkForm } from "@/lib/formGuard";
import { fail, json, rateLimited, readJson } from "@/lib/http";
import { take } from "@/lib/rateLimit";
import { getCurrentUser, issueSession } from "@/lib/session";
import { store } from "@/lib/store";
import { verifyTurnstile } from "@/lib/turnstile";
import { generateUsername } from "@/lib/usernames";

export function GET(req: Request) {
  const username = getCurrentUser(req);
  return username ? json(200, { username }) : fail(401, "no_session", "No session.");
}

export async function POST(req: Request) {
  if (!env.DEMO_ENABLED) return fail(404, "demo_disabled", "The demo is turned off.");
  const ip = clientIp(req);
  const limited = take("sessionPerIp", ip);
  if (!limited.ok) return rateLimited(limited.retryAfterSec);

  const body = await readJson(req);
  // Honeypot and time trap run before Turnstile, so bot traffic never costs a siteverify call.
  const form = checkForm(body);
  if (form === "trap") return json(200, {});
  if (form === "expired") return fail(409, "form_expired", "This form expired, reload the page.");

  const token = typeof body.turnstileToken === "string" ? body.turnstileToken : "";
  if (!token || !(await verifyTurnstile(token, ip))) {
    return fail(403, "turnstile_failed", "Verification failed, please try again.");
  }

  if (store.users.size >= CAPS.MAX_USERS) {
    return fail(503, "demo_full", "The demo is full right now — try again later.");
  }

  // Reserve before the await so a concurrent request can't draw the same name.
  const username = generateUsername(store.users);
  store.users.add(username);
  try {
    await host().setUserRole(username, "member");
  } catch {
    store.users.delete(username);
    return fail(502, "upstream", "Chat backend unavailable.");
  }

  return json(200, { username }, { "Set-Cookie": issueSession(username) });
}
