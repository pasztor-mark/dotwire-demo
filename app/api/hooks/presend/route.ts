import { host } from "@/lib/dotwire";

// Called only by dotwire over loopback (Caddy 404s this path publicly). The SDK reads the raw
// body itself to verify X-Dotwire-Signature-V2, so nothing here may touch the body first.
export function POST(req: Request) {
  return host().handlePresendWebhook(req);
}
