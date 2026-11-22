import { CAPS } from "@/lib/caps";
import { host } from "@/lib/dotwire";
import { fail, json, rateLimited } from "@/lib/http";
import { take } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/session";

/** `tokenUrl` for @dotwire/client: identity comes from the cookie, never from the request. */
export async function GET(req: Request) {
  const username = getCurrentUser(req);
  if (!username) return fail(401, "no_session", "No session.");

  const limited = take("tokenPerSession", username);
  if (!limited.ok) return rateLimited(limited.retryAfterSec);

  const token = await host().mintToken(username, {
    role: "member",
    displayName: username,
    ttl: CAPS.TOKEN_TTL,
  });
  return json(200, { token });
}
