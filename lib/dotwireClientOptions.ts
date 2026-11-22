import type { DotwireClientOptions } from "@dotwire/react";

// Module-level so DotwireProvider never sees a new object identity (which would rebuild the
// client). "/dw" is relative: SignalR and fetch resolve it against the page origin, and Caddy
// strips the prefix before the gateway.
export const DOTWIRE_OPTIONS: DotwireClientOptions = {
  baseUrl: "/dw",
  tokenUrl: "/api/dotwire/token",
};
