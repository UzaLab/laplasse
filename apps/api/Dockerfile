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

# Bundle prod sans symlinks pnpm (node_modules autonome)
WORKDIR /app
RUN pnpm deploy --filter=api --prod /prod/api

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /prod/api ./

EXPOSE 3001

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy || echo '[warn] prisma migrate deploy failed'; exec node dist/src/main.js"]
