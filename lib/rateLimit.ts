import "server-only";
import { LIMITS, type LimitName } from "./caps";
import { processSingleton } from "./globalState";

type Bucket = { tokens: number; updatedAt: number };

const buckets = processSingleton("buckets", () => ({ map: new Map<string, Bucket>(), calls: 0 }));

/** Continuous-refill token bucket per (limit, key). Takes one token or reports when to retry. */
export function take(
  limit: LimitName,
  key: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const { capacity, windowMs } = LIMITS[limit];
  const ratePerMs = capacity / windowMs;
  const now = Date.now();
  const id = `${limit}:${key}`;

  if (++buckets.calls % 1000 === 0) prune(now);

  const bucket = buckets.map.get(id) ?? { tokens: capacity, updatedAt: now };
  bucket.tokens = Math.min(capacity, bucket.tokens + (now - bucket.updatedAt) * ratePerMs);
  bucket.updatedAt = now;
  buckets.map.set(id, bucket);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { ok: true };
  }
  return { ok: false, retryAfterSec: Math.max(1, Math.ceil((1 - bucket.tokens) / ratePerMs / 1000)) };
}

function prune(now: number) {
  for (const [id, bucket] of buckets.map) {
    const limit = LIMITS[id.slice(0, id.indexOf(":")) as LimitName];
    if (now - bucket.updatedAt > limit.windowMs) buckets.map.delete(id);
  }
}
