import "server-only";

// Only Fly's proxy sets Fly-Client-IP. X-Forwarded-For is never read: Caddy appends to it, so a
// client can seed the first entry.
export function clientIp(req: Request): string {
  return req.headers.get("fly-client-ip")?.trim() || "unknown";
}
