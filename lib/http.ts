import "server-only";

export function json(status: number, body: unknown, headers?: HeadersInit): Response {
  const h = new Headers(headers);
  h.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers: h });
}

export function fail(status: number, code: string, message: string, headers?: HeadersInit): Response {
  return json(status, { error: code, message }, headers);
}

export function rateLimited(retryAfterSec: number): Response {
  return fail(429, "rate_limited", "Slow down a little.", { "Retry-After": String(retryAfterSec) });
}

/** Parses a JSON object body; anything else becomes `{}` so form checks treat it as a trap. */
export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
