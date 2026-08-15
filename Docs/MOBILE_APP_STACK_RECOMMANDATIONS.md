# Application mobile LaPlasse — recommandations stack

> Document interne — juin 2026  
> **Dernière révision plan : 15 août 2026**  
> Suivi opérationnel : [MOBILE_EVOLUTION.md](./MOBILE_EVOLUTION.md)

Contexte : le web public est **mobile-first** (PWA). Ce document fixe la stack, les décisions produit et la roadmap **Phases 1–4** pour les apps natives (stores).

---

## 1. Synthèse exécutive

| Recommandation | Détail |
|----------------|--------|
| **Stack retenue** | **Expo + React Native + TypeScript** |
| **Navigation** | **Expo Router** (file-based) |
| **Backend** | **API NestJS** (`/api`, JWT Bearer, Prisma) — pas de BFF |
| **App consommateur** | `apps/mobile` — **Phase 1 en finalisation** |
| **App livreur** | **`apps/courier` — app séparée** (Phase 2, **en pause** jusqu’à fin app principale) |
| **Marchand** | **Module Pro natif** dans `apps/mobile` (Phase 4) — pas de clone back-office |
| **Paiement** | **Simulateur natif maintenu** jusqu’à intégration Mobile Money post-stores |
| **Perf / UX** | **Natif d’abord** — WebView interdit sauf obligation provider |
| **Monorepo** | `apps/mobile`, `apps/courier`, `packages/api-client`, `packages/shared-config` |

---

## 2. Analyse du projet actuel

### 2.1 Architecture

```
laplasse/
├── apps/
│   ├── web/          Next.js 16, React 19, TanStack Query, Zustand
│   ├── api/          NestJS 11, Prisma, Meilisearch, Redis
│   └── mobile/       Expo 57, Expo Router (consommateur + futur module Pro)
│   └── courier/      (Phase 2) App livreur dédiée
├── packages/
│   ├── api-client/
│   └── shared-config/
└── Docs/
```

### 2.2 Personas et périmètre (révisé août 2026)

| Persona | Web | App native | Phase |
|---------|-----|------------|-------|
| **Consommateur** | Home, search, checkout, profil | `apps/mobile` | **Phase 1** (finalisation) |
| **Livreur** | `/courier/*` | **`apps/courier`** (séparée) | **Phase 2** |
| **Marchand** | `/merchant`, `/shop/manage` | **Module Pro** `(pro)/` dans mobile | **Phase 4** |
| **Admin / logistique** | Dashboards larges | Web uniquement | — |

---

## 3. Stack recommandée (détail)

### 3.1 Cœur mobile

| Couche | Choix | Rôle |
|--------|-------|------|
| Runtime | **Expo SDK 57+** | Build, OTA, modules natifs |
| Navigation | **Expo Router** | Tabs consommateur, stacks, `(pro)/`, deep links |
| Data | **TanStack Query v5** | Aligné web |
| État | **Zustand** | Session, panier, pays |
| HTTP | **`packages/api-client`** | Bearer, refresh, headers pays |
| UI | **StyleSheet + tokens** (`src/theme`) | Outfit, amber `#f59e0b`, slate `#0f172a` — **pas NativeWind** |
| Cartes | **`react-native-maps`** + `expo-location` | Recherche, suivi, livreur — **pas WebView OSM** |
| Images | **`expo-image`** | CDN S3, cache, placeholders |
| HTML riche | **`react-native-render-html`** | Descriptions produit — **pas WebView** |
| Auth | **expo-secure-store** | Tokens |
| Push | **expo-notifications** | Commandes, livraison, pro |
| Paiement (actuel) | **Écrans natifs simulateur** | `/payment`, `/bookings/pay` — API `confirm*Payment` |
| Paiement (futur) | Deep link / intent retour provider | WebView **uniquement** si page hébergée sans schéma app |
| Erreurs | **Sentry React Native** | Phase 3 |
| Analytics | **PostHog RN** | Phase 3 |
| OTA | **expo-updates** | Phase 3 |

### 3.2 Politique « natif d’abord »

| Besoin | ✅ Recommandé | ❌ À éviter |
|--------|---------------|-------------|
| Carte recherche / livraison | `react-native-maps` | WebView Leaflet/OSM |
| Images produits / cover | `expo-image` | `<Image>` sans cache |
| Description HTML | `react-native-render-html` | WebView pleine page |
| Checkout / profil / pro | Composants RN | WebView vers Next.js |
| Mobile Money (futur) | Deep link + écran retour natif | WebView embarquée par défaut |
| Admin dense (TipTap, tableaux) | Lien externe navigateur | WebView in-app |

**Exception actuelle à migrer :** `SearchOsmMap.tsx` (WebView) → Phase 1.

### 3.3 Partage monorepo

- ✅ `api-client`, `shared-config`, types, hooks Query, tokens theme
- ✅ Même patterns auth / pays / panier
- ❌ Composants React DOM (Tailwind web, Leaflet)

---

## 4. UI / design system & intégrations

### 4.1 Tokens (alignés PWA)

| Token | Valeur | Usage |
|-------|--------|-------|
| Brand 500 | `#f59e0b` | CTA, accents, étoiles |
| Brand 600–700 | `#d97706` / `#b45309` | Liens, pressed |
| Slate 900 | `#0f172a` | Texte, nav active profil |
| Background | `#FAFAFA` | Fond écrans |
| Surface | `#ffffff` | Cartes |
| Rayon cartes | 24–28px | `rounded-2xl` |
| Boutons | `rounded-full` (pill) | Primaire amber, secondaire outline |

Polices : **Outfit** (400–800) via `@expo-google-fonts/outfit`.

Fichiers source : `apps/mobile/src/theme/index.ts`, `src/lib/profileTheme.ts`.

### 4.2 Intégrations UI à respecter

| Zone | Pattern |
|------|---------|
| **Tabs publiques** | `(tabs)/_layout` — 5 onglets, safe area bottom |
| **Profil** | `ProfileShell` — drawer gauche→droite, bottom nav slate |
| **Home** | `MobileDrawer` droite→gauche, `CountrySelect` drapeaux (`shared-config`) |
| **Feedback** | `ToastHost` + `notify.ts` — pas `Alert.alert` seul (web/APK) |
| **Checkout** | `CheckoutWizardShell`, stepper amber |
| **Fiches merchant** | Vues verticales dédiées (shop, hôtel, service, resto) |
| **Module Pro** (Phase 4) | Header slate-900, icône briefcase, même tokens — identité « pro » sans rupture marque |

### 4.3 Checklist UI Phase 1 (finalisation)

- [x] Remplacer toutes les `<Image>` critiques par `expo-image`
- [x] Migrer carte recherche vers `react-native-maps`
- [ ] Audit contrastes amber/slate sur Android (APK)
- [x] Infinite scroll + états vides/erreur homogènes (Query)
- [x] Soumission avis + table resto — composants natifs cohérents fiches merchant

---

## 5. Plan de delivery par phases

### Phase 0 — Fondations ✅ (terminée)

`apps/mobile`, packages partagés, auth OTP, EAS preview, push token.

### Phase 1 — MVP consommateur (finalisation) — ~2–3 sem.

**Objectif :** parité fonctionnelle PWA consommateur, **simulateur paiement conservé**.

| Domaine | Fait | Reste |
|---------|------|-------|
| Home, marketplace, autocomplete | ✅ | — |
| Fiches + boutique + resto + réservations | ✅ | — |
| Panier, checkout, simulateur paiement | ✅ | — |
| Profil hub complet | ✅ | — |
| Favoris, suivi livraison | ✅ | — |
| Carte recherche | 🟡 WebView | **Maps natif** |
| Push | 🟡 Token | Routing au tap |

**Paiement :** les écrans `/payment` et `/bookings/pay` appellent l’API simulateur (`success` / `failure`). **Pas de Mobile Money** en Phase 1 — documenter dans release notes stores (« paiement test / espèces à la livraison selon marchand »).

### Phase 2 — Livreur — app séparée `apps/courier` — ⏸ en pause

> **Reporté** jusqu’à finalisation Phase 1 + soumission stores (Phase 3) de l’app consommateur.

#### Recommandation retenue : **app séparée** (vs switch rôle)

| | App séparée | Switch rôle |
|--|-------------|-------------|
| GPS background | Ciblé livreurs | Tous utilisateurs |
| Taille / perf | APK optimisé | Code mort consommateur |
| Releases | Indépendantes | Risque régression checkout |
| Store listing | « LaPlasse Livreur » | Persona floue |

**Implémentation :** nouveau `apps/courier`, réutilise `api-client` / `shared-config` / theme. Deux `eas.json`. Auth JWT même API, rôle `courier` requis.

**Périmètre P0 :** onboarding, missions, accept/refuse, GPS, push offres, carte native mission.

### Phase 3 — Polish & stores — 2–3 sem.

- Deep links : `https://laplasse.ci/m/...`, commandes, suivi, notifications
- Sentry + PostHog
- Tests (Jest + smoke Detox) + CI mobile
- `expo-updates` (canal preview)
- TestFlight / Play Internal → soumission stores (CI, SN, BF)

### Phase 4 — Module Pro marchand — 4–6 sem.

**Décision actée :** module **natif** dans `apps/mobile`, route group **`app/(pro)/`**.

Entrée depuis `/profile` si compte marchand (tuile « Espace Pro »).

| Fonction | Natif P0/P1 | Web seulement |
|----------|-------------|---------------|
| Dashboard résumé, alertes | ✅ | — |
| Commandes (liste, détail, statuts) | ✅ | — |
| Notifications commandes / RDV | ✅ | — |
| Stock / visibilité rapide | ✅ P1 | — |
| Réservations merchant | ✅ P1 | — |
| Éditeur produit riche, compta, ads avancés | — | ✅ navigateur externe si besoin |

**Pas de WebView** vers `/merchant/dashboard` pour les parcours P0.

---

## 6. Cartographie écrans consommateur (Phase 1)

| Écran mobile | Route | Statut |
|--------------|-------|--------|
| Login / OTP | `(auth)/login` | ✅ |
| Home | `(tabs)/index` | ✅ |
| Marketplace | `(tabs)/marketplace` | ✅ |
| Recherche | `(tabs)/search` | 🟡 |
| Profil | `/profile/*` | ✅ |
| Fiche établissement | `/m/[slug]` | ✅ |
| Boutique / produit | `/m/.../boutique`, `/p/...` | ✅ |
| Panier / checkout | `/cart`, `/checkout` | ✅ |
| Paiement simulateur | `/payment` | ✅ |
| Commandes | `/orders/[id]`, profil orders | ✅ |
| Suivi livraison | `/delivery/track/[token]` | ✅ |
| Réservations | `/bookings/pay`, profil bookings | ✅ |
| Favoris | `/favoris` | ✅ |

---

## 7. Consommation API (mobile)

```typescript
Authorization: Bearer <access_token>
X-Country-Code: CI
POST /api/auth/refresh { "refresh_token": "..." }
```

Chantiers API — état :

| Chantier | État |
|----------|------|
| Tokens JSON mobile | ✅ |
| Push Expo `DeviceToken` | ✅ |
| Payload push avec `href` | 🟡 Phase 1 |
| Paiement simulateur | ✅ |
| Mobile Money réel | ❌ Post-stores |

---

## 8. Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Double maintenance web + mobile | `api-client` + évolution doc |
| WebView perf | Politique natif §3.2 ; migration maps |
| Paiement stores sans MM | Simulateur + livraison/COD ; MM en release ultérieure |
| Deux apps (mobile + courier) | Packages partagés monorepo |
| Module Pro scope creep | P0 commandes/notifs ; éditeur riche reste web |
| Push silencieux | Listener + deep link Phase 1 |

---

## 9. Expo MCP

URL : `https://mcp.expo.dev/mcp` — OAuth Expo. Configuré pour le workspace. Voir [MOBILE_EXPO_SETUP.md](./MOBILE_EXPO_SETUP.md).

---

## 10. Décisions actées (15 août 2026)

1. ✅ **P0 consommateur** — Phase 1 finalisation
2. ✅ **Simulateur paiement** maintenu (pas Mobile Money Phase 1)
3. ✅ **Natif d’abord** — migrer WebView carte ; pas de WebView Pro
4. ✅ **Livreur = app séparée** `apps/courier`
5. ✅ **Marchand = module Pro natif** `(pro)/` dans mobile
6. ✅ **Admin / logistique** — web uniquement
7. ✅ **PWA** conservée en parallèle

---

## 11. Checklist phases (état au 15 août 2026)

### Phase 0 ✅

- [x] `apps/mobile` + packages + EAS + MCP
- [x] Auth OTP + Bearer
- [x] Push enregistrement token

### Phase 1 — finalisation

- [x] Home, marketplace, autocomplete, panier, checkout
- [x] Simulateur paiement commandes + réservations
- [x] Profil complet, favoris, resto, fiches verticales, suivi livraison
- [x] Carte **`react-native-maps`** (`SearchNativeMap`)
- [x] Push tap → navigation
- [x] Avis (création), table resto, reçu, mot de passe oublié
- [x] `expo-image` via `AppImage` (composants principaux)
- [x] Infinite scroll recherche + marketplace
- [x] SAV commande (retour + litige livraison)
- [ ] Tests smoke + CI typecheck mobile

### Phase 2 — livreur — ⏸ en pause

- [ ] Créer `apps/courier` + EAS — **reporté après app principale**
- [ ] Missions, GPS, push offres, carte native

### Phase 3 — stores

- [ ] Deep links complets
- [ ] Sentry, PostHog, OTA
- [ ] TestFlight / Play → soumission

### Phase 4 — module Pro

- [ ] Route group `(pro)/` + garde rôle marchand
- [ ] Dashboard, commandes, notifications P0
- [ ] Catalogue / réservations P1

---

## 12. Suivi

| Document | Rôle |
|----------|------|
| [MOBILE_EVOLUTION.md](./MOBILE_EVOLUTION.md) | Parité écran par écran, journal jalons |
| [MOBILE_EXPO_SETUP.md](./MOBILE_EXPO_SETUP.md) | Dev, LAN, builds |

---

*Références : `apps/mobile`, `apps/web`, `apps/api`, maquettes `Docs/maquettes/`.*
