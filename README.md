# LaPlasse

> Découvre les meilleurs lieux autour de toi.

**LaPlasse** est une Business Discovery & Commerce Platform pour les commerces locaux africains.

---

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 16 + TypeScript + Tailwind CSS v4 |
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

### Discovery & profil

| URL | Description |
|-----|-------------|
| `/` | Homepage : hero, catégories, établissements |
| `/search` | Recherche full-text (Meilisearch) |
| `/categories`, `/categories/[slug]` | Catégories et listes par catégorie |
| `/m/[slug]` | Fiche établissement (avis, horaires, WhatsApp) |
| `/favoris` | Établissements sauvegardés |
| `/activite` | Activité récente |

### Marketplace & ecommerce

| URL | Description |
|-----|-------------|
| `/marketplace` | Catalogue global + spotlight boutiques |
| `/m/[slug]/boutique` | Vitrine boutique d'un établissement |
| `/boutique/[slug]` | Vitrine boutique (entité Shop) |
| `/m/[slug]/p/[productSlug]` | Fiche produit (galerie, variantes, panier) |
| `/cart` | Panier multi-boutiques |
| `/checkout` | Étape livraison / retrait |
| `/checkout/payment` | Étape paiement (simulateur) |
| `/checkout/confirmation` | Confirmation commande (`?status=success\|failure`) |

### Compte client

| URL | Description |
|-----|-------------|
| `/login`, `/register` | Auth |
| `/profile` | Dashboard utilisateur |
| `/profile/orders` | Mes commandes |
| `/profile/bookings` | Mes réservations |
| `/profile/loyalty` | Fidélité (XP, tiers) |
| `/profile/referral` | Parrainage |
| `/profile/notifications` | Notifications in-app |

### Espace marchand

| URL | Description |
|-----|-------------|
| `/merchant/signup` | Créer un établissement |
| `/merchant/dashboard` | Tableau de bord |
| `/merchant/shop/*` | Gestion boutique (produits, commandes, settings) |
| `/merchant/bookings` | Réservations |
| `/merchant/plans` | Plans d'abonnement |
| `/shop/create` | Créer une boutique |

### Admin

| URL | Description |
|-----|-------------|
| `/admin` | Stats globales |
| `/admin/merchants`, `/admin/reviews`, `/admin/complaints` | Modération |
| `/admin/growth`, `/admin/audit`, `/admin/fraud` | Croissance, audit, fraude |

---

## Endpoints API principaux

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| GET | `/api/health` | Public | Health check |
| GET | `/api/categories` | Public | Liste catégories |
| GET | `/api/merchants/featured` | Public | Marchands mis en avant |
| GET | `/api/merchants/:slug` | Public | Profil marchand |
| GET | `/api/search?q=...` | Public | Recherche Meilisearch |
| GET | `/api/marketplace/products` | Public | Catalogue marketplace |
| GET | `/api/marketplace/spotlight` | Public | Boutiques épinglées |
| GET | `/api/shops/:slug/products` | Public | Catalogue boutique |
| POST | `/api/auth/register`, `/api/auth/login` | Public | Auth |
| GET | `/api/auth/me` | JWT | Mon profil |
| GET/POST | `/api/cart`, `/api/cart/items` | JWT | Panier |
| POST | `/api/orders/checkout` | JWT | Créer commande(s) |
| POST | `/api/orders/pay/confirm-batch` | JWT | Simulateur paiement |
| GET/POST/PATCH | `/api/products`, `/api/shops` | JWT | Produits & boutiques marchand |
| GET/PATCH | `/api/bookings/*` | JWT / Public | Réservations |
| GET | `/api/admin/stats` | ADMIN | Stats globales |
| GET/PATCH | `/api/admin/marketplace/spotlight` | ADMIN | Spotlight marketplace |

> Liste complète : voir `Docs/REGLES_DEVELOPPEMENT.md` §13 et §Marketplace V1.5/V1.6.

---

## Structure du projet

```
laplasse/
├── apps/
│   ├── web/              # Next.js 16 (port 3000)
│   │   └── src/
│   │       ├── app/      # Pages (App Router)
│   │       ├── features/ # Composants métier
│   │       ├── stores/   # Zustand (auth, cart)
│   │       └── lib/      # API client, checkout session
│   └── api/              # NestJS (port 3001)
│       └── src/
│           ├── auth/ merchants/ search/ reviews/ favorites/
│           ├── admin/ bookings/ payments/ marketplace/ shops/
│           ├── organizations/ ads/ staff/ loyalty/ referral/
│           └── promotions/ audit/ fraud/ notifications/ queue/
├── Docs/                 # Blueprint, REGLES, Tomes, maquettes
├── scripts/              # backup, coolify-deploy, load-test
└── docker-compose.yml    # PostgreSQL 5433 · Redis 6379 · Meilisearch 7700
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

## État du projet (juin 2026)

| Version | Statut | Contenu principal |
|---------|--------|-------------------|
| **V0.5** | ✅ Livré | Discovery Cocody — search, profils, avis, auth, admin |
| **V0.8** | ✅ Clôturée | Loyalty, notifications, referral, promotions, sponsored |
| **V0.9** | ✅ Livrée | Multi-établissements (1 compte → N marchands) |
| **V1.0** | ✅ Livrée | Organisations, booking, ads, staff, audit, simulateur abo |
| **V1.5** | ✅ Livrée | Marketplace — produits, panier multi-boutiques, checkout simulé |
| **V1.6** | ✅ Livrée | Shop modulaire, spotlight, galerie produit, checkout 4 étapes |
| **V2.0** | Futur | Mobile Money réel, app native, livraison logistique, IA |

Détail feature par feature : **`Docs/REGLES_DEVELOPPEMENT.md`** (source opérationnelle).

### V0.5 — Discovery (MVP Cocody)

- [x] Homepage, search, catégories, profils marchands
- [x] Auth JWT, signup marchand, dashboard, modération admin
- [x] Reviews, favoris, OTP marchand

### V1.5 — Marketplace

- [x] Produits, variantes, panier, commandes split par boutique
- [x] Paiement simulateur (sans Mobile Money réel)

### V1.6 — Boutique modulaire

- [x] Entité `Shop`, dashboard `/merchant/shop/*`
- [x] Vitrines `/m/[slug]/boutique` et `/boutique/[slug]`
- [x] Images produit multiples, composition, retrait/livraison par produit
- [x] Checkout 4 URLs : `/cart` → `/checkout` → `/checkout/payment` → `/checkout/confirmation`
- [x] Marketplace spotlight + refonte mobile

### Reste à faire (V2+ / infra)

- [ ] Mobile Money réel (Wave, Orange, MTN)
- [ ] Livraison opérationnelle (livreurs, tracking)
- [ ] Domaine `laplasse.ci` + UptimeRobot
- [ ] UI admin spotlight (API déjà en place)
- [ ] 50+ marchands actifs Cocody (validation terrain)

---

## Documentation

Toute l'architecture est dans `Docs/` :

| Document | Rôle |
|----------|------|
| **`Docs/REGLES_DEVELOPPEMENT.md`** | **Journal d'exécution** — statut V0.5→V1.6, règles code, comptes seed |
| **`Docs/ROADMAP_PRODUIT_V2.md`** | **Analyse parcours, gaps UX, modules verticaux (Glovo/Airbnb), roadmap V2+** |
| **`Docs/Implementation Blueprint.md`** | Guide technique fondateur + vision stratégique |
| **`Docs/RUNBOOK.md`** | Ops : Docker, backup, déploiement Coolify |
| **Tomes 0–24** | Spec produit/architecture long terme |
| **`Docs/maquettes/*.md`** | Références UI (certaines encore brandées CIBOOKS — voir note REGLES) |
