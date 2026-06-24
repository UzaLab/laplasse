# Build optimisé VPS Coolify (RAM limitée) — 1 job à la fois, cache pnpm, deps prod seules au runtime.
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app
ENV PNPM_CHILD_CONCURRENCY=1 \
    npm_config_fund=false \
    npm_config_audit=false

# ── Deps (dev + prod, pour compiler) ─────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN echo "node-linker=hoisted" > .npmrc
RUN --mount=type=cache,id=laplasse-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter api

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
# 768 Mo : évite le swap sur VPS 2 Go quand Coolify build plusieurs services
ENV NODE_OPTIONS="--max-old-space-size=768"
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm exec tsc -p tsconfig.build.json

# ── Deps production (image finale légère) ──────────────────────────────────────
FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN echo "node-linker=hoisted" > .npmrc
RUN --mount=type=cache,id=laplasse-pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter api --prod

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache wget

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=5 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "set -e; node node_modules/prisma/build/index.js migrate resolve --rolled-back 20260623120000_courier_kyc_logistics_onboarding 2>/dev/null || true; node node_modules/prisma/build/index.js migrate deploy; if [ \"$RUN_SEED\" = \"true\" ]; then node dist/prisma/seed.js; fi; if [ \"$RUN_SEED_DELIVERY\" = \"true\" ]; then node dist/prisma/seed-demo-users.js && node dist/prisma/seed-courier-demo.js && node dist/prisma/seed-courier-demo-mission.js && node dist/prisma/seed-delivery-stakeholders.js && node dist/prisma/seed-delivery.js; fi; exec node dist/src/main.js"]
