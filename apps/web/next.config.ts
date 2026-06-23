import type { NextConfig } from "next";
import path from "path";
import { withSentryConfig } from "@sentry/nextjs";

const apiOrigin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api").replace(/\/api\/?$/, "");

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? "";
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: https: blob: ${apiOrigin}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} ${posthogHost} ${sentryDsn ? "*.sentry.io" : ""}`.trim(),
      `worker-src 'self' blob:`,
    ].join("; "),
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  // Évite les builds Docker bloqués sur le VPS (pages lentes / API indisponible)
  staticPageGenerationTimeout: 45,
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          ...securityHeaders,
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          ...securityHeaders,
        ],
      },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
  async redirects() {
    return [{ source: "/categories", destination: "/search", permanent: true }];
  },
};

// N'applique withSentryConfig que si un DSN est configuré
export default sentryDsn
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      silent: true,
      widenClientFileUpload: true,
      sourcemaps: { disable: true },
      disableLogger: true,
      automaticVercelMonitors: false,
    })
  : nextConfig;
