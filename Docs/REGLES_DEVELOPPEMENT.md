# LaPlasse — Règles de Développement

> Synthèse opérationnelle extraite de `Implementation Blueprint.md`, `cibooks_master_report.md` et Tomes 0–24.
> Document de référence pour toute contribution au code.

**Version :** 1.8 — Juin 2026 (Booking vertical + P1 ops)

---

## 1. Mantra & philosophie

| Mantra | Signification |
|--------|---------------|
| **Simple. Modulaire. Scalable. Local d'abord.** | Pas de sur-architecture |
| **Launch fast, learn fast** | Itérer vite sur Cocody |
| **MVP = Minimum Lovable Product** | Une ville, un quartier, une densité |
| **Un prompt = une seule responsabilité** | Jamais « build everything at once » |

---

## 2. Principes produit non négociables

| Principe | Règle |
|----------|-------|
| **Modular first** | Chaque commerce n'active que ses modules |
| **Discovery first** | Être trouvé avant de transiger |
| **Trust first** | Confiance = infrastructure (V0.5) |
| **Mobile first** | Smartphone prioritaire, desktop secondaire |
| **WhatsApp-native** | Intégrer WhatsApp, ne pas le remplacer |
| **Low-bandwidth friendly** | Images compressées, lazy loading, skeletons |
| **Build user outcomes** | Pas de feature-collecting |

---

## 3. Méthode d'exécution — Vertical Slice

Chaque feature suit **obligatoirement** ce pipeline :

```
DB Schema (Prisma)
    ↓
Migration Prisma
    ↓
NestJS Service (+ Repository si besoin)
    ↓
NestJS Controller + DTO (class-validator)
    ↓
Meilisearch sync (si search)
    ↓
Next.js API call + hook (TanStack Query)
    ↓
Composant UI
    ↓
QA locale
```

### Template de prompt Cursor (Tome 12)

```
Contexte :    [Où on en est]
Objectif :    [Une seule responsabilité]
Fichiers :    [Liste précise]
Requis :      [Comportement attendu]
Contraintes : [Stack, patterns, sécurité]
Checklist :   [Critères de done]
```

---

## 4. Standards d'ingénierie

### TypeScript & code

- `strict: true` dans tous les `tsconfig.json`
- Fichiers **< 300 lignes** (sinon découper)
- Code modulaire, réutilisable, self-documenting
- Commentaires uniquement pour logique métier non évidente

### API NestJS

- **Controllers** : HTTP + validation DTO uniquement
- **Services** : logique métier pure
- **DTOs** : décorateurs `class-validator` obligatoires (`whitelist` + `forbidNonWhitelisted` actifs)
- **Erreurs** : exceptions NestJS typées (`ConflictException`, `BadRequestException`…) — **jamais de 500 générique** pour erreurs métier
- **RBAC** : moindre privilège — `user` / `merchant` / `moderator` / `admin` / `super_admin`
- Routes publiques marquées `@Public()`, routes protégées via `JwtAuthGuard` + `RolesGuard`

### Frontend Next.js

- App Router, Server Components par défaut
- Client Components uniquement pour l'interactivité
- TanStack Query pour l'état serveur, Zustand pour auth/état global minimal
- `max-w-7xl` pour la largeur desktop (aligné homepage)
- Empty states avec guidance (jamais d'écran vide — Tome 24 §43)

### Git & commits

```
feat:   nouvelle fonctionnalité
fix:    correction de bug
refactor: restructuration sans changement fonctionnel
chore:  maintenance (deps, config)
```

Branches : `main` (prod) · `develop` (intégration) · `feature/*` · `fix/*`

---

## 5. Règles de validation données (Tome 24 §42)

| Champ | Règle |
|-------|-------|
| Nom marchand | **Requis** |
| Catégorie | **Requis** |
| Localisation | **Requis** |
| Téléphone | Recommandé (OTP V0.5) |
| Médias | Minimum futur (logo + cover V0.5) |

### Avis

- Note 1–5 obligatoire
- Statut : `PENDING` → modération → `APPROVED` / `REJECTED`
- 1 avis par utilisateur par marchand
- Message utilisateur : *« Votre avis est en cours de validation »*

### Marchands

- Inscription < 5 minutes
- Flux : Signup → OTP téléphone → Admin valide → Badge vérifié
- Slug unique auto-généré

---

## 6. Scope V0.5 — Inclus vs Exclu

### ✅ Inclus (MVP Cocody)

**Consommateur :** Homepage, search Meilisearch, filtres, profil marchand, nearby/populaire, favoris, auth email+OTP, avis modérés

**Marchand :** Signup, édition profil, photos, horaires, dashboard (vues/clics), OTP téléphone

**Trust :** Modération avis, signalements, badge vérifié, admin basique

**Analytics :** SearchHistory, MerchantInteraction, dashboard admin stats

### ❌ Strictement exclus V0.5

- Paiements (Mobile Money, carte)
- Booking / réservation
- Livraison
- CRM avancé
- IA / recommandations
- Multi-ville
- App mobile native
- Publicités self-service

---

## 7. Philosophie QA (Tomes 12, 24 §114–116)

### Toujours tester les 4 chemins

1. **Happy path** — flux nominal
2. **Failure path** — erreurs réseau, validation, auth
3. **Recovery path** — retry, messages clairs
4. **Edge cases** — voir §8

### Checklist avant release (Tome 24 §115)

| Domaine | Tests à effectuer |
|---------|-------------------|
| **Auth** | Register, login email, login OTP, refresh token, logout, rôles RBAC |
| **Search** | Requête vide, typo, filtres catégorie/ville, 0 résultats, fallback Prisma |
| **Merchant onboarding** | Signup 3 étapes, OTP, dashboard, édition profil |
| **Reviews** | Créer avis, modération admin, affichage APPROVED uniquement |
| **Moderation** | Valider/rejeter marchand, publier/masquer avis, traiter signalements |
| **Favoris** | Toggle, liste `/favoris`, état connecté/déconnecté |
| **Notifications** | Messages trust (vérification pending, avis en modération) |
| **Performance** | Page load < 2s, search < 500ms, API P95 < 200ms (cf. §11) |
| **Mobile** | Responsive 375px, touch targets, sticky bars |

### Edge cases obligatoires (Tome 24 §92)

- Aucun résultat de recherche
- Connexion faible (images lazy, skeletons)
- Marchand dupliqué / email-phone déjà pris
- Échec vérification OTP
- Échec upload média
- Rejet modération
- Géolocalisation indisponible
- Spam / comportement suspect

### Niveaux QA

| Niveau | Description |
|--------|-------------|
| L1 | QA manuelle |
| L2 | Checklist de régression |
| L3 | Tests automatisés Jest — **actif** (`pnpm test`) |
| L4 | CI/CD + monitoring |

---

## 8. Anti-patterns à éviter (Blueprint §16)

| Anti-pattern | Risque |
|-------------|--------|
| Sur-architecture | Ralentit sans valeur |
| Trop de features V0.5 | Dilue le focus Cocody |
| Multi-ville prématurée | Tue la densité |
| Microservices trop tôt | Complexité inutile |
| Kubernetes prématuré | Overhead |
| Sécurité « later » | Irrattrapable |
| Trust « later » | Marketplace toxique |
| Secrets en dur | Faille critique |
| Test en production | UX dégradée |
| DTO sans class-validator | Erreurs 400 cryptiques |

---

## 9. KPIs V0.5 (Tome 22)

| KPI | Cible |
|-----|-------|
| Marchands actifs Cocody | 50+ |
| Search success rate | > 70% |
| Merchant satisfaction | > 80% positif |
| Page load | < 2 secondes |
| Search latency | < 500ms |
| API latency P95 | < 200ms (charge nominale) |

---

## 10. Infrastructure locale

```bash
docker compose up -d          # PostgreSQL:5433, Redis:6379, Meili:7700
pnpm dev                      # Web :3000 + API :3001
pnpm test                     # Tests unitaires API (15 tests)
pnpm test:cov                 # Rapport de couverture
pnpm load-test                # Test de charge (autocannon, ~50 req/s)
pnpm backup                   # Backup PostgreSQL manuel → backups/
pnpm --filter api db:seed     # Données de démo
```

Variables critiques : `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `MEILI_HOST`, `NEXT_PUBLIC_API_URL`

### Comptes de démo (seed)

| Rôle | Email | Mot de passe | URL |
|------|-------|--------------|-----|
| **Admin** | `admin@laplasse.ci` | `Admin2026!` | http://localhost:3000/login → `/admin` |
| **Marchand** | `bushman@laplasse.ci` | `Bushman2026!` | `/merchant/dashboard` — Le Bushman Café |
| **User** | `ksouary@gmail.com` | `Ksoary2026!` | `/profile` |
| User test | `user@test.ci` | *(pas de mot de passe seed)* | — |

> Le seed crée/met à jour tous les comptes à chaque exécution (`pnpm --filter api db:seed`).
> La re-indexation Meilisearch après seed : `POST /api/admin/sync-search` (token admin requis).

---

## 11. Standards performance & sécurité (bonnes pratiques marketplace)

> Inspiré des critères de qualité non négociables d'un brief architecture data marketplace (traçabilité, robustesse, charge nominale). Applicable à toute API + frontend consommant des données sensibles.

### 11.1 Performance API

| Règle | Cible |
|-------|-------|
| Latence P95 endpoints CRUD | **< 200 ms** en charge nominale (~50 req/s) |
| Latence P95 recherche | **< 500 ms** (tolérance typo, filtres) |
| Latence P95 pages web (TTFB) | **< 2 s** sur connexion locale standard |
| Index PostgreSQL | Sur **toutes** les colonnes filtrées, jointes ou triées |
| Requêtes N+1 | **Interdites** — `include` Prisma maîtrisé, pas de boucles DB |
| Cache applicatif | Données peu changeantes (catégories, config) → Redis ou mémoire |
| Tests de charge | **Obligatoires avant mise en production** — 0 erreur, P95 dans les cibles |

**Méthode de mesure :** 30 requêtes séquentielles (P50/P95) + 100 requêtes concurrentes (20 parallèles minimum) sur chaque endpoint critique. Documenter date, environnement et résultats.

### 11.2 Sécurité

| Règle | Implémentation attendue |
|-------|----------------------|
| HTTPS | Obligatoire en production (dev HTTP toléré) |
| Mots de passe | Hash **bcrypt** (cost ≥ 12) ou Argon2id — jamais en clair |
| Injections SQL | ORM exclusivement (Prisma) — requêtes paramétrées |
| Validation entrées | `whitelist` + `forbidNonWhitelisted` sur tous les DTOs |
| Auth | JWT + refresh tokens, RBAC moindre privilège |
| Rate limiting | Sur auth, OTP, création de contenu (anti-abus) |
| XSS / CSRF | Échappement React, pas de `dangerouslySetInnerHTML`, cookies `httpOnly` si session |
| Headers HTTP | `CSP`, `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| Données sensibles | Téléphones, identifiants — chiffrement au repos en production |
| Logs | Structurés (JSON), sans données sensibles en clair |
| Audit sécurité | Revue simple avant chaque release majeure |

### 11.3 Tests automatisés

| Type | Portée | Cible |
|------|--------|-------|
| **Unitaires** | Logique métier (services) | Chaque règle métier critique |
| **Intégration** | Flux complets bout-en-bout | Auth, onboarding, modération, recherche |
| **Couverture** | Endpoints critiques | **≥ 60 %** (auth, modération, données utilisateur) |
| **Charge** | Pré-production | P95 dans les cibles, 0 % d'erreurs |
| **Régression** | Chaque correction de bug | Au moins 1 test empêchant la récidive |

**Discipline :** tout endpoint critique a au moins un test. Toute fonctionnalité non testée ET non documentée est considérée non livrée.

### 11.4 Backups & résilience

- Backups automatiques **quotidiens** de PostgreSQL
- Rétention **≥ 30 jours**
- Procédure de **restauration testée** au moins une fois par trimestre
- Runbook opérationnel : redémarrage services, restauration backup, création compte admin

### 11.5 Scalabilité & discipline

- Architecture capable d'absorber **×10 le volume** sans refonte structurelle
- Pas d'optimisation prématurée, mais pas de choix bloquant non plus
- Documentation produite **au fil de l'eau**, pas en fin de mission
- Frameworks éprouvés — pas de terrain d'expérimentation
- Tout retard ou blocage signalé **immédiatement par écrit**

---

## 12. Bilan tests locaux — 2026-06-05

Environnement : WSL2, Docker (PostgreSQL, Redis, Meilisearch), API `:3001`, Web `:3000`, seed actif.

### Performance API (30 req séquentielles)

| Endpoint | Status | P50 | P95 | Cible | Verdict |
|----------|--------|-----|-----|-------|---------|
| `GET /api/health` | 200 | 1 ms | 2 ms | < 200 ms | ✅ |
| `GET /api/categories` | 200 | 1.7 ms | 2.4 ms | < 200 ms | ✅ |
| `GET /api/categories/cafes` | 200 | 2.1 ms | 10.7 ms | < 200 ms | ✅ |
| `GET /api/merchants` | 200 | 3.5 ms | 7.9 ms | < 200 ms | ✅ |
| `GET /api/merchants/featured` | 200 | 2.7 ms | 4.1 ms | < 200 ms | ✅ |
| `GET /api/merchants/le-bushman-cafe` | 200 | 2.9 ms | 29 ms | < 200 ms | ✅ |
| `GET /api/search?q=cafe` | 200 | 44 ms | 47 ms | < 500 ms | ✅ |
| `POST /api/auth/login` | 200 | 185 ms | 188 ms | < 200 ms | ✅ |
| `GET /api/admin/stats` (auth) | 200 | 3.8 ms | 6.9 ms | < 200 ms | ✅ |

### Tests de charge (100 req, 20 concurrentes)

| Endpoint | Erreurs | P50 | P95 | Verdict |
|----------|---------|-----|-----|---------|
| `GET /api/health` | 0 | 9.9 ms | 55 ms | ✅ |
| `GET /api/categories` | 0 | 19 ms | 67 ms | ✅ |
| `GET /api/search?q=cafe` | 0 | 54 ms | 76 ms | ✅ |

### Performance Web (TTFB, 20 req)

| Page | P50 | P95 | Cible | Verdict |
|------|-----|-----|-------|---------|
| `/` | 117 ms | 171 ms | < 2 s | ✅ |
| `/search?q=cafe` | 97 ms | 385 ms | < 2 s | ✅ |
| `/m/le-bushman-cafe` | 163 ms | 220 ms | < 2 s | ✅ |

### Tests sécurité

| Test | Résultat attendu | Obtenu | Verdict |
|------|------------------|--------|---------|
| `GET /api/admin/stats` sans token | 401 | 401 | ✅ |
| `GET /api/favorites` sans token | 401 | 401 | ✅ |
| Login credentials invalides | 401 | 401 | ✅ |
| DTO champ inconnu (`hack`) | 400 | 400 | ✅ |
| Register email/password invalides | 400 | 400 | ✅ |
| Refresh token absent | 401 | 401 | ✅ |
| Injection SQL dans `?q=` | Pas de fuite / crash | 200 (résultat vide) | ✅ |
| CORS origine non autorisée | Pas de `Allow-Origin` | Pas de header accordé | ✅ |
| Hash bcrypt (cost 12) | Présent | Confirmé dans `auth.service` | ✅ |
| Index Prisma sur colonnes clés | Présents | 30+ index dans schema | ✅ |

### Statut V0.8 — features MVP+

| Feature | Statut | Notes |
|---------|--------|-------|
| **Autocomplete search** | ✅ | Debounce 180ms, Meilisearch + fallback Prisma, trending intégré |
| **Trending searches** | ✅ | `SearchHistory` groupBy, 7 jours, 0 résultats filtrés |
| **Analytics marchand avancés** | ✅ | Vraies stats (vues, WA, tél) + graphe vues/30j (SVG) |
| **Subscription plans** | ✅ | Page `/merchant/plans` — FREE/STARTER/GROWTH/PREMIUM (upgrade via WhatsApp) |
| **Sponsored listings** | ✅ | Admin toggle `is_sponsored`, badge amber, boost top 2 slots search |
| **Trust Score dynamique** | ✅ | Recalcul multi-signaux (OTP, complétude, avis, plaintes, favoris) — endpoint admin |
| **Smart Recommendations** | ✅ | Section "Vous aimerez aussi" sur `/m/[slug]` — même catégorie + district |
| **Admin Growth Dashboard** | ✅ | KPIs acquisition/rétention, graphes inscriptions+recherches, bouton Trust Score recalc |
| **Loyalty Lite** | ✅ | Points XP (review +20, favori +5, share +10, parrainage +30, merchant signup +50) — tiers Explorer/Local/Insider/Ambassadeur — `/profile/loyalty` |
| **Notifications in-app** | ✅ | `NotificationsModule` — types : review_approved, merchant_verified, loyalty_level_up, referral_reward, welcome — `/profile/notifications` |
| **Referral** | ✅ | Codes `LP-XXXX`, deep-link WhatsApp, double récompense 30 pts — `/profile/referral` |
| **Promotions engine** | ✅ | CRUD offres marchands PERCENTAGE/FIXED/FREE_ITEM/EARLY_ACCESS, activation temporelle — `GET /promotions/active` |
| Push notifications | ❌ | Report V1.0 (BullMQ + FCM) |

### Statut V0.5 — features produit

| Feature | Statut | Notes |
|---------|--------|-------|
| Homepage + recherche | ✅ | Meilisearch + fallback Prisma |
| Page résultats `/search` | ✅ | Filtres district/vérifié/tri, fallback trending |
| Catégories `/categories` | ✅ | Redesign éditorial (photo cards) |
| Catégories filtrées `/categories/[slug]` | ✅ | Liste marchands par catégorie |
| Profil marchand `/m/[slug]` | ✅ | Infos, photos, avis, horaires, WhatsApp, favoris |
| Nearby géo (Haversine < 2km) | ✅ | lat/lng + radius API |
| Auth email + OTP | ✅ | JWT access/refresh, OTP Redis |
| Favoris `/favoris` | ✅ | Toggle + liste |
| Avis — dépôt utilisateur | ✅ | ReviewTrigger sur page marchand, modération PENDING→APPROVED |
| Profil utilisateur `/profile` | ✅ | Dashboard sidebar, avis, liens rapides |
| Inscription marchand `/merchant/signup` | ✅ | Signup < 5 min |
| Dashboard marchand | ✅ | Stats, profile completeness, liens |
| Édition profil marchand | ✅ | Texte, catégorie, localisation |
| Upload médias | ✅ | Logo, cover, galerie |
| Gestion horaires | ✅ | 7 jours, open/close |
| Vérification téléphone OTP | ✅ | `/merchant/verify-phone` |
| Analytics marchand | ✅ | Vues, clics, interactions |
| Dashboard admin | ✅ | Stats globales, modération marchands/avis/signalements |
| Trust badge vérifié | ✅ | `verification_status: VERIFIED` |
| Signalements (`complaints`) | ✅ | File modération admin |

### Écarts identifiés (à combler avant production)

| Écart | Priorité | Statut |
|-------|----------|--------|
| **Rate limiting** | P1 | ✅ `@nestjs/throttler` — global 100/min, auth 10/min, OTP 5/min, avis 20/min |
| **Headers sécurité** (CSP, HSTS, X-Frame) | P1 | ✅ Helmet (API) + `next.config.ts` (Web, `poweredByHeader: false`) |
| **Tests automatisés** endpoints critiques | P1 | ✅ 15 tests Jest — `pnpm test` (auth 58 %, reviews 94 %, admin modération 69 %) |
| **Test charge 50 req/s** | P2 | ✅ `pnpm load-test` — P95=5ms (<200ms), 0 erreur serveur (429=rate limit attendu) |
| **Backups automatiques** | P2 | ✅ `scripts/backup.sh` + cron + runbook `Docs/RUNBOOK.md` |
| **Logs structurés JSON** | P2 | ✅ Winston (`nest-winston`) — JSON en prod, pretty-print en dev, logs rotatifs 30j |
| **Nombre favoris sur `/profile`** | P2 | ✅ Fetch API `GET /favorites` (corrigé juin 2026) |
| **Audit log modifications** | P3 | ❌ Table `audit_log` (futur trust/scoring) |

### Limites rate limiting (implémentées)

| Route | Limite |
|-------|--------|
| Global (défaut) | 100 req / min / IP |
| `/api/auth/*` | 10 req / min / IP |
| `/api/auth/otp/*` | 5 req / min / IP |
| `POST /api/reviews` | 20 req / min / IP |
| `/api/health` | Exclu (`@SkipThrottle`) |

### Tests automatisés

```bash
pnpm test          # 15 tests unitaires (auth, search, reviews, modération admin)
pnpm test:cov      # Rapport de couverture
```

---

## 13. Monitoring

| Outil | Statut | Notes |
|-------|--------|-------|
| **Sentry** | ✅ Configuré | `@sentry/nextjs` (web) + `@sentry/node` (API) — activé via `SENTRY_DSN` en prod |
| **PostHog** | ✅ Configuré | `posthog-js` — pageviews auto App Router, activé via `NEXT_PUBLIC_POSTHOG_KEY` en prod |
| **UptimeRobot** | ❌ À configurer | Service externe — pointer sur `https://laplasse.ci/api/health` |
| Winston JSON logs | ✅ | Logs structurés rotatifs 30j |

Logs obligatoires : auth failures, modération, erreurs API, slow queries (> 500ms)

Variables d'environnement à remplir en production :
```
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=laplasse
SENTRY_PROJECT=laplasse-web
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
```

## 13b. SEO (implémenté juin 2026)

| Feature | Statut | Notes |
|---------|--------|-------|
| `sitemap.xml` dynamique | ✅ | `/sitemap.ts` — pages statiques + catégories + marchands, revalidate 1h |
| `robots.txt` | ✅ | `/robots.ts` — autorise `/m/`, `/categories/`, `/search`, bloque admin/merchant |
| JSON-LD `LocalBusiness` | ✅ | Sur chaque `/m/[slug]` — nom, adresse, géo, horaires, avis |
| Metadata OG + Twitter | ✅ | Toutes les pages clés — titre dynamique, description, canonical, image |
| `metadataBase` | ✅ | Configuré dans `layout.tsx` — résolution absolue des URLs OG |

---

## 13c. Multi-établissements (livré V0.9)

Un compte marchand peut désormais posséder **plusieurs établissements** (`1:N User → Merchant`).

### Règles métier

- La contrainte `@unique` sur `Merchant.owner_id` a été supprimée (migration `allow_multi_merchant`).
- Lors de la connexion / `getMe`, l'API renvoie un tableau `merchants[]` (id, business_name, slug, verification_status).
- Le frontend stocke `activeMerchantId` dans le store Zustand (`laplasse-auth`, persisté).
- Toutes les routes `/merchants/me/*` acceptent un query param optionnel `?merchantId=` ; sans ce paramètre, la route résout le premier établissement de l'utilisateur.

### Nouvelles routes API

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/merchants/my/all` | Liste tous les établissements de l'utilisateur connecté |
| `GET` | `/merchants/me/profile?merchantId=` | Profil de l'établissement actif |
| `PATCH` | `/merchants/me/profile?merchantId=` | Modifier l'établissement actif |
| `GET/PATCH` | `/merchants/me/hours?merchantId=` | Horaires de l'établissement actif |
| `GET/POST/DELETE` | `/merchants/me/media?merchantId=` | Médias de l'établissement actif |
| `PATCH` | `/merchants/me/media/cover?merchantId=` | Logo/cover de l'établissement actif |
| `GET` | `/merchants/me/analytics?merchantId=` | Analytics de l'établissement actif |
| `GET` | `/merchants/me/analytics/chart?merchantId=` | Graphe analytics |
| `GET` | `/merchants/me/crm?merchantId=` | CRM de l'établissement actif |
| `POST` | `/merchants/me/verify-phone/send?merchantId=` | Envoi OTP téléphone |
| `POST` | `/merchants/me/verify-phone/confirm?merchantId=` | Confirmation OTP |
| `GET` | `/merchants/me/verify-phone/status?merchantId=` | Statut vérification |

### Switcher d'établissement (frontend)

`MerchantShell.tsx` affiche :
- Si `merchants.length > 1` : un dropdown permettant de basculer d'un établissement à l'autre (appelle `setActiveMerchant(id)`).
- Si `merchants.length === 1` : affichage simple du nom + lien vers la fiche publique.
- Toujours : lien « + Ajouter un établissement » → `/merchant/signup`.

### Pattern uniforme dans les pages dashboard

```typescript
const { activeMerchantId } = useAuthStore()
const qs = activeMerchantId ? `?merchantId=${activeMerchantId}` : ''
fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/me/profile${qs}`, ...)
```

---

## 13d. Organisations & Feature Gating (livré V1.0)

### Modèle Organisation

Un marchand avec plan **GROWTH** ou **PREMIUM** peut créer une `MerchantOrganization` pour regrouper ses établissements.

| Type | Description |
|------|-------------|
| `CHAIN` | Même marque, plusieurs sites |
| `GROUP` | Holding avec marques différentes |
| `MULTI_SITE` | Indépendant avec annexes |

Relations : `User 1:0..1 MerchantOrganization`, `MerchantOrganization 1:N Merchant`.

### Limites par plan (`apps/api/src/common/plan-limits.ts`)

| Plan | Photos | Établissements | Org | Promotions | CRM |
|------|--------|----------------|-----|------------|-----|
| FREE | 3 | 1 | ❌ | ❌ | ❌ |
| STARTER | 10 | 1 | ❌ | ✅ | ✅ |
| GROWTH | ∞ | 3 | ✅ lite | ✅ | ✅ |
| PREMIUM | ∞ | ∞ | ✅ advanced | ✅ | ✅ |

Enforcement : `addMyMedia`, `registerMerchant`, `promotions.create`, `bookings.create` (STARTER+), CRM (STARTER+), ads (GROWTH+), staff (GROWTH+).

### Booking vertical (P0 — livré)

Architecture unifiée (Tome 03 §10) : `BookingType` par catégorie marchand.

| Catégorie | Type | UI |
|-----------|------|-----|
| restaurants, cafés, bars | `TABLE` | Créneaux + invités |
| beaute, fitness | `APPOINTMENT` | Prestation + créneau |
| hotels | `ROOM` | Check-in/out + type chambre |
| boutiques | — | Widget masqué |

- Moteur disponibilité : horaires, capacité, fenêtre 30j, anti double-booking
- `GET /bookings/merchant/:id/config|availability`
- Rappels J-1 via BullMQ (Redis requis)
- FCM si `FCM_SERVER_KEY` + `DeviceToken`
- Page client `/profile/bookings`

### P1 ops (livré)

| Feature | Route / page |
|---------|----------------|
| Ads self-service | `POST /ads/campaigns`, `/merchant/ads` |
| Staff + prestations | `/merchants/me/staff|services`, `/merchant/staff` |
| Promotions UI | `/merchant/promotions`, `GET /promotions/mine` |
| CRM avancé | Bookings + favoris + avis dans `/merchants/me/crm` |
| Audit log | `GET /admin/audit`, table `AuditLog` |
| Fraude basique | `GET /admin/fraud`, spam booking/reviews |
| searchBoost | Jusqu'à 3 slots sponsorisés en recherche |

### Marketplace — quand la mettre en place ?

Prévue dans les Tomes (Tome 11 §18.4, Sprint 5) : produits, panier, checkout, commandes.

| Phase | Statut |
|-------|--------|
| V0.5 MVP discovery | ✅ Livré sans marketplace |
| V1.0 booking + monétisation SaaS | ✅ En cours |
| **V1.5 — Marketplace transactions** | ❌ **Prochaine grosse slice** |
| V2.0 Merchant OS + app native | Futur |

Recommandation : lancer la marketplace **après** stabilisation du booking vertical et densité marchands Abidjan — slice `Product` + `Order` + checkout simulé, ciblant d'abord **boutiques** (pas restaurants).

### Simulateur de paiement (V1)

Remplace Mobile Money en développement. Flux :

1. `POST /payments/subscribe/init` — crée une `PaymentTransaction` PENDING
2. `POST /payments/subscribe/confirm` — `{ paymentId, simulateResult: success|failure }`
3. Succès → met à jour `Merchant.subscription_plan` + `Subscription` + notification push

### Booking engine (V1)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/bookings/merchant/:id/enabled` | Vérifie si réservations actives (plan STARTER+) |
| `POST` | `/bookings/merchant/:id` | Créer une réservation (public, auth optionnelle) |
| `GET` | `/bookings/merchant?merchantId=` | Liste marchand |
| `PATCH` | `/bookings/:id/status` | Confirmer / annuler |

### Push notifications (BullMQ)

`NotificationQueueService` — file Redis `notifications`, channel `push` simulé (FCM en production).

---

### Routes API Organisations

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/organizations` | Créer (GROWTH+) |
| `GET` | `/organizations/mine` | Mon organisation |
| `PATCH` | `/organizations/:id` | Modifier |
| `POST/DELETE` | `/organizations/:id/merchants/:merchantId` | Rattacher / détacher |
| `GET` | `/organizations/:id/analytics` | Analytics agrégés |

---

## 14. Références

| Document | Contenu |
|----------|---------|
| `Implementation Blueprint.md` | Guide technique complet |
| `cibooks_master_report.md` | Synthèse stratégique |
| `docs_cuisinefacile.md` | Critères perf/sécurité/tests marketplace (inspiration) |
| `Tome 12` | Méthode Cursor / exécution |
| `Tome 22` | KPIs, anti-patterns, roadmap |
| `Tome 23` | Stack technique |
| `Tome 24` | QA, validation, UX, edge cases |
| `maquettes/*.md` | Références UI (HTML Tailwind) |

---

## 15. Roadmap V0.8 → V1.0

### V0.8 — CLÔTURÉE (juin 2026)
Concept validé terrain à Cocody. Déploiement Coolify opérationnel (prod + preprod).

| Feature clé | Statut |
|-------------|--------|
| Loyalty Lite (XP, tiers, `/profile/loyalty`) | ✅ |
| Notifications in-app | ✅ |
| Referral system (codes, WhatsApp deep-link) | ✅ |
| Promotions engine (marchands) | ✅ |
| CI/CD GitHub Actions | ✅ (nécessite PAT scope `workflow`) |
| CRM lite (`/merchant/crm` — segments récent/inactif/perdu) | ✅ |
| Stockage médias R2 (StorageService S3-compatible, fallback disk) | ✅ |
| Sidebar profil + navbar user link + layout pleine largeur | ✅ |
| Push notifications (BullMQ + FCM) | ❌ → V1.0 |

### V0.9 — LIVRÉE (juin 2026)
Multi-établissements marchand + unification icônes Lucide + navigation mobile off-canvas.

| Feature clé | Statut |
|-------------|--------|
| Multi-établissements : 1 compte → N établissements | ✅ |
| Switcher d'établissement dans la sidebar marchand | ✅ |
| `GET /merchants/my/all` + `?merchantId=` sur toutes les routes `/me/*` | ✅ |
| `authStore` : `merchants[]`, `activeMerchantId`, `setActiveMerchant()` | ✅ |
| Icônes unifiées Lucide (suppression emojis & icônes colorées) | ✅ |
| `FavoriteButton` (cœurs fonctionnels sur toutes les cartes) | ✅ |
| Menu mobile off-canvas (`MobileNav.tsx`) | ✅ |
| Catégories homepage en carousel avec navigation | ✅ |

### V1.0 — LIVRÉE (juin 2026)

| Feature clé | Statut |
|-------------|--------|
| Organisations (chaîne/groupe/multi-sites) | ✅ |
| Feature gating par plan (photos, établissements, promotions) | ✅ |
| Analytics agrégés par organisation | ✅ |
| Simulateur de paiement abonnements (`POST /payments/subscribe/*`) | ✅ |
| Booking engine vertical (TABLE/APPOINTMENT/ROOM) | ✅ |
| Availability engine + créneaux | ✅ |
| `/profile/bookings` | ✅ |
| Rappels booking BullMQ | ✅ |
| Ads self-service marchand | ✅ |
| Staff + prestations | ✅ |
| Promotions UI marchand | ✅ |
| CRM avancé (bookings/favoris) | ✅ |
| Audit log + fraude basique | ✅ |
| Push FCM (si FCM_SERVER_KEY) | ✅ |
| Marketplace ecommerce | ❌ → V1.5 |
| Push notifications BullMQ (push simulé → channel `push`) | ✅ |
| Expansion géographique (Yopougon, Marcory, Plateau dans seed) | ✅ |
| Domaine `laplasse.ci` | ❌ (infra) |

---

*Ce document doit être mis à jour à chaque fin de slice majeure.*
