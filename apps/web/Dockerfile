# Build optimisé VPS Coolify (RAM limitée) — standalone Next.js, cache pnpm, 1 worker.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app
ENV PNPM_CHILD_CONCURRENCY=1 \
    npm_config_fund=false \
    npm_config_audit=false \
    NEXT_TELEMETRY_DISABLED=1

# ── Deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
RUN echo "node-linker=hoisted" > .npmrc
RUN --mount=type=cache,id=laplasse-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter web

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
# Webpack + 1 worker : pic RAM plus bas que Turbopack sur VPS ~2 Go
ENV NODE_OPTIONS="--max-old-space-size=640" \
    NEXT_PRIVATE_WORKER_COUNT=1 \
    CI=true
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./apps/web
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

WORKDIR /app/apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=LaPlasse
ARG NEXT_PUBLIC_DEFAULT_CITY=Abidjan
ARG NEXT_PUBLIC_DEFAULT_DISTRICT=Cocody
ARG NEXT_PUBLIC_ROOT_DOMAIN=laplasse.tech
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_DEFAULT_CITY=$NEXT_PUBLIC_DEFAULT_CITY \
    NEXT_PUBLIC_DEFAULT_DISTRICT=$NEXT_PUBLIC_DEFAULT_DISTRICT \
    NEXT_PUBLIC_ROOT_DOMAIN=$NEXT_PUBLIC_ROOT_DOMAIN \
    NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY \
    NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

RUN --mount=type=cache,id=laplasse-next-web,target=/app/apps/web/.next/cache \
    pnpm run build:docker

# ── Runner (standalone = ~50 Mo vs image complète) ────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

WORKDIR /app/apps/web
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
