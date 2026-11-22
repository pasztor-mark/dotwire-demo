import "server-only";
import { DotwireHostClient, PresendResult, type PresendContext } from "@dotwire/host";
import { CAPS } from "./caps";
import { containsLink } from "./containsLink";
import { env } from "./env";
import { processSingleton } from "./globalState";

/**
 * The only moderation in the demo. dotwire calls it synchronously before accepting any message a
 * browser sends (fail-closed), via app/api/hooks/presend. Never log `content`.
 */
export function presend(ctx: PresendContext): PresendResult {
  if (ctx.content.trim() === "") return PresendResult.reject("empty");
  if (ctx.content.length > CAPS.MAX_MESSAGE_LEN) return PresendResult.reject("too_long");
  if (containsLink(ctx.content)) return PresendResult.reject("links_not_allowed");
  return PresendResult.accept();
}

/** Built on first use, not at import: `next build` loads this module without the per-boot env. */
export function host(): DotwireHostClient {
  return processSingleton(
    "host",
    () =>
      new DotwireHostClient({
        baseUrl: env.DOTWIRE_INTERNAL_URL,
        issuer: "dw-demo",
        audience: "dotwire",
        keyId: "demo",
        privateKeyPem: env.DOTWIRE_PRIVATE_KEY_PEM,
        webhookSecret: env.WEBHOOK_SECRET,
        presend,
      }),
  );
}
