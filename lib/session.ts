import "server-only";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { env } from "./env";
import { sign, unsign } from "./sign";
import { store } from "./store";

export const COOKIE = "dw_session";

/** Session cookie (no Max-Age). A wipe rotates SIGNING_SECRET, so old cookies stop verifying. */
export function issueSession(username: string): string {
  return `${COOKIE}=${sign(username)}; HttpOnly; Secure; SameSite=Lax; Path=/`;
}

function userFromCookieValue(value: string | undefined): string | null {
  if (!value || !env.DEMO_ENABLED) return null;
  const username = unsign(value);
  return username && store.users.has(username) ? username : null;
}

/** For route handlers. Never throws: a stale or forged cookie is simply "no session". */
export function getCurrentUser(req: Request): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq !== -1 && part.slice(0, eq).trim() === COOKIE) {
      return userFromCookieValue(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/** For server components — call only inside a <Suspense> boundary (Cache Components). */
export async function getCurrentUserFromCookies(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
  await connection();
  return userFromCookieValue(value);
}
