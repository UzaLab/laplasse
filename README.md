# LaPlasse

> Découvre les meilleurs lieux autour de toi.

**LaPlasse** est une Business Discovery & Commerce Platform pour les commerces locaux africains.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 15 + TypeScript + Tailwind CSS v4 |
| Backend | NestJS + Prisma + PostgreSQL |
| Recherche | Meilisearch |
| Cache | Redis |
| Auth | JWT (access + refresh) + RBAC |

---

## Commandes pour démarrer l'application

### Prérequis
- Node.js ≥ 20 LTS
- pnpm ≥ 9
- Docker + Docker Compose

---

### 1. Infrastructure Docker (PostgreSQL + Redis + Meilisearch)

```bash
# Démarrer tous les services
docker compose up -d

# Vérifier que tout tourne
docker compose ps

# Arrêter les services
docker compose down
```

---

### 2. Base de données

```bash
# Dans apps/api/

# Appliquer les migrations
pnpm --filter api db:migrate

# Générer les types Prisma
pnpm --filter api db:generate

# Peupler la base (seed : catégories, marchands de démo)
pnpm --filter api db:seed

# Ouvrir Prisma Studio (UI graphique de la BDD)
pnpm --filter api db:studio
```

---

### 3. API NestJS (port 3001)

```bash
# Démarrage développement (hot reload)
pnpm --filter api start:dev

# Ou depuis la racine
pnpm dev:api

# Build production
pnpm --filter api build
pnpm --filter api start
```

> API disponible sur `http://localhost:3001/api`
> Health check : `http://localhost:3001/api/health`

---

### 4. Frontend Next.js (port 3000)

```bash
# Démarrage développement
pnpm --filter web dev

# Ou depuis la racine
pnpm dev:web

# Build production
pnpm --filter web build
pnpm --filter web start
```

> Frontend disponible sur `http://localhost:3000`

---

### 5. Démarrage complet (tout en parallèle)

```bash
# Depuis la racine du monorepo
docker compose up -d          # PostgreSQL (5433) + Redis + Meilisearch
pnpm dev                      # Lance web (3000) + api (3001) en parallèle
```

---

### 6. Réinitialiser la base de données

```bash
# Supprimer et recréer les tables + rejouer seed
pnpm --filter api db:migrate reset

# Ou manuellement
docker compose down -v        # supprime les volumes
docker compose up -d
pnpm --filter api db:migrate
pnpm --filter api db:seed
```

---

## Pages de l'application

| URL | Description |
|-----|-------------|
| `/` | Homepage : hero, catégories, établissements |
| `/search` | Recherche full-text (Meilisearch) |
| `/m/[slug]` | Page profil d'un établissement |
| `/categories/[slug]` | Liste marchands par catégorie |
| `/favoris` | Mes établissements sauvegardés |
| `/login` | Connexion |
| `/register` | Inscription |
| `/merchant/signup` | Créer sa fiche établissement |
| `/merchant/dashboard` | Tableau de bord marchand |
| `/merchant/profile/edit` | Modifier son profil |
| `/admin` | Dashboard admin (stats globales) |
| `/admin/merchants` | Modération des marchands |
| `/admin/reviews` | Modération des avis |

---

## Endpoints API principaux

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/health` | Public | Health check |
| GET | `/api/categories` | Public | Liste catégories |
| GET | `/api/merchants/featured` | Public | Marchands mis en avant |
| GET | `/api/merchants/nearby` | Public | Marchands à proximité |
| GET | `/api/merchants/:slug` | Public | Profil d'un marchand |
| GET | `/api/search?q=...` | Public | Recherche Meilisearch |
| POST | `/api/auth/register` | Public | Inscription |
| POST | `/api/auth/login` | Public | Connexion |
| GET | `/api/auth/me` | JWT | Mon profil |
| POST | `/api/merchants/register` | JWT | Créer ma fiche |
| GET | `/api/merchants/me/profile` | JWT | Mon profil marchand |
| PATCH | `/api/merchants/me/profile` | JWT | Modifier mon profil |
| GET | `/api/favorites` | JWT | Mes favoris |
| POST | `/api/favorites/:merchantId` | JWT | Toggle favori |
| POST | `/api/reviews` | JWT | Déposer un avis |
| GET | `/api/admin/stats` | ADMIN | Stats globales |
| GET | `/api/admin/merchants` | ADMIN | Liste marchands |
| PATCH | `/api/admin/merchants/:id/verify` | ADMIN | Valider/Rejeter |
| GET | `/api/admin/reviews` | ADMIN | Liste avis |
| PATCH | `/api/admin/reviews/:id/moderate` | ADMIN | Modérer un avis |

---

## Structure du projet

```
laplasse/
├── apps/
│   ├── web/              # Next.js 15 (port 3000)
│   │   └── src/
│   │       ├── app/      # Pages (App Router)
│   │       ├── features/ # Composants métier
│   │       ├── stores/   # Zustand (auth)
│   │       └── lib/      # API client, TanStack Query
│   └── api/              # NestJS (port 3001)
│       └── src/
│           ├── auth/
│           ├── merchants/
│           ├── search/
│           ├── reviews/
│           ├── favorites/
│           └── admin/
├── docker-compose.yml    # PostgreSQL 5433 · Redis 6379 · Meilisearch 7700
└── pnpm-workspace.yaml
```

---

## Variables d'environnement

**`apps/api/.env`**
```env
DATABASE_URL="postgresql://laplasse:laplasse_dev@localhost:5433/laplasse_db?schema=public"
JWT_SECRET="laplasse-dev-secret-change-in-prod-2026"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"
REDIS_URL="redis://localhost:6379"
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="laplasse_meili_dev_key"
PORT=3001
NODE_ENV=development
```

**`apps/web/.env.local`**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_NAME="LaPlasse"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_CITY="Abidjan"
```

---

## Roadmap V0.5 (MVP Cocody)

- [x] Homepage Discovery (Hero + Search + Catégories + Merchant Cards)
- [x] Page Search full-text (Meilisearch + fallback Prisma)
- [x] Page Profil Marchand (`/m/[slug]`)
- [x] Page Catégorie (`/categories/[slug]`)
- [x] Auth JWT (inscription, connexion, refresh, roles)
- [x] Merchant Signup multi-étapes
- [x] Dashboard Marchand
- [x] Édition profil marchand
- [x] Système de Reviews (déposer + modérer)
- [x] Favoris (toggle + page `/favoris`)
- [x] Dashboard Admin (stats, marchands, avis)
- [x] Modération marchands + avis

---

## Documentation

Toute l'architecture est dans `Docs/` :
- **`Docs/Implementation Blueprint.md`** — guide technique de référence
- **Tomes 0–24** — documentation stratégique, produit et technique complète
