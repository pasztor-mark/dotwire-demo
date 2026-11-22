import { randomUUID } from "node:crypto";
import { CAPS } from "@/lib/caps";
import { containsLink } from "@/lib/containsLink";
import { host } from "@/lib/dotwire";
import { checkForm } from "@/lib/formGuard";
import { fail, json, rateLimited, readJson } from "@/lib/http";
import { formatCode, generateCode } from "@/lib/inviteCode";
import { take } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/session";
import { roomsCreatedBy, store } from "@/lib/store";

const ROOM_NAME_CHARS = /^[\p{L}\p{N} .,!?'’&()-]+$/u;

export async function GET(req: Request) {
  const username = getCurrentUser(req);
  if (!username) return fail(401, "no_session", "No session.");

  let ids: string[];
  try {
    ids = await host().getUserRooms(username);
  } catch {
    return fail(502, "upstream", "Chat backend unavailable.");
  }

  // dotwire is the authority on membership; the store only supplies names and codes.
  const rooms = ids.flatMap((roomId) => {
    const room = store.rooms.get(roomId);
    if (!room) return [];
    return [{ roomId, name: room.name, ...(room.createdBy === username && { code: formatCode(room.code) }) }];
  });
  return json(200, { rooms });
}

export async function POST(req: Request) {
  const username = getCurrentUser(req);
  if (!username) return fail(401, "no_session", "No session.");

  const limited = take("roomCreatePerSession", username);
  if (!limited.ok) return rateLimited(limited.retryAfterSec);

  const body = await readJson(req);
  const form = checkForm(body);
  if (form === "trap") return json(200, {});
  if (form === "expired") return fail(409, "form_expired", "This form expired, reload the page.");

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (
    name.length < CAPS.ROOM_NAME_MIN ||
    name.length > CAPS.ROOM_NAME_MAX ||
    !ROOM_NAME_CHARS.test(name) ||
    containsLink(name)
  ) {
    return fail(400, "invalid_name", "Room names are 1–40 letters, numbers and basic punctuation, without links.");
  }

  if (roomsCreatedBy(username) >= CAPS.MAX_ROOMS_PER_USER) {
    return fail(403, "room_limit", `You can create up to ${CAPS.MAX_ROOMS_PER_USER} rooms.`);
  }
  if (store.rooms.size >= CAPS.MAX_ROOMS) {
    return fail(503, "rooms_full", "The demo has reached its room limit — try again later.");
  }

  const roomId = randomUUID();
  const code = generateCode(store.codes);
  try {
    await host().addRoomMembers(roomId, [username]);
  } catch {
    return fail(502, "upstream", "Chat backend unavailable.");
  }
  store.rooms.set(roomId, { name, code, createdBy: username });
  store.codes.set(code, roomId);

  return json(200, { roomId, name, code: formatCode(code) });
}
