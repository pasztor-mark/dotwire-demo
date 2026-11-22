import "server-only";
import { CAPS } from "./caps";
import { HONEYPOT_FIELD } from "./honeypot";
import { sign, unsign } from "./sign";

/** Signed render timestamp; call while rendering the form (inside the request-time boundary). */
export function issueFormTs(): string {
  return sign(String(Date.now()));
}

// Exactly what issueFormTs produces: epoch ms + "." + base64url HMAC-SHA256 (43 chars).
const TS_SHAPE = /^\d{13}\.[A-Za-z0-9_-]{43}$/;

/**
 * 'trap' → respond with a fake success and do nothing. 'expired' is a real user who left the tab
 * open too long — or across a scale-to-zero restart, which rotates the signing secret so a
 * well-formed ts stops verifying — so it gets a real "reload" error instead of silently failing.
 */
export function checkForm(body: Record<string, unknown>): "ok" | "trap" | "expired" {
  const honeypot = body[HONEYPOT_FIELD];
  if (typeof honeypot === "string" && honeypot !== "") return "trap";
  if (typeof body.ts !== "string") return "trap";
  const verified = unsign(body.ts);
  if (verified === null) return TS_SHAPE.test(body.ts) ? "expired" : "trap";
  const renderedAt = Number(verified);
  if (!Number.isFinite(renderedAt) || renderedAt <= 0) return "trap";
  const elapsed = Date.now() - renderedAt;
  if (elapsed < CAPS.FORM_MIN_MS) return "trap";
  if (elapsed > CAPS.FORM_MAX_MS) return "expired";
  return "ok";
}
