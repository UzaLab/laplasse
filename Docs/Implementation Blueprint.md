# LaPlasse — Implementation Blueprint

## Guide d'Exécution Pratique 0→1

**Version :** 2.1 — Juin 2026 (aligné exécution V1.6)
**Statut :** Document de référence fondateur — **complété par `REGLES_DEVELOPPEMENT.md` pour l'état réel du code**
**Confidentialité :** Interne — LaPlasse
**Date :** Juin 2026

---

## État d'exécution (juin 2026)

> Ce bloc résume où en est le produit **au-delà du scope V0.5** décrit dans les sections historiques ci-dessous.
> Source opérationnelle : **`Docs/REGLES_DEVELOPPEMENT.md` v2.0**.

| Version (exécution) | Statut | Livrables clés |
|--------------------|--------|----------------|
| V0.5 | ✅ | Discovery Cocody |
| V0.8 | ✅ | Loyalty, referral, promotions, sponsored search |
| V0.9 | ✅ | Multi-établissements |
| V1.0 | ✅ | Organisations, booking, ads, audit, simulateur abo |
| V1.5 | ✅ | Marketplace ecommerce (simulateur paiement) |
| **V1.6** | ✅ | Shop modulaire, spotlight, galerie produit, checkout 4 URLs |
| V2.0 | Futur | Mobile Money réel, app native, livraison logistique |

**Note numérotation :** dans ce Blueprint (Tomes 11/22), V1.5 = expansion géographique. Dans REGLES, V1.5 = marketplace. Les deux coexistent : vision vs delivery.

---

# Mantra d'exécution

> **Simple. Modulaire. Scalable. Local d'abord.**
>
> Launch fast, learn fast, improve relentlessly.

---

# 1. Contexte & Vision Produit

## Qu'est-ce que LaPlasse ?

LaPlasse est une **Business Discovery & Commerce Platform** pour les commerces locaux africains. Elle résout un problème structurel majeur : la **fragmentation de la présence digitale** des PME africaines entre Google Maps, Instagram, WhatsApp, cash et Mobile Money.

**Mission :** Donner à chaque commerce africain une présence digitale intelligente, performante et monétisable — tout en simplifiant la découverte et les transactions pour les consommateurs.

**Ambition :** Devenir la super-plateforme business locale africaine : être trouvé, être choisi, vendre, fidéliser et croître depuis un seul écosystème.

## Déploiement géographique

| Phase | Périmètre |
|-------|-----------|
| **Phase 1** (lancement) | Côte d'Ivoire — Abidjan (Cocody en tête) |
| **Phase 2** (expansion) | Sénégal, Ghana, Bénin, Togo, Guinée |
| **Phase 3** (régional) | Afrique francophone et anglophone |

## Marchés d'entrée prioritaires (Wedge)

1. **Food & Beverage** — Restaurants, Maquis, Fast-Foods (fréquence et viralité élevées)
2. **Beauty & Wellness** — Salons, Spas (réservation récurrente)
3. **Boutiques & Retail** — Prêt-à-porter, Électronique (ecommerce naturel)

## Acteurs de la plateforme

La plateforme est **multi-sided** : Consommateurs, Commerçants (informel → chaîne), Staff, Livreurs (futur), Admins internes, Partenaires/API.

---

# 2. Principes Produit Fondateurs (Tomes 3, 7, 23, 24)

Ces principes sont **non négociables**. Toute décision produit ou technique doit les respecter.

| Principe | Règle |
|----------|-------|
| **Modular first** | Chaque commerce n'active que ses modules (menu, booking, catalogue…) |
| **Discovery first** | Être trouvé avant de transiger — la recherche est le cœur du produit |
| **Trust first** | La confiance est une infrastructure, pas une feature. Dès V0.5. |
| **Mobile first** | Smartphone prioritaire. Desktop secondaire. Jamais l'inverse. |
| **WhatsApp-native** | Intégrer WhatsApp comme canal naturel, ne pas forcer l'abandon des habitudes |
| **Low-bandwidth friendly** | Images compressées, lazy loading, skeleton — pour les réseaux africains |
| **Build user outcomes** | Pas de feature-collecting. Maximiser utilité, confiance, simplicité, vitesse |

---

# 3. Stack Technique Définitive (Tome 23)

## Philosophie technique

> **Build simple, modular, scalable foundations.**
> Équilibrer : `speed + simplicity + maintainability + scalability`

La stack est choisie sur le critère **boring reliable scalable developer-friendly**, pas *trendy*.

## Stack complète

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Next.js)  │  BACKEND (NestJS)         │
│                      │                           │
│  Next.js 14+ (App Router)                        │
│  TypeScript          │  NestJS + TypeScript       │
│  TailwindCSS         │  Prisma ORM               │
│  shadcn/ui           │  PostgreSQL               │
│  Zustand (global)    │  Redis (cache + queues)   │
│  TanStack Query      │  Meilisearch (search)     │
│  (server state)      │  BullMQ (jobs async)      │
└─────────────────────────────────────────────────┘
```

### Frontend

| Technologie | Rôle |
|-------------|------|
| **Next.js 14+** | Framework (App Router, SSR, SEO) |
| **TypeScript** | Typage strict obligatoire |
| **TailwindCSS** | Styling utility-first |
| **shadcn/ui** | Composants UI accessibles |
| **Zustand** | État global client minimal (panier, auth, thème) |
| **TanStack Query** | État serveur (fetch, mutation, cache) |

### Backend

| Technologie | Rôle |
|-------------|------|
| **NestJS** | Framework API modulaire, Clean Architecture, TypeScript |
| **Prisma** | ORM — abstraction base de données |
| **PostgreSQL** | Base de données relationnelle principale |
| **Redis** | Cache + queues (BullMQ) |
| **Meilisearch** | Moteur de recherche (typo-tolerant, géo, rapide) |
| **BullMQ** | Jobs asynchrones (emails, modération, analytics) |
| **JWT** | Auth (access + refresh tokens) |

### Infrastructure locale (développement)

| Service | Outil |
|---------|-------|
| PostgreSQL | Docker Compose |
| Redis | Docker Compose |
| Meilisearch | Docker Compose |
| Backend API | `npm run start:dev` (NestJS) |
| Frontend | `npm run dev` (Next.js) |

### Infrastructure production (cloud — post-MVP local)

| Composant | Service recommandé |
|-----------|-------------------|
| Frontend | **Vercel** (Next.js natif, CDN, SSR) |
| Backend | **Railway** ou **Render** ou **Fly.io** |
| Database | **Managed PostgreSQL** (Railway / Supabase / Render) |
| Cache | **Redis Cloud** ou **Upstash** |
| Meilisearch | **Meilisearch Cloud** ou self-hosted |
| Storage médias | **Cloudflare R2** ou **Supabase Storage** |
| CDN | **Cloudflare** |
| CI/CD | **GitHub Actions** |
| Erreurs | **Sentry** |
| Analytics produit | **PostHog** |
| Uptime | **UptimeRobot** |

> **Note :** L'infrastructure VPS + Coolify mentionnée dans les premières versions est remplacée par ces services managés plus simples pour l'équipe fondateur. L'initialisation se fait en **local d'abord**.

### Stratégie mobile

- **Phase 1 :** Responsive web (Next.js PWA-ready)
- **Phase 2 :** React Native / Expo (si demande terrain confirmée)

---

# 4. Architecture Backend — Monolithe Modulaire (Tomes 6, 23)

## Principe

```
Modular Monolith → Microservices Ready
```

Commencer par un monolithe modulaire. **Jamais de microservices trop tôt.**

## Modules NestJS V0.5

```
src/
├── auth/           # JWT, refresh tokens, RBAC middleware
├── users/          # User model, profile, roles
├── merchants/      # Merchant model, CRUD, slug, verification
├── categories/     # Hiérarchie catégories (parent_id)
├── locations/      # MerchantLocation, géo (lat/lng)
├── media/          # Upload images, validation
├── reviews/        # Avis, notation, modération
├── search/         # Meilisearch integration, pipeline
├── trust/          # Trust score, vérification, plaintes
├── analytics/      # AnalyticsEvent, interactions tracker
├── notifications/  # Email (future: SMS, push, WhatsApp)
├── admin/          # Dashboard admin, modération
└── health/         # Health check, monitoring
```

## Architecture interne de chaque module

```
[module]/
├── [module].controller.ts   # HTTP endpoints, DTO validation
├── [module].service.ts      # Logique métier pure
├── [module].repository.ts   # Accès data via Prisma
├── [module].module.ts       # Déclaration NestJS
├── dto/                     # Data Transfer Objects (class-validator)
└── entities/                # Types TypeScript
```

## Principes Clean Architecture

- **Controllers** : Validation DTO (`class-validator`), sérialisation, HTTP uniquement
- **Services** : Logique métier pure, orchestration, pas d'accès DB direct
- **Repositories** : Abstraction Prisma uniquement
- **Erreurs** : Pas de 500 génériques — exceptions NestJS typées

## RBAC — Rôles

```
user          → lecture publique, favoris, avis
merchant      → gestion de son commerce
moderator     → modération contenu + signalements
admin         → accès complet hors super
super_admin   → accès total, configuration platform
```

Principe : **least privilege access** — chaque rôle n'accède qu'au minimum nécessaire.

---

# 5. Architecture Frontend (Tomes 7, 23)

## Structure des dossiers

```
src/
├── app/                        # Next.js App Router
│   ├── (public)/               # Pages publiques (homepage, search, merchant)
│   │   ├── page.tsx            # / Homepage
│   │   ├── search/page.tsx     # /search
│   │   ├── categories/
│   │   │   ├── page.tsx        # /categories
│   │   │   └── [slug]/page.tsx # /categories/restaurants
│   │   └── m/[slug]/page.tsx   # /m/le-bushman-cafe
│   ├── (auth)/                 # Auth (login, register)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (merchant)/             # Dashboard marchand
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── settings/page.tsx
│   ├── (admin)/                # Back-office admin/modération
│   ├── api/                    # Next.js API routes (proxies légers uniquement)
│   └── layout.tsx
├── components/                 # Composants globaux réutilisables
│   ├── ui/                     # Primitives shadcn/ui
│   └── layout/                 # Header, Footer, Nav
├── features/                   # Domaines fonctionnels
│   ├── discovery/
│   │   ├── components/         # SearchBar, MerchantCard, CategoryChip…
│   │   ├── hooks/              # useSearch, useNearby, useCategories
│   │   ├── services/           # Appels API discovery
│   │   └── types/
│   ├── merchant/
│   ├── trust/
│   ├── review/
│   └── auth/
├── hooks/                      # Hooks globaux
├── lib/                        # Utilitaires (api client, formatters…)
├── stores/                     # Zustand stores (auth, cart future, ui)
├── types/                      # Types TypeScript globaux
└── styles/                     # Globals CSS
```

## Règles UI/UX impératives (Tomes 7, 8, 13)

- **Mobile-first obligatoire** : max-width 480px mobile, sidebar desktop ≥ 768px
- **Thumb-first UX** : CTAs toujours accessibles au pouce (bas d'écran)
- **Max 3 clics** pour trouver un commerce depuis la homepage
- **Skeleton loading** systématique (jamais d'écran vide)
- **Optimistic UI** pour les actions courantes (favori, avis)
- **Images WebP** compressées, lazy loading obligatoire
- **Trust visible partout** : badge vérifié, étoiles, statut ouvert/fermé

---

# 6. Schéma de Base de Données — Prisma (Tomes 5, 23)

## Philosophie

> **Database is the operating system of the marketplace.**
> Toujours penser : `clean`, `structured`, `relational`, `extensible`

## Schéma Prisma complet V0.5

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── IDENTITY & AUTH ───────────────────────────────────────────────────────────

enum Role {
  USER
  MERCHANT
  MODERATOR
  ADMIN
  SUPER_ADMIN
}

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  phone       String?  @unique
  full_name   String?
  avatar      String?
  role        Role     @default(USER)
  city        String?
  country     String?  @default("CI")
  is_verified Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  reviews          Review[]
  favorites        Favorite[]
  searches         SearchHistory[]
  interactions     MerchantInteraction[]
  merchant         Merchant?
  notifications    Notification[]
  analytics_events AnalyticsEvent[]

  @@index([email])
  @@index([phone])
}

model AuthToken {
  id         String   @id @default(cuid())
  user_id    String
  token      String   @unique
  type       String   // "refresh" | "otp" | "email_verify"
  expires_at DateTime
  created_at DateTime @default(now())

  @@index([user_id])
  @@index([token])
}

// ─── MERCHANT CORE ─────────────────────────────────────────────────────────────

enum VerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum SubscriptionPlan {
  FREE
  STARTER
  GROWTH
  PREMIUM
}

model Merchant {
  id                  String             @id @default(cuid())
  business_name       String
  slug                String             @unique
  description         String?
  category_id         String
  owner_id            String             @unique
  logo                String?
  cover_image         String?
  phone               String?
  whatsapp            String?
  email               String?
  website             String?
  verification_status VerificationStatus @default(UNVERIFIED)
  trust_score         Int                @default(0)
  subscription_plan   SubscriptionPlan   @default(FREE)
  is_active           Boolean            @default(true)
  created_at          DateTime           @default(now())
  updated_at          DateTime           @updatedAt

  owner        User                  @relation(fields: [owner_id], references: [id], onDelete: Cascade)
  category     Category              @relation(fields: [category_id], references: [id])
  location     MerchantLocation?
  media        MerchantMedia[]
  reviews      Review[]
  favorites    Favorite[]
  interactions MerchantInteraction[]
  verifications MerchantVerification[]
  complaints   Complaint[]
  subscription Subscription?
  hours        BusinessHour[]
  tags         MerchantTag[]

  @@index([slug])
  @@index([category_id])
  @@index([verification_status])
  @@index([trust_score])
}

model MerchantLocation {
  id              String  @id @default(cuid())
  merchant_id     String  @unique
  country         String  @default("CI")
  city            String
  district        String?
  address         String?
  latitude        Float?
  longitude       Float?
  google_place_id String?

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([city])
  @@index([district])
  @@index([latitude, longitude])
}

model BusinessHour {
  id          String  @id @default(cuid())
  merchant_id String
  day         Int     // 0=Lundi … 6=Dimanche
  open_time   String? // "08:00"
  close_time  String? // "22:00"
  is_closed   Boolean @default(false)

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
}

// ─── CATEGORIES ────────────────────────────────────────────────────────────────

model Category {
  id         String     @id @default(cuid())
  name       String
  slug       String     @unique
  parent_id  String?
  icon       String?
  sort_order Int        @default(0)
  is_active  Boolean    @default(true)
  created_at DateTime   @default(now())

  parent    Category?  @relation("CategoryHierarchy", fields: [parent_id], references: [id])
  children  Category[] @relation("CategoryHierarchy")
  merchants Merchant[]

  @@index([slug])
  @@index([parent_id])
}

// ─── MEDIA ─────────────────────────────────────────────────────────────────────

enum MediaType {
  IMAGE
  VIDEO
  MENU
}

model MerchantMedia {
  id          String    @id @default(cuid())
  merchant_id String
  type        MediaType @default(IMAGE)
  url         String
  thumbnail   String?
  order       Int       @default(0)
  uploaded_by String
  created_at  DateTime  @default(now())

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
}

// ─── TAGS ──────────────────────────────────────────────────────────────────────

model Tag {
  id        String        @id @default(cuid())
  name      String        @unique
  merchants MerchantTag[]
}

model MerchantTag {
  merchant_id String
  tag_id      String

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)
  tag      Tag      @relation(fields: [tag_id], references: [id], onDelete: Cascade)

  @@id([merchant_id, tag_id])
}

// ─── REVIEWS & TRUST ───────────────────────────────────────────────────────────

enum ReviewStatus {
  PENDING
  APPROVED
  REJECTED
  FLAGGED
}

model Review {
  id          String       @id @default(cuid())
  merchant_id String
  user_id     String
  rating      Int          // 1–5
  title       String?
  content     String?
  media       String[]     // URLs images
  status      ReviewStatus @default(PENDING)
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
  @@index([user_id])
  @@index([status])
}

model Favorite {
  id          String   @id @default(cuid())
  user_id     String
  merchant_id String
  created_at  DateTime @default(now())

  user     User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@unique([user_id, merchant_id])
  @@index([user_id])
  @@index([merchant_id])
}

// ─── VERIFICATION & MODERATION ─────────────────────────────────────────────────

enum VerificationType {
  PHONE
  DOCUMENT
  BUSINESS_ID
  SOCIAL
}

model MerchantVerification {
  id                String           @id @default(cuid())
  merchant_id       String
  verification_type VerificationType
  document_url      String?
  status            String           @default("pending") // pending | approved | rejected
  verified_by       String?
  notes             String?
  verified_at       DateTime?
  created_at        DateTime         @default(now())

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
  @@index([status])
}

enum ComplaintStatus {
  OPEN
  UNDER_REVIEW
  RESOLVED
  DISMISSED
}

model Complaint {
  id          String          @id @default(cuid())
  merchant_id String
  user_id     String
  reason      String
  description String?
  status      ComplaintStatus @default(OPEN)
  assigned_to String?
  created_at  DateTime        @default(now())
  resolved_at DateTime?

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
  @@index([status])
}

// ─── SUBSCRIPTION ──────────────────────────────────────────────────────────────

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  EXPIRED
  TRIAL
}

model Subscription {
  id            String             @id @default(cuid())
  merchant_id   String             @unique
  plan          SubscriptionPlan   @default(FREE)
  status        SubscriptionStatus @default(ACTIVE)
  billing_cycle String?            // "monthly" | "yearly"
  started_at    DateTime           @default(now())
  expires_at    DateTime?
  created_at    DateTime           @default(now())

  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
  @@index([status])
}

// ─── ANALYTICS & BEHAVIOR ──────────────────────────────────────────────────────

model SearchHistory {
  id            String   @id @default(cuid())
  user_id       String?
  query         String
  filters       Json?
  city          String?
  latitude      Float?
  longitude     Float?
  results_count Int      @default(0)
  created_at    DateTime @default(now())

  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([query])
  @@index([city])
}

enum InteractionType {
  VIEW
  CALL_CLICK
  WHATSAPP_CLICK
  DIRECTION_CLICK
  WEBSITE_CLICK
  SAVE
  REVIEW
  SHARE
}

model MerchantInteraction {
  id          String          @id @default(cuid())
  user_id     String?
  merchant_id String
  event_type  InteractionType
  metadata    Json?
  created_at  DateTime        @default(now())

  user     User?    @relation(fields: [user_id], references: [id], onDelete: SetNull)
  merchant Merchant @relation(fields: [merchant_id], references: [id], onDelete: Cascade)

  @@index([merchant_id])
  @@index([user_id])
  @@index([event_type])
}

model AnalyticsEvent {
  id         String   @id @default(cuid())
  user_id    String?
  event_name String   // signup | search | merchant_click | review_created | save | merchant_signup…
  properties Json?
  city       String?
  created_at DateTime @default(now())

  user User? @relation(fields: [user_id], references: [id], onDelete: SetNull)

  @@index([event_name])
  @@index([user_id])
  @@index([created_at])
}

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────────

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

model Notification {
  id      String             @id @default(cuid())
  user_id String
  type    String             // "email" | "sms" | "push" | "whatsapp"
  title   String
  body    String
  status  NotificationStatus @default(PENDING)
  sent_at DateTime?

  user User @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@index([user_id])
  @@index([status])
}
```

---

# 7. Moteurs Fonctionnels — Discovery Engine (Tomes 3, 23)

## Pipeline de recherche

Quand un utilisateur cherche `restaurant cocody` :

```
Input utilisateur
↓
Normalisation (lowercase, trim, accents)
↓
Détection d'intention (catégorie ? localisation ? horaire ?)
↓
Filtrage géo (ville, district, rayon 1–3km)
↓
Meilisearch (retrieval tolérant aux fautes)
↓
Ranking Engine (relevance + trust_score + distance + engagement)
↓
Personnalisation (futur)
↓
Résultats paginés
```

## Formule de ranking V1

```
Search Score =
  Relevance (match query)
  + Trust Score (0–100, basé sur vérification + avis + activité)
  + Distance Score (nearby advantage)
  + Engagement Score (interactions, favoris)
```

**Règle absolue :** `relevance first, payment second` — les sponsored slots (max 1–2) sont toujours pertinents, jamais du pay-to-win.

## Gestion des recherches nulles

Tracker systématiquement les zero-result searches pour combler les lacunes de contenu (signal de données manquantes dans Cocody).

---

# 8. Trust Architecture (Tomes 17, 23)

> **Trust is infrastructure, not a feature.**

## Trust Score (0–100) — inputs

| Signal | Poids |
|--------|-------|
| Vérification téléphone | ✅ Base |
| Avis (qualité + quantité) | Fort |
| Taux de plaintes | Négatif |
| Complétude du profil | Moyen |
| Qualité médias | Moyen |
| Activité du compte | Faible |

## Vérification marchand — flux V0.5

```
Merchant signup
↓
Vérification téléphone (OTP) — minimum obligatoire
↓
Badge "Non vérifié" → "Vérifié"
(futur : document business, ID gouvernemental)
```

## Modération — 4 couches

1. **Layer 1** : Détection automatique (patterns spam, doublons)
2. **Layer 2** : Système de signalement (flag)
3. **Layer 3** : Modération humaine
4. **Layer 4** : Escalade

## Sanctions marchands — progressives

```
Warning → Limitation → Réduction visibilité → Suspension → Suppression
```
Toujours basé sur des preuves.

---

# 9. Scope MVP — V0.5 (Tomes 11, 22, 24)

## Philosophie MVP

> **MVP = Minimum Lovable Product** — pas minimum de features.
> Une ville. Un quartier. Une densité. Avant tout.

## Inclus dans V0.5

### Côté Consommateur
- [ ] Homepage avec recherche (barre + catégories)
- [ ] Page résultats de recherche (Meilisearch)
- [ ] Filtres basiques (catégorie, ville/district)
- [ ] Page profil marchand complète (infos, photos, avis, horaires, WhatsApp)
- [ ] Sections nearby (< 2km) et populaire (par ville)
- [ ] Favoris (save)
- [ ] Création de compte + connexion (email + OTP)
- [ ] Déposer un avis (avec modération)

### Côté Marchand
- [ ] Inscription marchand (signup flow < 5 min)
- [ ] Création / édition profil (nom, catégorie, description, localisation)
- [ ] Upload photos (logo, cover, galerie)
- [ ] Gestion horaires
- [ ] Dashboard basique (vues, clics WhatsApp, avis)
- [ ] Vérification téléphone (OTP)

### Trust & Modération
- [ ] Système d'avis avec modération (PENDING → APPROVED)
- [ ] Signalement de contenu
- [ ] Badge vérifié marchand
- [ ] Interface modération admin basique

### Analytics internes
- [ ] Tracking des événements clés (SearchHistory, MerchantInteraction, AnalyticsEvent)
- [ ] Dashboard admin basique (nombre marchands, recherches, avis)

## Exclus de V0.5 (STRICTEMENT)

- ❌ Paiements (Mobile Money, carte)
- ❌ Booking / réservation
- ❌ Livraison
- ❌ CRM avancé
- ❌ IA / recommandations personnalisées
- ❌ Multi-ville
- ❌ Application mobile native
- ❌ Publicités self-service

## Routes applicatives V0.5

```
PUBLIC
  /                        → Homepage
  /search                  → Résultats de recherche
  /categories              → Toutes les catégories
  /categories/[slug]       → Catégorie filtrée
  /m/[slug]                → Profil marchand

AUTH
  /login                   → Connexion
  /register                → Inscription utilisateur

MERCHANT
  /merchant/signup         → Inscription marchand
  /merchant/dashboard      → Dashboard marchand
  /merchant/profile/edit   → Édition profil
  /merchant/media          → Gestion photos
  /merchant/hours          → Gestion horaires

ADMIN
  /admin                   → Dashboard admin
  /admin/merchants         → Liste marchands + modération
  /admin/reviews           → File de modération avis
  /admin/complaints        → Signalements

API (NestJS — port 3001 en local)
  /api/auth/*
  /api/users/*
  /api/merchants/*
  /api/categories/*
  /api/search/*
  /api/reviews/*
  /api/favorites/*
  /api/interactions/*
  /api/admin/*
```

---

# 10. Initialisation du Projet en Local

## Prérequis

- **Node.js** ≥ 20 LTS
- **Docker Desktop** (pour PostgreSQL, Redis, Meilisearch)
- **Git**
- **pnpm** (recommandé) ou npm

## Structure du monorepo

```
laplasse/
├── apps/
│   ├── web/                  # Next.js frontend
│   └── api/                  # NestJS backend
├── packages/
│   └── types/                # Types TypeScript partagés (futur)
├── docker-compose.yml        # Services locaux
├── .env.example
└── README.md
```

## Étape 1 — Services locaux (Docker)

Créer `docker-compose.yml` à la racine :

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    container_name: laplasse_postgres
    environment:
      POSTGRES_USER: laplasse
      POSTGRES_PASSWORD: laplasse_dev
      POSTGRES_DB: laplasse_db
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: laplasse_redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  meilisearch:
    image: getmeili/meilisearch:v1.7
    container_name: laplasse_meilisearch
    environment:
      MEILI_MASTER_KEY: laplasse_meili_dev_key
      MEILI_ENV: development
    ports:
      - '7700:7700'
    volumes:
      - meilisearch_data:/meili_data

volumes:
  postgres_data:
  redis_data:
  meilisearch_data:
```

```bash
# Démarrer tous les services
docker compose up -d

# Vérifier que tout tourne
docker compose ps
```

## Étape 2 — Backend NestJS (apps/api)

```bash
# Créer le projet NestJS
npx @nestjs/cli new api --package-manager pnpm
cd apps/api

# Installer les dépendances
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add @prisma/client meilisearch ioredis bullmq
pnpm add class-validator class-transformer
pnpm add bcryptjs
pnpm add -D prisma @types/passport-jwt @types/bcryptjs

# Initialiser Prisma
npx prisma init
# → Copier le schéma complet de la section 6 dans prisma/schema.prisma

# Créer la migration initiale
npx prisma migrate dev --name init

# Générer le client Prisma
npx prisma generate

# Démarrer en dev
pnpm run start:dev
# → API disponible sur http://localhost:3001
```

### Variables d'environnement — `apps/api/.env`

```env
# Database
DATABASE_URL="postgresql://laplasse:laplasse_dev@localhost:5432/laplasse_db"

# Auth
JWT_SECRET="your-super-secret-jwt-key-change-in-prod"
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="30d"

# Redis
REDIS_URL="redis://localhost:6379"

# Meilisearch
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="laplasse_meili_dev_key"

# App
PORT=3001
NODE_ENV=development
APP_NAME=LaPlasse
APP_URL=http://localhost:3000

# Email (dev — MailHog ou Mailtrap)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="noreply@laplasse.local"
```

## Étape 3 — Frontend Next.js (apps/web)

```bash
# Créer le projet Next.js
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"
cd apps/web

# Installer les dépendances
pnpm add @tanstack/react-query zustand
pnpm add lucide-react
pnpm add axios  # ou fetch natif

# Initialiser shadcn/ui
npx shadcn-ui@latest init
# → Style: Default, Color: Neutral, CSS variables: yes

# Installer les composants shadcn nécessaires
npx shadcn-ui@latest add button input card badge dialog select
npx shadcn-ui@latest add sheet skeleton avatar separator

# Démarrer en dev
pnpm run dev
# → App disponible sur http://localhost:3000
```

### Variables d'environnement — `apps/web/.env.local`

```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_NAME="LaPlasse"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_CITY="Abidjan"
NEXT_PUBLIC_DEFAULT_DISTRICT="Cocody"

# Analytics (dev — optionnel)
NEXT_PUBLIC_POSTHOG_KEY=""
```

## Étape 4 — Seeding initial (Cocody, Abidjan)

```bash
# Dans apps/api/
# Créer prisma/seed.ts

npx prisma db seed
```

Contenu du seed (catégories + 50 marchands Cocody) :

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Catégories hiérarchiques
  const food = await prisma.category.upsert({
    where: { slug: 'restaurants' },
    update: {},
    create: { name: 'Restaurants', slug: 'restaurants', icon: 'utensils', sort_order: 1 },
  })
  await prisma.category.upsert({
    where: { slug: 'fast-food' },
    update: {},
    create: { name: 'Fast Food', slug: 'fast-food', parent_id: food.id, icon: 'burger', sort_order: 1 },
  })
  await prisma.category.upsert({
    where: { slug: 'maquis' },
    update: {},
    create: { name: 'Maquis', slug: 'maquis', parent_id: food.id, icon: 'flame', sort_order: 2 },
  })

  const beauty = await prisma.category.upsert({
    where: { slug: 'beaute' },
    update: {},
    create: { name: 'Beauté', slug: 'beaute', icon: 'scissors', sort_order: 2 },
  })
  await prisma.category.upsert({
    where: { slug: 'salons-coiffure' },
    update: {},
    create: { name: 'Salons de coiffure', slug: 'salons-coiffure', parent_id: beauty.id, sort_order: 1 },
  })

  await prisma.category.upsert({
    where: { slug: 'boutiques' },
    update: {},
    create: { name: 'Boutiques', slug: 'boutiques', icon: 'shopping-bag', sort_order: 3 },
  })
  await prisma.category.upsert({
    where: { slug: 'hotels' },
    update: {},
    create: { name: 'Hôtels', slug: 'hotels', icon: 'bed-double', sort_order: 4 },
  })
  await prisma.category.upsert({
    where: { slug: 'pharmacies' },
    update: {},
    create: { name: 'Pharmacies', slug: 'pharmacies', icon: 'pill', sort_order: 5 },
  })

  console.log('✅ Catégories créées')

  // Merchants de test — Cocody, Abidjan
  // (ajouter ici 50 marchands test avec location lat/lng)

  console.log('✅ Seeding terminé')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

---

# 11. Méthode d'Exécution — Feature by Feature (Tome 12)

## Philosophie

> **Un prompt = une seule responsabilité.**
> Jamais `build everything at once`.

## Vertical Slice Development

Chaque feature suit ce pipeline :

```
DB Schema
↓
Prisma Migration
↓
NestJS Service + Repository
↓
NestJS Controller + DTO validation
↓
Meilisearch sync (si search)
↓
Next.js API call + hook
↓
Composant UI
↓
QA (local)
```

## Template de prompt Cursor (Tome 12)

```
**Contexte :** [Où on en est dans la feature]
**Objectif :** [Une seule responsabilité]
**Fichiers concernés :** [liste précise]
**Requis :** [ce que le code doit faire]
**Contraintes :** [stack, patterns, sécurité]
**Checklist de validation :** [critères de done]
```

## Standards d'ingénierie

- **TypeScript strict** — `strict: true` dans `tsconfig.json`
- **Code modulaire** — pas de fichiers > 300 lignes
- **Erreurs typées** — exceptions NestJS, jamais de 500 génériques
- **Conventions de commits** : `feat:`, `fix:`, `refactor:`, `chore:`
- **Pas de commentaires qui narrent** — code self-documenting, commentaires uniquement pour les décisions non-évidentes

---

# 12. Roadmap Produit (Tomes 11, 22)

## Timeline stratégique (vision Tomes)

```
V0.5 — Functional MVP (juin → septembre 2026)
  Focus : Cocody, Food & Beauty
  Goal : Market validation, 50+ marchands actifs

V0.8 — MVP+ (septembre → décembre 2026)
  + Rétention, modération mature, trust score
  + Monétisation de base (subscription freemium)

V1.0 — Production Ready (janvier → avril 2027)
  + Scale citywide Abidjan
  + Publicités sponsorisées
  + CRM basique, analytics avancés

V1.5 — Growth Scale (avril → août 2027)   ← stratégie Tomes
  + Expansion régionale (2e ville)
  + Nouveaux verticaux (hôtels, pharmacies)
  + Booking engine

V2.0 — Ecosystem Platform (août → décembre 2027)
  + Merchant OS complet
  + IA & recommandations
  + Analytics prédictifs
  + Mobile app
```

## Timeline exécution (juin 2026 — REGLES)

Accélération par rapport au calendrier stratégique :

```
V0.5  ✅ Discovery
V0.8  ✅ Rétention & monétisation lite
V0.9  ✅ Multi-établissements
V1.0  ✅ Booking + orgs + ads + audit
V1.5  ✅ Marketplace ecommerce (simulateur)
V1.6  ✅ Shop modulaire + checkout structuré + spotlight
V2.0  → Mobile Money réel, app native, livraison ops
```

Parcours checkout V1.6 : `/cart` → `/checkout` → `/checkout/payment` → `/checkout/confirmation?status=…`

## KPIs fondateurs V0.5 (Tome 22)

| KPI | Cible |
|-----|-------|
| Marchands actifs | 50+ (Cocody) |
| Search success rate | > 70% |
| Density par quartier | Masse critique Cocody |
| Merchant satisfaction | Feedback positif > 80% |
| Page load | < 2 secondes |
| Search latency | < 500ms |
| API latency | < 300ms |

---

# 13. Monitoring & Observabilité (Tome 23)

## Stack recommandée

| Outil | Rôle |
|-------|------|
| **Sentry** | Erreurs runtime (frontend + backend) |
| **PostHog** | Analytics produit (events, funnels) |
| **UptimeRobot** | Monitoring uptime |
| **Better Stack** (futur) | Logging centralisé |

## Ce qu'on loggue toujours

- Auth failures
- Actions de modération
- Erreurs API
- Comportements suspicieux
- Slow queries (> 500ms)

---

# 14. Git Workflow

```bash
# Initialisation
git init
git remote add origin <repo-url>

# Branches
main          → production stable
develop       → intégration continue
feature/*     → nouvelles features
fix/*         → corrections
```

## Conventions de commits

```
feat: ajoute la page de recherche
fix: corrige le ranking géo dans Meilisearch
refactor: extrait le TrustScore en service dédié
chore: met à jour les dépendances Prisma
```

---

# 15. Checklist de Lancement

## V0.5 — Discovery (✅ livré juin 2026)

### Technique
- [x] Monorepo initialisé (apps/web + apps/api)
- [x] Docker Compose : PostgreSQL + Redis + Meilisearch
- [x] Schéma Prisma migré et seedé
- [x] NestJS : auth JWT + RBAC fonctionnel
- [x] Meilisearch : index merchants indexé
- [x] Next.js : homepage + search + merchant page
- [x] Merchant signup flow complet (< 5 min)
- [x] Upload photos fonctionnel
- [x] Modération avis (PENDING → APPROVED)
- [x] Dashboard admin basique

### Produit
- [x] Recherche fonctionne (tolérance fautes, géo)
- [x] Catégories navigables
- [x] Profils marchands complets
- [x] Avis fonctionnels
- [x] Favoris fonctionnels
- [x] Merchant dashboard (vues, clics)

### Trust
- [x] OTP vérification marchands
- [x] Modération basique
- [ ] CGU + politique de confidentialité (pages `/terms`, `/privacy` — contenu à valider juridiquement)

### Business (KPIs terrain — en cours)
- [ ] 50+ marchands actifs Cocody
- [ ] Densité suffisante (restaus + salons)
- [ ] Feedback marchands collecté
- [ ] Search success rate mesuré (> 70 %)

## V1.0 — Ops & monétisation (✅ livré)

- [x] Booking engine (TABLE / APPOINTMENT / ROOM)
- [x] Organisations + feature gating plans
- [x] Simulateur abonnements SaaS
- [x] Ads self-service, staff, audit log, fraude basique
- [x] Déploiement Coolify (preprod + prod)

## V1.5 — Marketplace (✅ livré)

- [x] Produits, variantes, panier multi-boutiques
- [x] Checkout simulé + commandes split par boutique
- [x] Pages `/marketplace`, `/cart`, fiche produit, boutique
- [ ] Mobile Money réel → V2+

## V1.6 — Boutique modulaire (✅ livré)

- [x] Entité `Shop`, module API, dashboard `/merchant/shop/*`
- [x] Vitrines `/m/[slug]/boutique` et `/boutique/[slug]`
- [x] Images produit multiples (`ProductImage`, max 10)
- [x] Composition produit, `allow_pickup` / `allow_delivery`
- [x] Checkout 4 étapes (URLs distinctes pour tracking PostHog)
- [x] Marketplace spotlight (`GET /marketplace/spotlight`)
- [ ] UI admin spotlight (API admin — interface web à compléter)

## V2.0 — Prochaine frontière

- [ ] Intégration Mobile Money réel (Wave, Orange, MTN)
- [ ] Livraison opérationnelle (livreurs, statuts, tracking)
- [ ] App native
- [ ] Domaine `laplasse.ci` + monitoring UptimeRobot
- [ ] Push FCM production

---

# 16. Anti-patterns à Éviter (Tome 22)

| Anti-pattern | Pourquoi |
|-------------|----------|
| Sur-architecture | Ralentit l'exécution sans valeur |
| Trop de features V0.5 | Dilue le focus densité |
| Expansion multi-ville prématurée | Tue la densité Cocody |
| Ignorer le feedback marchand | Perte des signaux terrain |
| Microservices trop tôt | Complexité inutile |
| `premature Kubernetes` | Overhead sans bénéfice |
| Sécurité "later" | Impossible à rattraper proprement |
| Trust "later" | Marketplace toxique garantie |
| Hardcoded secrets | Faille de sécurité critique |
| Test en production | Risque expérience utilisateur |

---

# 17. Prochaines Étapes

## Immédiat (post-V1.6)

- UI admin marketplace spotlight (toggle boutiques épinglées)
- Domaine `laplasse.ci` + UptimeRobot sur `/api/health`
- Onboarding 50 marchands réels Cocody (validation terrain)
- Aligner maquettes `Docs/maquettes/` (rebrand CIBOOKS → LaPlasse)

## V2.0 — Transactions réelles

- Intégration Mobile Money (Wave / Orange / MTN)
- Livraison opérationnelle (partenaires, tracking commande)
- App native (React Native ou PWA avancée)

## Expansion (Tomes — si densité Cocody atteinte)

- Playbook réplication Cocody → Yopougon / Plateau
- Nouvelle ville si KPIs densité validés

## Mois 6–12 : Features avancées
- Booking engine (salons, restaurants)
- IA recommendations V1
- Paiement Mobile Money
- React Native app

---

# Ressources & Documentation interne

| Référence | Contenu |
|-----------|---------|
| **Tomes 0–1** | Vision, stratégie, positionnement |
| **Tome 2** | Personas et comportements |
| **Tome 3** | Architecture fonctionnelle, moteurs |
| **Tomes 4–5** | Verticaux métier, DDD |
| **Tomes 6–7** | Backend NestJS, Frontend Next.js |
| **Tome 8** | Écrans UX complets |
| **Tome 9** | Monétisation |
| **Tome 10** | GTM, marketing, croissance |
| **Tomes 11–12** | Roadmap MVP, méthode d'exécution |
| **Tome 13** | Design system UX/UI |
| **Tome 14** | Growth, liquidité marketplace |
| **Tome 15** | IA, recommandations |
| **Tome 16** | Data, analytics |
| **Tome 17** | Légal, modération, gouvernance |
| **Tomes 18–19** | Opérations, finance |
| **Tomes 20–21** | Brand, vision long terme |
| **Tome 22** | Playbook fondateur 0→1 (24 mois) |
| **Tome 23** | Architecture technique système (RÉFÉRENCE STACK) |
| **Tome 24** | Product requirements & functional blueprint |

---

**Mantra LaPlasse :**

> Simple. Modulaire. Scalable. Trustworthy.
>
> Une ville. Une densité. Un produit lovable. Ensuite : tout le reste.
