import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

function mac(value: string): string {
  return createHmac("sha256", env.SIGNING_SECRET).update(value).digest("base64url");
}

/** `value.mac` — the secret rotates every boot, so anything signed before a wipe stops verifying. */
export function sign(value: string): string {
  return `${value}.${mac(value)}`;
}

export function unsign(signed: string): string | null {
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = signed.slice(0, dot);
  const given = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(mac(value));
  if (given.length !== expected.length) return null;
  return timingSafeEqual(given, expected) ? value : null;
}
