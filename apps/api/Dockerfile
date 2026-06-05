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
RUN npx prisma generate
RUN pnpm build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./
COPY apps/api/prisma ./prisma

# Générer le client Prisma dans le runner
RUN npx prisma generate

EXPOSE 3001

# Migration + démarrage
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]
