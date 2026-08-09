# Application mobile LaPlasse — recommandations stack

> Document interne — juin 2026  
> Contexte : le web public est déjà **mobile-first** (PWA iOS/Android, barre basse, safe areas). Cette note compare les options pour une **app native** (App Store / Play Store) et propose une stack simple à maintenir avec l’existant.

---

## 1. Synthèse exécutive

| Recommandation | Détail |
|----------------|--------|
| **Stack retenue** | **Expo + React Native + TypeScript** |
| **Navigation** | **Expo Router** (file-based, proche de Next.js App Router) |
| **Backend** | **Réutiliser l’API NestJS actuelle** (`/api`, JWT, Prisma) — pas de nouveau BFF |
| **Première cible** | **App consommateur** (découverte, marketplace, commande, suivi livraison) |
| **Monorepo** | Ajouter `apps/mobile` + éventuellement `packages/*` partagés |
| **Expo MCP** | **Oui, officiel** — à configurer dans Cursor (voir §7) |

**Pourquoi Expo ?** Même écosystème que le web (React, TypeScript), tooling mature (build, OTA, notifications, store), courbe d’apprentissage la plus faible pour l’équipe actuelle, et bon alignement avec une API REST déjà en place.

---

## 2. Analyse du projet actuel

### 2.1 Architecture

```
laplasse/
├── apps/
│   ├── web/          Next.js 16, React 19, Tailwind v4, TanStack Query, Zustand
│   └── api/          NestJS 11, Prisma, PostgreSQL, Meilisearch, Redis
├── Docs/
└── package.json      pnpm workspaces
```

- **API REST** : ~30 controllers (auth, merchants, marketplace, delivery, couriers, logistics, bookings…).
- **Auth** : JWT access + refresh ; cookies httpOnly côté web **et** support **Bearer** + `refresh_token` dans le body (déjà prêt pour mobile).
- **Recherche** : Meilisearch (endpoint `/search`).
- **Fichiers** : S3 (images produits, couvertures…).
- **Notifications** : Web Push (VAPID) + table `DeviceToken` (`platform`, `push_subscription`).

### 2.2 Expérience mobile web déjà en place

- PWA (`manifest.webmanifest`, service worker, icônes, shortcuts).
- Pages « app » : home mobile v2, recherche carte, marketplace, fiche établissement, checkout, profil, livreur (`/courier/*`).
- Chrome mobile : barre basse publique, safe areas iOS, espacement navbar documenté (`mobilePublicChrome.ts`).

**Conséquence :** l’UX mobile est déjà pensée ; l’app native peut **reprendre les parcours** sans repartir de zéro sur le product design.

### 2.3 Personas et périmètre

| Persona | Web aujourd’hui | Priorité app native |
|---------|-----------------|---------------------|
| **Consommateur** | Home, search, `/m/[slug]`, boutique, panier, checkout | **P0** |
| **Livreur** | `/courier/missions`, dashboard | **P1** (GPS, push temps réel) |
| **Marchand / shop** | Back-office dense (`/merchant`, `/shop/manage`) | **P2 ou web responsive** |
| **Logistique / admin** | Dashboards larges | **Web uniquement** (tablette/desktop) |

Ne pas viser une seule app « fourre-tout » au départ : une **app consommateur** + plus tard une **app livreur** (ou une app avec rôle switch) est plus simple qu’un clone natif de tout le back-office.

---

## 3. Options comparées

### 3.1 Expo + React Native (recommandé)

**Pour**

- React + TypeScript = compétences déjà présentes sur `apps/web`.
- Expo Router ≈ conventions Next (routes, layouts, deep links).
- EAS Build / Submit : builds iOS/Android sans Mac local obligatoire pour Android ; CI simple.
- Modules clés : `expo-notifications`, `expo-location`, `expo-secure-store`, `expo-image`, `expo-router`.
- Communauté large, doc à jour, intégration IA via **Expo MCP**.

**Contre**

- Pas de partage direct des composants UI Tailwind web → il faut une **couche UI mobile** (NativeWind ou StyleSheet).
- Certaines libs web (Leaflet, TipTap) n’existent pas telles quelles → alternatives RN.

### 3.2 PWA seule (statu quo amélioré)

**Pour**

- Déjà déployée ; coût quasi nul.
- Une seule codebase.

**Contre**

- iOS : push et capabilities limitées ; pas de présence App Store (discoverability, confiance).
- Pas d’accès natif fluide (background GPS livreur, haptics, app switcher).
- Perception « moins pro » pour partenaires B2B.

**Verdict :** garder la PWA pour acquisition rapide ; **ajouter une app store** pour crédibilité et features natives (push fiable, géoloc livreur).

### 3.3 Capacitor (WebView autour du site Next)

**Pour**

- Réutilise le HTML/CSS existant.

**Contre**

- Performance et UX inférieures (scroll, clavier, transitions).
- Dette : le site Next n’est pas pensé pour WebView (SSR, cookies, routing).
- Debugging pénible sur parcours checkout / carte.

**Verdict :** **non recommandé** pour LaPlasse (trop de flows riches : carte, panier, multi-rôles).

### 3.4 Flutter

**Pour**

- UI performante, un seul codebase mobile.

**Contre**

- Dart = nouvelle stack ; **aucune réutilisation** du web/API client TypeScript.
- Deux mental models (Widget vs React) pour la même équipe.

**Verdict :** pertinent si équipe mobile dédiée Flutter ; **pas optimal** ici.

---

## 4. Stack recommandée (détail)

### 4.1 Cœur mobile

| Couche | Choix | Rôle |
|--------|-------|------|
| Runtime | **Expo SDK 52+** (viser 53/54 à l’init) | Build, config, modules natifs |
| Langage | **TypeScript strict** | Aligné web + API |
| Navigation | **Expo Router v4** | Tabs consommateur, stacks modales, deep links `/m/:slug` |
| Data | **TanStack Query v5** | Même pattern que `apps/web` |
| État global | **Zustand** | Session, panier, pays actif |
| HTTP | **fetch** + client partagé | Bearer JWT, refresh, headers pays |
| Formulaires | **React Hook Form** + **Zod** | Login, adresses, checkout |
| UI | **NativeWind v4** (Tailwind RN) *ou* **React Native Paper** | Cohérence visuelle avec la marque amber/slate |
| Cartes | **react-native-maps** (+ `expo-location`) | Search mobile, fiche établissement, suivi livraison |
| Images | **expo-image** | CDN / S3, cache, placeholders |
| Auth storage | **expo-secure-store** | Access + refresh tokens |
| Push | **expo-notifications** | Commandes, livraison, promos |
| Analytics | **PostHog RN** ou Expo Analytics | Parité avec le web |
| Erreurs | **Sentry React Native** | Parité `@sentry/nextjs` |

### 4.2 Structure monorepo proposée

```
laplasse/
├── apps/
│   ├── web/
│   ├── api/
│   └── mobile/                 # npx create-expo-app@latest
├── packages/
│   ├── api-types/              # DTO / types générés ou copiés depuis l’API
│   ├── api-client/             # fetch auth, country headers, errors
│   ├── shared-config/          # pays, brand, constantes (depuis lib/web)
│   └── eslint-config/          # optionnel
└── pnpm-workspace.yaml
```

**Partage réaliste**

- ✅ Types, constantes pays (`country.ts`), libellés marque, client HTTP, logique panier/checkout **sans UI**.
- ✅ TanStack Query keys / hooks métier (adaptés).
- ❌ Composants React DOM (Tailwind web, Leaflet, TipTap).

### 4.3 Consommation de l’API

Le web utilise `authApiFetch` avec **cookies**. Le mobile utilisera :

```typescript
// Headers
Authorization: Bearer <access_token>
X-Country-Code: CI   // même logique que countryRequestHeaders()

// Refresh (déjà supporté)
POST /api/auth/refresh
{ "refresh_token": "<stored_refresh>" }
```

Le JWT strategy lit déjà **cookie OU Bearer** (`jwt.strategy.ts`).  
À prévoir côté API (petit chantier) :

1. Réponses login/register/otp : option `?client=mobile` retournant `{ user, access_token, refresh_token }` **sans dépendre des cookies** (aujourd’hui les tokens sont surtout posés en cookies ; le refresh body existe déjà).
2. Push : étendre `DeviceToken.platform` (`ios` | `android` | `expo`) + endpoint d’enregistrement token Expo/FCM (aujourd’hui : Web Push VAPID uniquement).
3. CORS : autoriser l’origine mobile / schéma `laplasse://` si requêtes depuis dev.

### 4.4 Cartographie écrans P0 (app consommateur)

Reprennent les routes web existantes :

| Écran mobile | Équivalent web | API principale |
|--------------|----------------|----------------|
| Onboarding / login | `/login`, OTP | `/auth/*` |
| Home | `HomeMobileV2Page` | merchants featured, categories, marketplace |
| Recherche + carte | `/search` mobile | `/search`, `/geo` |
| Fiche établissement | `/m/[slug]` | `/merchants/:slug` |
| Boutique / produit | `/m/.../boutique`, `/p/...` | marketplace |
| Panier / checkout | `/cart`, `/checkout` | orders, payments |
| Commandes | `/profile/orders` | user orders |
| Suivi livraison | `/delivery/track/[token]` | delivery |
| Favoris / profil | `/favoris`, `/profile` | favorites, `/auth/me` |

**Hors scope P0 :** back-office marchand, admin, logistics, éditeur riche (descriptions HTML → WebView ou rendu simplifié).

---

## 5. Plan de delivery par phases

### Phase 0 — Fondations (1–2 semaines)

- Créer `apps/mobile` (Expo Router, TypeScript).
- Package `packages/api-client` : base URL, auth, refresh, country.
- Écran login (email + OTP téléphone, comme le web).
- CI : EAS Build preview (APK + Simulator).

### Phase 1 — MVP consommateur (4–6 semaines)

- Home + catégories + liste établissements (`NearbyCard` équivalent).
- Fiche établissement + boutique + fiche produit.
- Panier + checkout (paiement : reprendre le flux web existant).
- Profil commandes + suivi livraison.
- Push commande (Expo Notifications + extension API).

### Phase 2 — Livreur (3–4 semaines)

- App séparée **ou** switch de rôle après login.
- Missions, accept/refuse, GPS foreground/background, push offre livraison.
- API delivery déjà orientée « push + timeout offre ».

### Phase 3 — Polish & stores

- Deep links universels (`https://laplasse.ci/m/...` → app).
- Tests TestFlight / Play Internal.
- Soumission stores (CIE/SN/BF : comptes dev Apple/Google).

**Back-office marchand :** conserver le **web responsive** ; évaluer une app marchand légère seulement si usage terrain (ex. notifications commandes, scan) le justifie.

---

## 6. UI / design system

Le web utilise **Outfit**, amber brand, coins arrondis modérés sur les champs, **boutons en pilule** (`rounded-full`).

Recommandation mobile :

- Reprendre tokens : `#f59e0b` (brand-500), `#0f172a` (slate-900), `#FAFAFA` fond.
- **NativeWind** : porter les utilitaires Tailwind familiers.
- Composants de base : `Button` (pill), `Input` (`rounded-xl`), `Card` (`rounded-2xl`), barre d’onglets basse (comme `MobileBottomNav`).
- Ne pas tenter un pixel-perfect du web ; viser **parité fonctionnelle** et **cohérence marque**.

---

## 7. Expo MCP — existe-t-il ? Comment l’utiliser ?

**Oui.** Expo propose un **MCP server officiel** (remote), documenté sur [docs.expo.dev/mcp](https://docs.expo.dev/mcp/).

| Paramètre | Valeur |
|-----------|--------|
| Type | Streamable HTTP |
| URL | `https://mcp.expo.dev/mcp` |
| Auth | OAuth (compte Expo) |

**Capacités typiques**

- Recherche / lecture doc Expo à jour.
- Installation de libs compatibles (`expo install`).
- (Avec dev server local SDK 54+) captures simulateur, automation UI, DevTools.

**Dans Cursor aujourd’hui**

- Le MCP **n’est pas activé** dans ce workspace (seuls `cursor-ide-browser`, `user-coolify`, `user-cloudflare` apparaissent).
- Pour l’ajouter : *Settings → MCP → Add server* avec l’URL ci-dessus, puis OAuth Expo.

**Limites à connaître**

- Fonctionnalité encore en **preview** (certaines features liées au plan Expo).
- Capacités « locales » (screenshots simulateur) nécessitent le **serveur de dev Expo** lancé avec MCP activé.
- Ne remplace pas la connaissance métier LaPlasse : le MCP Expo aide sur **Expo/RN**, pas sur votre API NestJS.

---

## 8. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Double maintenance web + mobile | Package `api-client` + types partagés ; hooks Query similaires |
| Auth cookies vs mobile | Endpoint mobile explicite ; SecureStore ; Bearer déjà supporté |
| Push différent web/native | Unifier `DeviceToken` ; service push abstrait (web-push + FCM/APNs) |
| Paiement mobile (Mobile Money) | Réutiliser flux web (redirect / WebView contrôlée) en P1 |
| Carte / perf | `react-native-maps` ; clustering côté API si besoin |
| Contenu HTML produit | `react-native-render-html` ou WebView isolée |
| Taille équipe | Une seule app consommateur d’abord ; livreur ensuite |

---

## 9. Commandes de bootstrap (référence)

```bash
# À la racine du monorepo
cd /home/kadso05/projets/laplasse

# Créer l’app (Expo Router + TypeScript)
pnpm create expo-app apps/mobile --template tabs

# Dépendances suggérées
cd apps/mobile
npx expo install expo-router expo-secure-store expo-notifications expo-location
pnpm add @tanstack/react-query zustand zod react-hook-form

# Build cloud ( après compte expo.dev )
pnpm add -D eas-cli
eas build:configure
```

Ajouter dans `pnpm-workspace.yaml` :

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 10. Décision recommandée

1. **Adopter Expo + React Native + Expo Router** dans `apps/mobile`.
2. **Ne pas** wrapper le site Next (Capacitor).
3. **Réutiliser l’API NestJS** telle quelle, avec un **petit adaptateur auth mobile** et **push natif**.
4. **Lancer par l’app consommateur** en reprenant les écrans déjà validés sur le web mobile (home, search, fiche, boutique, checkout).
5. **Activer Expo MCP dans Cursor** pour accélérer setup, deps et conformité SDK.
6. **Garder la PWA** en parallèle (canal léger, SEO, utilisateurs sans install).

---

## 11. Prochaines actions concrètes

- [ ] Valider périmètre P0 (consommateur uniquement vs livreur inclus).
- [ ] Créer `apps/mobile` + `packages/api-client`.
- [ ] PR API : login mobile (`access_token` / `refresh_token` dans le JSON) + CORS.
- [ ] PR API : enregistrement push Expo (`DeviceToken.platform = 'expo'`).
- [ ] Maquettes : reprendre `HomeMobileV2Page` + `NearbyCard` comme référence visuelle.
- [ ] Configurer **Expo MCP** dans Cursor + compte EAS.
- [ ] Premier build EAS (Android internal) pour test sur appareils CI/SN.

---

*Document rédigé à partir de l’analyse du dépôt `laplasse` (apps/web, apps/api, PWA, auth JWT, notifications).*
