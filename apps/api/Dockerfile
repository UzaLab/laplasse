FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

# ── Deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
# node_modules plat (pas de symlinks pnpm) → fiable en production Docker
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install --frozen-lockfile --filter api

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
ENV NODE_OPTIONS="--max-old-space-size=2048"
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# wget requis par le healthcheck Coolify (Alpine n'inclut pas curl)
RUN apk add --no-cache wget

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=5s --start-period=120s --retries=5 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

# Seed uniquement si RUN_SEED=true (évite ~15s au démarrage en prod)
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && ( [ \"$RUN_SEED\" = \"true\" ] && node dist/prisma/seed.js || true ) || echo '[warn] migrate failed'; exec node dist/src/main.js"]
