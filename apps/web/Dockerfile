FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# ── Deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile --filter web

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

WORKDIR /app/apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=LaPlasse
ARG NEXT_PUBLIC_DEFAULT_CITY=Abidjan
ARG NEXT_PUBLIC_DEFAULT_DISTRICT=Cocody
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
ARG NEXT_PUBLIC_SENTRY_DSN

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_DEFAULT_CITY=$NEXT_PUBLIC_DEFAULT_CITY
ENV NEXT_PUBLIC_DEFAULT_DISTRICT=$NEXT_PUBLIC_DEFAULT_DISTRICT
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
