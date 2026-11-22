import "server-only";

// Next may bundle route handlers and pages separately, which would duplicate module-level state.
// Everything process-wide hangs off one globalThis slot instead.
type GlobalState = Record<string, unknown>;

const g = globalThis as typeof globalThis & { __dw?: GlobalState };

export function processSingleton<T>(key: string, create: () => T): T {
  g.__dw ??= {};
  if (!(key in g.__dw)) g.__dw[key] = create();
  return g.__dw[key] as T;
}
