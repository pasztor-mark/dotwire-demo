// Browser-side fetch helpers for the app's own /api routes (Tasks 5–6 contract).
import { HONEYPOT_FIELD } from "./honeypot";

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string; message: string };

async function parse<T>(res: Response): Promise<ApiResult<T>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, status: res.status, data: body as T };
  return {
    ok: false,
    status: res.status,
    error: typeof body.error === "string" ? body.error : "unknown",
    message: typeof body.message === "string" ? body.message : "Something went wrong, try again.",
  };
}

const NETWORK_ERROR = { ok: false, status: 0, error: "network", message: "Couldn't reach the demo — is it restarting?" } as const;

export async function getJson<T>(path: string): Promise<ApiResult<T>> {
  try {
    return await parse<T>(await fetch(path, { cache: "no-store" }));
  } catch {
    return NETWORK_ERROR;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    return await parse<T>(
      await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  } catch {
    return NETWORK_ERROR;
  }
}

/** Collects the honeypot + signed timestamp that every guarded form sends. */
export function guardFields(form: HTMLFormElement, ts: string): Record<string, string> {
  const value = new FormData(form).get(HONEYPOT_FIELD);
  return { [HONEYPOT_FIELD]: typeof value === "string" ? value : "", ts };
}
