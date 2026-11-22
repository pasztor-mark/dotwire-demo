import type { NextConfig } from "next";

// No script-src here: Next injects inline hydration scripts, and a nonce-based CSP would force
// every page to render per request. User content is never rendered as HTML (see ChatRoom).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Browser default, set explicitly: "no-referrer" can break Cloudflare Turnstile's origin check.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
