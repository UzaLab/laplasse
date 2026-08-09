# Évolution app mobile LaPlasse

> Dernière mise à jour : **9 août 2026**  
> Périmètre actuel : **app consommateur uniquement** (`apps/mobile`)  
> Prochaine app : **livreur** (Phase 2) — app séparée ou switch de rôle, à trancher avant dev  
> Marchand : **web responsive** pour l’instant ; intégration légère dans l’app consommateur possible plus tard (notifications commandes, bascule rôle)

---

## 1. Positionnement produit

| App | Statut | Notes |
|-----|--------|-------|
| **Consommateur** | **En cours** (Phase 0 → Phase 1) | Découverte, marketplace, panier, commandes |
| **Livreur** | **Planifié** (Phase 2) | Missions, GPS, push offres — équivalent `/courier/*` |
| **Marchand / shop** | **Hors app native P0** | Back-office dense sur web ; évaluation ultérieure d’un module « Pro » dans l’app consommateur |
| **Admin / logistique** | **Web uniquement** | Dashboards desktop/tablette |

La PWA reste le canal léger et SEO ; l’app store apporte push fiable, deep links et présence stores.

---

## 2. Alignement avec [MOBILE_APP_STACK_RECOMMANDATIONS.md](./MOBILE_APP_STACK_RECOMMANDATIONS.md)

### Phase 0 — Fondations

| Action plan doc | État | Détail |
|-----------------|------|--------|
| Créer `apps/mobile` (Expo Router, TS) | ✅ Fait | SDK 57, Expo Router, monorepo pnpm |
| `packages/api-client` | ✅ Fait | Auth Bearer, refresh, headers pays, discovery, cart |
| `packages/shared-config` | ✅ Fait | Pays, `getApiBaseUrl`, constantes |
| Écran login | 🟡 Partiel | Email + mot de passe ; **OTP téléphone** (web) pas encore |
| CI EAS preview | ✅ Fait | Profil `preview`, APK Android internal |
| Expo MCP Cursor | ✅ Fait | Compte uza.lab, build via CLI/MCP |
| NativeWind | ⏸ Non retenu | StyleSheet + tokens amber/Outfit (parité visuelle sans NativeWind) |

### Phase 1 — MVP consommateur

| Action plan doc | État | Détail |
|-----------------|------|--------|
| Home + catégories + établissements | 🟡 ~80 % | Carrousels PWA, autocomplete ; pas encore carte geo home |
| Fiche établissement + boutique + produit | 🟡 ~50 % | Cover + liste produits ; pas avis, menu, WhatsApp, horaires |
| Panier + checkout | 🟡 ~70 % | Flux API OK ; paiement Mobile Money / WebView pas encore |
| Profil commandes + détail | 🟡 ~40 % | Liste basique ; pas écran détail `/profile/orders/[id]` |
| Suivi livraison | ❌ | `/delivery/track/[token]` absent |
| Push commande | 🟡 | `expo-notifications` + `POST /notifications/push/expo` ; pas test E2E prod |

### Phase 2 — Livreur

| Action | État |
|--------|------|
| App ou module livreur | ❌ Non démarré |
| API delivery (missions, GPS) | ✅ Existe côté web/API |

### Phase 3 — Stores

| Action | État |
|--------|------|
| Deep links `laplasse.tech/m/...` | 🟡 Config Android intent filters ; universal links iOS à valider |
| TestFlight / Play Internal | 🟡 Builds preview OK |
| Soumission stores | ❌ |

### Chantiers API (§4.3 doc stack)

| Chantier | État |
|----------|------|
| Tokens JSON mobile (`accessToken` / `refreshToken`) | ✅ `auth-client.util.ts` + header client mobile |
| Push Expo (`DeviceToken`) | ✅ `expo-push.service.ts` |
| CORS / schéma `laplasse://` | 🟡 À valider en prod si besoin |

---

## 3. Parité écrans — PWA consommateur vs app native

Légende : ✅ OK · 🟡 Partiel · ❌ Absent · ➖ Hors périmètre consommateur

### Navigation principale

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Accueil | `/` (HomeMobileV2) | `(tabs)/index` | 🟡 Carrousels, autocomplete Meilisearch, greeting |
| Marketplace | `/marketplace` | `(tabs)/marketplace` | 🟡 Grille produits + boutiques |
| Recherche | `/search` | `(tabs)/search` | 🟡 Autocomplete + onglets ; **pas carte / rayon** |
| Profil | `/profile` | `(tabs)/profile` | 🟡 Infos + pays ; pas settings/notifications |
| Commandes (accès rapide) | `/profile/orders` | `(tabs)/orders` | 🟡 Liste simple |
| Panier | drawer / `/cart` | `/cart` | 🟡 |
| Barre basse | `MobileBottomNav` | `(tabs)/_layout` | ✅ Découvrir · Marketplace · Recherche · Commandes · Profil |

### Auth & compte

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Connexion email | `/login` | `(auth)/login` | ✅ |
| Inscription | `/register` | `(auth)/register` | ✅ |
| OTP téléphone | `/login` (OTP) | — | ❌ |
| Paramètres profil | `/profile/settings` | — | ❌ |
| Notifications | `/profile/notifications` | — | ❌ |
| Favoris | `/favoris` | — | ❌ |
| Parrainage | `/profile/referral` | — | ❌ |
| Fidélité | `/profile/loyalty` | — | ❌ |
| Réservations | `/profile/bookings` | — | ❌ |
| Avis utilisateur | `/profile/reviews` | — | ❌ |

### Découverte & contenu

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Catégorie | `/categories/[slug]` | filtre search `category` | 🟡 Pas page dédiée |
| Hub restauration | `/restauration` | — | ❌ |
| Menu resto | `/m/[slug]/menu` | — | ❌ |
| Fiche établissement | `/m/[slug]` | `/m/[slug]/index` | 🟡 |
| Boutique marchand | `/m/[slug]/boutique` | (produits sur fiche) | 🟡 |
| Fiche produit | `/m/.../p/[slug]` | `/m/[slug]/p/[productSlug]` | 🟡 |
| Prestations / chambres | `/m/[slug]/prestations`, `chambres` | — | ❌ |
| Consultations | `/m/[slug]/consultations` | — | ❌ |

### Commerce

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Checkout | `/checkout` | `/checkout` | 🟡 Sans paiement en ligne |
| Paiement | `/checkout/payment` | — | ❌ |
| Détail commande | `/profile/orders/[id]` | — | ❌ |
| Reçu | `/profile/orders/[id]/receipt` | — | ❌ |
| Suivi livraison | `/delivery/track/[token]` | — | ❌ |

### APIs & Meilisearch (consommateur)

| Capacité | PWA | Mobile `api-client` | Branché UI |
|----------|-----|---------------------|------------|
| Catégories | ✅ | ✅ | ✅ Home |
| Featured merchants | ✅ | ✅ | ✅ Home |
| Marketplace featured / spotlight | ✅ | ✅ | ✅ Home + Marketplace |
| Autocomplete unified | ✅ | ✅ | ✅ Home + Search |
| Trending searches | ✅ | ✅ | ✅ Autocomplete |
| Search unified (+ pagination) | ✅ | ✅ (offset) | 🟡 Pas infinite scroll |
| Nearby / carte | ✅ | ✅ | ❌ |
| Favoris API | ✅ | ❌ | ❌ |

---

## 4. Stack technique en place (réel vs doc)

| Couche | Recommandation doc | Implémenté |
|--------|-------------------|------------|
| Expo SDK | 52+ | **57** |
| Expo Router | v4 | **~57** (file-based) |
| TanStack Query | v5 | ✅ |
| Zustand | ✅ | auth, country, cart |
| HTTP | `packages/api-client` | ✅ |
| Auth storage | SecureStore | ✅ + **localStorage web** (dev Metro) |
| Push | expo-notifications | ✅ enregistrement token |
| UI | NativeWind ou Paper | **StyleSheet + tokens Outfit/amber** |
| Cartes | react-native-maps | ❌ Phase 1 suite |
| Images | expo-image | ❌ (Image RN pour l’instant) |
| Formulaires RHF + Zod | recommandé | ❌ (useState) |

---

## 5. Roadmap immédiate (consommateur)

Ordre suggéré pour fermer Phase 1 :

1. **Recherche carte** — `react-native-maps` + `/merchants/nearby` (comme `SearchMobilePage`)
2. **Fiche établissement riche** — avis, médias, WhatsApp, horaires
3. **Détail commande + suivi livraison** — `/profile/orders/[id]`, `/delivery/track/[token]`
4. **Favoris** — écran + API client
5. **Hub restauration** — autocomplete menus + `/restauration`
6. **OTP login** — parité web
7. **Paiement checkout** — WebView ou deep link Mobile Money
8. **Pagination search** — infinite scroll unified

---

## 6. Roadmap livreur (Phase 2 — à venir)

App **séparée** `apps/courier` (recommandé) ou entrée « Mode livreur » après login :

| Écran web | Priorité |
|-----------|----------|
| `/courier/dashboard` | P0 |
| `/courier/missions` | P0 |
| `/courier/profile`, `/courier/earnings` | P1 |
| GPS foreground/background | P0 |
| Push offre livraison | P0 |

Décision produit en attente : **app livreur standalone** vs **switch rôle** dans une app « LaPlasse » multi-persona.

---

## 7. Marchand — option future dans l’app consommateur

Idée validée comme **piste** (non planifiée) :

- Après login marchand : tuile « Espace Pro » → notifications commandes, stats résumées, lien WebView vers `/merchant/dashboard`
- Évite une 3ᵉ app store listing tant que le back-office reste web-first

---

## 8. Builds & environnements

| Profil EAS | Usage | API |
|------------|-------|-----|
| `development` | Dev client | localhost / LAN |
| `preview` | APK internal test | `https://api.laplasse.tech/api` |
| `production` | Stores (futur) | prod |

Voir [MOBILE_EXPO_SETUP.md](./MOBILE_EXPO_SETUP.md) pour MCP, LAN WSL2, commandes.

---

## 9. Journal des jalons

| Date | Jalon |
|------|--------|
| 2026-06 | Rédaction stack recommandations |
| 2026-08-09 | Scaffold `apps/mobile`, packages partagés, auth API mobile, push Expo |
| 2026-08-09 | Fix crash APK (Metro, babel, SDK 57, intent filters) |
| 2026-08-09 | UI parité PWA : home v2, marketplace tab, autocomplete Meilisearch, thème amber/Outfit |
| 2026-08-09 | Preprod web fix Tailwind `field-input` ; déploiement Coolify OK |
| 2026-08-09 | Build EAS preview Android réussi (APK installable) |

---

*Maintenir ce fichier à chaque jalon consommateur ; créer `MOBILE_COURIER_EVOLUTION.md` au kick-off Phase 2.*
