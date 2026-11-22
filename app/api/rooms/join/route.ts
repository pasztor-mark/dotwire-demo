import { CAPS } from "@/lib/caps";
import { clientIp } from "@/lib/clientIp";
import { host } from "@/lib/dotwire";
import { checkForm } from "@/lib/formGuard";
import { fail, json, rateLimited, readJson } from "@/lib/http";
import { normalizeCode } from "@/lib/inviteCode";
import { take } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/session";
import { store } from "@/lib/store";

export async function POST(req: Request) {
  const username = getCurrentUser(req);
  if (!username) return fail(401, "no_session", "No session.");

  for (const limited of [take("joinPerSession", username), take("joinPerIp", clientIp(req))]) {
    if (!limited.ok) return rateLimited(limited.retryAfterSec);
  }

  const body = await readJson(req);
  const form = checkForm(body);
  if (form === "trap") return json(200, {});
  if (form === "expired") return fail(409, "form_expired", "This form expired, reload the page.");

  // One response for "malformed" and "no such room", so codes can't be probed for shape.
  const code = typeof body.code === "string" ? normalizeCode(body.code) : "";
  const roomId = store.codes.get(code);
  const room = roomId ? store.rooms.get(roomId) : undefined;
  if (!roomId || !room) return fail(404, "invalid_code", "That code doesn't match a room.");

  try {
    const members = await host().getRoomMembers(roomId);
    if (!members.includes(username)) {
      if (members.length >= CAPS.MAX_MEMBERS_PER_ROOM) {
        return fail(403, "room_full", "That room is full.");
      }
      await host().addRoomMembers(roomId, [username]);
    }
  } catch {
    return fail(502, "upstream", "Chat backend unavailable.");
  }

  return json(200, { roomId, name: room.name });
}
