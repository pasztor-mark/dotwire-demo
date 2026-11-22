import { fail, json } from "@/lib/http";
import { snapshot } from "@/lib/metrics";
import { getCurrentUser } from "@/lib/session";

export function GET(req: Request) {
  if (!getCurrentUser(req)) return fail(401, "no_session", "No session.");
  return json(200, snapshot());
}
