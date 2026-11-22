import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

// Lazy getters: `next build` imports route modules without the per-boot secrets present, so
// nothing may be read at module load.
export const env = {
  get DOTWIRE_PRIVATE_KEY_PEM() {
    return required("DOTWIRE_PRIVATE_KEY_PEM").replace(/\\n/g, "\n");
  },
  get WEBHOOK_SECRET() {
    return required("WEBHOOK_SECRET");
  },
  get SIGNING_SECRET() {
    return required("SIGNING_SECRET");
  },
  get TURNSTILE_SECRET_KEY() {
    return required("TURNSTILE_SECRET_KEY");
  },
  get PUBLIC_HOST() {
    return required("PUBLIC_HOST");
  },
  get NEXT_PUBLIC_TURNSTILE_SITE_KEY() {
    // Literal reference so `next build` inlines the build arg; the runtime image doesn't carry it.
    const value = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!value) throw new Error("Missing env: NEXT_PUBLIC_TURNSTILE_SITE_KEY");
    return value;
  },
  get DEMO_ENABLED() {
    return process.env.DEMO_ENABLED === "true";
  },
  get DOTWIRE_INTERNAL_URL() {
    return process.env.DOTWIRE_INTERNAL_URL || "http://127.0.0.1:8080";
  },
};
