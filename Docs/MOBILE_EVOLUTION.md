# Évolution app mobile LaPlasse

> Dernière mise à jour : **15 août 2026**  
> Apps : **`apps/mobile`** (consommateur + module Pro) · **`apps/courier`** (Phase 2, app séparée)  
> Source de vérité opérationnelle — plan stratégique : [MOBILE_APP_STACK_RECOMMANDATIONS.md](./MOBILE_APP_STACK_RECOMMANDATIONS.md)

---

## 1. Positionnement produit (décisions actées)

| App / module | Statut | Décision |
|--------------|--------|----------|
| **Consommateur** | Phase 1 — finalisation | App store P0 : découverte, marketplace, commande, profil, réservations |
| **Livreur** | **En pause** | App séparée `apps/courier` — **après finalisation app principale** (voir §6) |
| **Module Pro marchand** | Phase 4 — planifié | **Natif** dans `apps/mobile`, route group `(pro)/` — pas de WebView dashboard |
| **Admin / logistique** | Hors scope mobile | Web desktop/tablette uniquement |

**Paiement :** simulateur natif **maintenu** (`/payment`, `/bookings/pay`) jusqu’à intégration Mobile Money réelle (chantier API + providers, post-lancement stores).

**Principe technique :** **natif d’abord** — pas de WebView sauf obligation provider (ex. page hébergée Mobile Money sans schéma retour). Cartes → `react-native-maps` ; images → `expo-image` ; HTML produit → `react-native-render-html`.

La PWA reste le canal SEO et acquisition ; l’app store apporte push fiable, deep links et crédibilité partenaires.

---

## 2. Avancement par phase

### Phase 0 — Fondations ✅

| Action | État |
|--------|------|
| `apps/mobile` Expo Router + TS (SDK 57) | ✅ |
| `packages/api-client` + `shared-config` | ✅ |
| Auth Bearer + SecureStore + refresh | ✅ |
| Login OTP téléphone | ✅ |
| EAS preview Android | ✅ |
| Expo MCP Cursor | ✅ |
| Push Expo — enregistrement token | ✅ |

### Phase 1 — MVP consommateur 🟡 ~95 %

| Bloc | État | Reste à faire |
|------|------|---------------|
| Home + marketplace + autocomplete | ✅ | — |
| Recherche + carte | ✅ | — |
| Fiches établissement (shop, hôtel, service, resto) | ✅ | — (avis ✅ ; table resto ✅) |
| Panier + checkout + simulateur paiement | ✅ | — (Mobile Money **hors Phase 1**) |
| Profil complet (commandes, réservations, fidélité…) | ✅ | — |
| Favoris, restauration, détail commande, suivi livraison | ✅ | — (reçu ✅) |
| Push | ✅ | — |
| UI / design tokens | ✅ | **`AppImage`** (expo-image) migré sur écrans consommateur |

### Phase 2 — Livreur ⏸ En pause

App **`apps/courier`** reportée — démarrage **après** clôture Phase 1 + Phase 3 stores de l’app principale.

### Phase 3 — Polish & stores ❌

Deep links complets, Sentry, analytics, tests, CI mobile, OTA, soumission App Store / Play.

### Phase 4 — Module Pro marchand ❌

Route group `(pro)/` dans `apps/mobile` — voir §8 et roadmap §7.

---

## 3. Parité écrans — PWA vs app native

Légende : ✅ · 🟡 · ❌ · ➖

### Navigation & découverte

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Accueil | `/` | `(tabs)/index` | ✅ |
| Marketplace | `/marketplace` | `(tabs)/marketplace` | ✅ |
| Recherche + carte | `/search` | `(tabs)/search` | 🟡 Maps natif OK ; infinite scroll restant |
| Profil hub | `/profile` | `/profile/*` | ✅ |
| Panier | `/cart` | `/cart` | ✅ |
| Favoris | `/favoris` | `/favoris` | ✅ |
| Hub restauration | `/restauration` | `/restauration` | ✅ |

### Auth & compte

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Login email + OTP | `/login` | `(auth)/login` | ✅ |
| Inscription | `/register` | `(auth)/register` | ✅ |
| Paramètres | `/profile/settings` | `/profile/settings` | ✅ |
| Notifications | `/profile/notifications` | `/profile/notifications` | ✅ |
| Commandes / réservations / avis / fidélité / parrainage | `/profile/*` | `/profile/*` | 🟡 Lecture ✅ ; création avis ❌ |

### Commerce & livraison

| Écran PWA | Route web | App mobile | Statut |
|-----------|-----------|------------|--------|
| Checkout | `/checkout` | `/checkout` | ✅ |
| Paiement | `/checkout/payment` | `/payment` | ✅ Simulateur |
| Détail commande | `/profile/orders/[id]` | `/orders/[id]` | ✅ |
| Reçu | `.../receipt` | — | ❌ |
| Suivi livraison | `/delivery/track/[token]` | `/delivery/track/[token]` | ✅ |
| Réservation service | prestations | `ServicePrestationsTab` + `/bookings/*` | ✅ Simulateur paiement |

### Fiches établissement

| Vertical | PWA | Mobile | Statut |
|----------|-----|--------|--------|
| Boutique | `/m/[slug]/boutique` | `/m/[slug]/boutique` | ✅ |
| Hôtel / chambres | chambres | `HotelMerchantView` | ✅ |
| Service / spa | prestations | `ServiceMerchantView` | ✅ |
| Restauration | menu + table | menu ✅ ; table ❌ |

---

## 4. Stack technique (réel vs cible)

| Couche | Aujourd’hui | Cible Phase 1–3 |
|--------|-------------|-----------------|
| UI | StyleSheet + `src/theme` (Outfit, amber/slate) | Idem — pas NativeWind |
| Cartes | **`react-native-maps`** + tuiles **OpenStreetMap** | ✅ (sans Google Maps) |
| Images | **`expo-image`** via `AppImage` | 🟡 composants principaux |
| Push | enregistrement + routing au tap | ✅ |
| Erreurs | console | **Sentry** |
| Analytics | — | **PostHog RN** (parité web) |
| OTA | — | **expo-updates** (preview/prod) |
| Paiement | simulateur natif API | Mobile Money **post-stores** |

Tokens UI (`src/theme/index.ts`) :

- Brand : `#f59e0b` (500), `#d97706` (600), `#0f172a` (slate-900)
- Fond : `#FAFAFA` · surfaces blanches · coins `rounded-2xl` / pills boutons
- Profil : `profileTheme.ts` (slate nav active, amber accents)

---

## 5. Roadmap Phase 1 — finalisation consommateur

Ordre recommandé :

1. **Carte native** — remplacer WebView ; clustering markers ; rayon `SearchRadiusControl` ; intégration résultats search
2. **Push navigation** — `addNotificationResponseReceivedListener` + cold start ; payload `{ href, orderId, … }`
3. **Parité résiduelle** — avis (création), table resto, reçu commande, mot de passe oublié, SAV
4. **UI polish** — migration `expo-image` ; audit couleurs/spacing vs PWA ; infinite scroll search
5. **Qualité** — tests smoke Jest + 1 parcours Detox ; typecheck/lint en CI

**Hors scope Phase 1 :** paiement Mobile Money réel (simulateur conservé).

---

## 6. Livreur — recommandation : app séparée

### Décision retenue : **`apps/courier`** (listing store distinct)

| Critère | App séparée ✅ | Switch rôle dans `apps/mobile` |
|---------|----------------|--------------------------------|
| Permissions GPS background | Uniquement livreurs | Tous les installés |
| Taille APK / perf | Légère, ciblée | Bloat code consommateur + pro |
| Cycle de release | Hotfix livraison sans risque checkout | Régression croisée |
| Store & confiance | « LaPlasse Livreur » clair | Confusion persona |
| Onboarding | Flux dédié `/courier/onboarding` | Menus conditionnels complexes |

**Mitigation coût double app :** monorepo partagé (`api-client`, `shared-config`, `theme`, hooks Query). Même compte EAS, **deux projets** (`eas.json` par app). Pas de duplication métier.

**Alternative rejetée pour le MVP livreur :** switch rôle — acceptable seulement si équipe < 2 et volume livreurs très faible ; ne scale pas (permissions, review store, navigation).

Kick-off Phase 2 → créer **`Docs/MOBILE_COURIER_EVOLUTION.md`**.

---

## 7. Roadmap Phases 2 · 3 · 4

### Phase 2 — Livreur (`apps/courier`) — 3–4 sem.

| Écran | Priorité | Natif |
|-------|----------|-------|
| Onboarding / statut | P0 | ✅ |
| Dashboard + missions | P0 | ✅ |
| Accept / refus / statuts | P0 | ✅ |
| GPS foreground + background | P0 | `expo-location` + task manager |
| Push offre livraison | P0 | ✅ |
| Profil + gains | P1 | ✅ |
| Carte mission | P0 | `react-native-maps` |

### Phase 3 — Polish & stores — 2–3 sem.

- Deep links universels : `/m/*`, `/orders/*`, `/delivery/track/*`, push payloads
- Sentry + PostHog
- `expo-updates` OTA (preview channel)
- TestFlight + Play Internal → soumission CI/SN/BF
- CI : `pnpm --filter mobile lint typecheck test` + EAS build on tag

### Phase 4 — Module Pro marchand — 4–6 sem.

Entrée : tuile **« Espace Pro »** sur `/profile` si rôle marchand ; route group **`app/(pro)/`**.

| Écran natif | Priorité | Équivalent web |
|-------------|----------|----------------|
| Dashboard (CA, commandes du jour, alertes) | P0 | `/merchant` |
| Liste + détail commandes (accepter, préparer, prêt) | P0 | `/merchant/shop/orders` |
| Notifications commandes / réservations | P0 | push + in-app |
| Catalogue rapide (stock, visibilité) | P1 | `/merchant/shop/products` |
| Réservations / prestations | P1 | bookings merchant |
| Stats / analytics résumé | P1 | analytics |
| Promotions, ads | P2 | web fallback **exceptionnel** |

**UI Pro :** réutiliser tokens amber/slate ; barre Pro distincte (icône briefcase, fond slate-900 header) ; **aucune WebView** pour les flux P0/P1.

**Hors module Pro :** éditeur produit riche (TipTap), compta, admin — restent web responsive.

---

## 8. Builds & environnements

| Profil EAS | App | Usage | API |
|------------|-----|-------|-----|
| `development` | mobile / courier | Dev client | LAN |
| `preview` | mobile / courier | APK / TestFlight internal | `https://api.laplasse.tech/api` |
| `production` | mobile / courier | Stores | prod |

Setup : [MOBILE_EXPO_SETUP.md](./MOBILE_EXPO_SETUP.md)

---

## 9. Journal des jalons

| Date | Jalon |
|------|--------|
| 2026-06 | Rédaction stack recommandations |
| 2026-08-09 | Scaffold mobile, packages, EAS preview, home/marketplace |
| 2026-08-15 | Profil PWA complet, favoris, OTP, fiches verticales, réservations, suivi livraison |
| 2026-08-15 | Intégrations natives : `react-native-maps`, `expo-image`, push tap → navigation |

---

*Mettre à jour ce fichier à chaque jalon ; créer `MOBILE_COURIER_EVOLUTION.md` au kick-off Phase 2.*
