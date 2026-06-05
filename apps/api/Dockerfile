FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

# ── Deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile --filter api

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY apps/api ./apps/api
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./

WORKDIR /app/apps/api
RUN node_modules/.bin/prisma generate
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app/apps/api

ENV NODE_ENV=production

# Garder la structure pnpm (store racine + symlinks apps/api)
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

# Migration puis démarrage (ne pas bloquer si migrate a déjà été appliqué)
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy || echo '[warn] prisma migrate deploy failed'; exec node dist/src/main.js"]
