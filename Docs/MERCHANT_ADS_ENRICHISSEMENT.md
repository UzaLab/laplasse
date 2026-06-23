# Visibilité sponsorisée — `/merchant/ads`

> Analyse d'enrichissement et plan de mise en place efficace  
> Date : 2026-06-23 · Statut : **Phases 0–2 + début Phase 3** en dev

---

## État implémenté (2026-06-23)

| Brique | Statut |
|--------|--------|
| Migration `target_type`, `owner_id`, `shop_id`, `product_id` | ✅ Fichier migration prêt (`20260624200000_ad_campaign_targets`) |
| `GET /ads/eligibility` + suggestions | ✅ |
| `POST /ads/events` (impressions / clics, rate limit 60/min) | ✅ |
| Rendu SEARCH / FEATURED / CATEGORY filtré par placement | ✅ |
| `MARKETPLACE_FEATURED_PRODUCTS` sur carrousel featured | ✅ |
| Spotlight SHOP + legacy MERCHANT | ✅ |
| Wizard contextuel (`adsContext.ts` — 4 parcours) | ✅ |
| Onglets `/merchant/shop/visibility` + `/shop/manage/visibility` | ✅ |
| Tracking impressions (Intersection Observer) | ✅ spotlight + homepage featured |
| Stats résumé + CTR + suggestions cliquables | ✅ |
| Boutiques standalone éligibles (sans plan marchand) | ✅ |
| Tests unitaires ads | ✅ |
| Tests e2e (`pnpm test:e2e:ads`) | ✅ |
| Expiration campagnes (poll horaire + lazy) | ✅ |

---

## 1. Résumé exécutif

La page **`/merchant/ads`** permet aux marchands (plan **Growth+**) de lancer des campagnes payantes pour booster leur visibilité. Aujourd'hui, le modèle est **centré établissement (`Merchant`)** : une campagne active pose `is_sponsored = true` sur le marchand, ce qui influence recherche, homepage et spotlight marketplace de façon **globale et peu granulaire**.

L'objectif produit exprimé :

- Mettre en avant les **fiches d'établissement** (découverte, recherche, catégorie)
- Permettre aussi la mise en avant de **produits boutique** sur la marketplace
- Supporter les **boutiques liées à un établissement** ET les **boutiques standalone** (`Shop.merchant_id = null`)

**Recommandation** : passer d'un flag binaire `is_sponsored` à un **modèle de campagnes typées** (`target_type` + `target_id`) avec rendu par emplacement, sans casser l'existant admin (`marketplace_featured`, toggle admin `is_sponsored`).

---

## 2. État actuel (inventaire technique)

### 2.1 Frontend

| Élément | Fichier | État |
|--------|---------|------|
| Page marchand | `apps/web/src/app/merchant/ads/page.tsx` | Wizard 3 étapes (`MerchantAdsPanel`) |
| Onglet boutique | `apps/web/src/app/merchant/shop/visibility/page.tsx` | Campagnes SHOP / PRODUCT |
| Client API | `apps/web/src/lib/adsApi.ts` | eligibility, campaigns, events |
| Nav | `MerchantShell` → « Visibilité » | OK |
| Limites plan | `apps/web/src/lib/planLimits.ts` → `adsSelfService` | Growth / Scale = `true` |
| Badge sponsor | `MerchantCard`, `SpotCard`, `SpotlightShopsCarousel` | Badge amber si `is_sponsored` |

### 2.2 API

| Route | Rôle |
|-------|------|
| `GET /ads/eligibility` | Cibles disponibles (merchant, shops[], products[]) |
| `GET /ads/pricing` | Grille tarifaire par placement × durée |
| `GET /ads/campaigns?merchantId=&shopId=` | Liste campagnes du payeur |
| `POST /ads/campaigns` | Crée campagne + paiement simulé (body multi-cible) |
| `POST /ads/campaigns/confirm` | Confirme paiement → `ACTIVE` |
| `POST /ads/events` | Beacon impression/clic (public) |

Service : `apps/api/src/ads/ads.service.ts`

### 2.3 Modèle de données

```prisma
model AdCampaign {
  id          String
  merchant_id String          // ← toujours marchand, jamais shop/product
  placement   AdPlacement     // SEARCH | FEATURED | CATEGORY | MARKETPLACE
  status      AdCampaignStatus
  amount      Int
  starts_at / ends_at
  impressions / clicks        // champs présents, non alimentés
  payment_id
}
```

`Merchant.is_sponsored` : booléen global mis à `true` à l'activation **de toute** campagne.

### 2.4 Placements et rendu réel

| Placement | Tarifs (FCFA) | Où ça s'applique réellement aujourd'hui |
|-----------|---------------|----------------------------------------|
| `SEARCH` | 15k / 25k / 45k | Boost via `is_sponsored` dans `search.service.ts` (top 3 slots si vérifié) — **pas filtré par placement SEARCH** |
| `FEATURED` | 20k / 35k / 60k | `GET /merchants/featured` trie par `is_sponsored` — **pas de lien direct au placement FEATURED** |
| `CATEGORY` | 12k / 20k / 35k | Listing catégorie `/categories/[slug]` — boost campagnes `CATEGORY` actives (top 3) |
| `MARKETPLACE` | 18k / 30k / 55k | `listMarketplaceSpotlight()` filtre les campagnes `placement = MARKETPLACE` actives |

### 2.5 Écarts / bugs connus

1. **DTO validation** : `CreateAdCampaignDto` n'autorise pas `MARKETPLACE` dans `@IsIn([...])` alors que le front et le pricing l'exposent → risque 400 en production.
2. **Sémantique placement** : l'acheteur choisit un placement, mais l'effet est quasi toujours `is_sponsored` global.
3. **Pas de cible produit** : impossible de sponsoriser un SKU pour le carrousel « À la une » marketplace.
4. **Boutiques standalone** : pas de `merchant_id` → pas d'accès `/merchant/ads` (parcours marchand requis).
5. **Analytics** : `impressions` / `clicks` jamais incrémentés.
6. **Concurrence** : pas de limite de slots par ville/catégorie (sauf admin spotlight limit pour `marketplace_featured`).

---

## 3. Vision produit enrichie

### 3.1 Types de campagnes (cibles)

| Type | Code | Description | Exemples d'emplacements |
|------|------|-------------|-------------------------|
| Établissement | `MERCHANT` | Fiche marchand (découverte) | Recherche, homepage spots, catégorie verticale |
| Boutique | `SHOP` | Vitrine e-commerce | Carousel spotlight marketplace, header boutique |
| Produit | `PRODUCT` | SKU individuel | Carrousel « Produits à la une », recherche marketplace, fiche catégorie |

**Règle** : une campagne = **1 cible + 1 placement + 1 fenêtre temporelle**.

### 3.2 Parcours utilisateur cible

Le panneau publicitaire adapte les options selon **4 contextes** (détection auto route + auth) :

| Contexte | Route | Options disponibles |
|----------|-------|---------------------|
| Établissement seul | `/merchant/ads` (sans boutique liée) | Fiche établissement uniquement — recherche, accueil, catégorie |
| Établissement + boutique | `/merchant/ads` (avec boutique liée) | Fiche + boutique + produit |
| Boutique liée | `/merchant/shop/visibility` | Boutique + produit (boutique active) |
| Boutique standalone | `/shop/manage/visibility` | Boutique + produit (sans fiche établissement) |

Helper frontend : `apps/web/src/lib/adsContext.ts`

#### Marchand avec boutique liée

1. Ouvre `/merchant/ads`
2. Choisit **objectif** : « Ma fiche » | « Ma boutique » | « Un produit »
3. Si produit → picker depuis `/merchant/shop/products` (actifs, stock > 0)
4. Choisit **emplacement** (options filtrées selon objectif)
5. Durée + prix dynamique → paiement → confirmation
6. Dashboard campagne : statut, dates, impressions, clics, ROI estimé

#### Boutique standalone (sans fiche établissement)

- Nouvelle entrée : **`/shop/visibility`** ou onglet dans `ShopSectionLayout`
- Campagnes rattachées à `shop_id` + `owner_id` (pas `merchant_id`)
- Placements limités : `MARKETPLACE`, `PRODUCT_SEARCH`, pas `SEARCH`/`FEATURED` discovery

### 3.3 Emplacements recommandés (V2)

| Placement | Cible | Surface UI |
|-----------|-------|------------|
| `DISCOVERY_SEARCH` | MERCHANT | Résultats recherche `/search` |
| `DISCOVERY_FEATURED` | MERCHANT | Carousel homepage `/` |
| `DISCOVERY_CATEGORY` | MERCHANT | Listing catégorie `/c/[slug]` |
| `MARKETPLACE_SPOTLIGHT` | SHOP | `SpotlightShopsCarousel` |
| `MARKETPLACE_FEATURED_PRODUCTS` | PRODUCT | Carrousel `/marketplace` |
| `MARKETPLACE_CATEGORY` | PRODUCT | Grille catégorie produit |
| `SHOP_HERO` | SHOP | Bandeau top `/m/[slug]/boutique` (optionnel V2.1) |

Renommer les enums existants avec migration alias pour compatibilité :

- `SEARCH` → `DISCOVERY_SEARCH`
- `FEATURED` → `DISCOVERY_FEATURED`
- `CATEGORY` → `DISCOVERY_CATEGORY`
- `MARKETPLACE` → `MARKETPLACE_SPOTLIGHT`

---

## 4. Architecture cible

### 4.1 Schéma Prisma proposé

```prisma
enum AdTargetType {
  MERCHANT
  SHOP
  PRODUCT
}

enum AdPlacement {
  DISCOVERY_SEARCH
  DISCOVERY_FEATURED
  DISCOVERY_CATEGORY
  MARKETPLACE_SPOTLIGHT
  MARKETPLACE_FEATURED_PRODUCTS
  MARKETPLACE_CATEGORY
}

model AdCampaign {
  id           String
  owner_id     String              // User payeur
  merchant_id  String?             // nullable — standalone shop
  shop_id      String?             // cible ou contexte boutique
  product_id   String?             // si target = PRODUCT
  target_type  AdTargetType
  placement    AdPlacement
  status       AdCampaignStatus
  amount       Int
  starts_at    DateTime
  ends_at      DateTime
  impressions  Int @default(0)
  clicks       Int @default(0)
  payment_id   String?
  metadata     Json?               // ville, catégorie, créatif

  @@index([target_type, placement, status, ends_at])
  @@index([shop_id, status])
  @@index([product_id, status])
}
```

**Déprécier progressivement** `Merchant.is_sponsored` : le calcul devient dérivé (`EXISTS campagne ACTIVE DISCOVERY_*`) pour éviter les désynchronisations.

### 4.2 Services

```
AdsService
├── resolveTarget(userId, dto)        // vérifie ownership merchant/shop/product
├── createCampaign(dto)
├── confirmPayment(paymentId)
├── expireCampaigns()                 // cron / lazy
├── getActiveCampaigns(placement, ctx) // ville, catégorie, shop…
└── recordEvent(campaignId, IMPRESSION|CLICK)

MarketplaceService.listMarketplaceSpotlight()
  → merge admin featured + AdCampaign MARKETPLACE_SPOTLIGHT (SHOP)

MarketplaceService.listFeaturedProducts()
  → merge admin + AdCampaign MARKETPLACE_FEATURED_PRODUCTS (PRODUCT)

SearchService.searchMerchants()
  → inject sponsored MERCHANT ids from DISCOVERY_SEARCH (plus is_sponsored legacy)

MerchantsService.featured()
  → inject DISCOVERY_FEATURED campaigns
```

### 4.3 API REST (V2)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/ads/eligibility` | Cibles disponibles (merchant, shops[], products[]) |
| GET | `/ads/pricing?target=&placement=` | Prix dynamique |
| GET | `/ads/campaigns` | Filtres `merchantId`, `shopId` |
| POST | `/ads/campaigns` | Body enrichi (voir DTO) |
| POST | `/ads/campaigns/:id/pause` | Pause manuelle (Scale+) |
| GET | `/ads/campaigns/:id/stats` | Impressions, clics, CTR |
| POST | `/ads/events` | Beacon impression/clic (public, signé) |

**DTO création V2**

```typescript
{
  target_type: 'MERCHANT' | 'SHOP' | 'PRODUCT'
  target_id: string
  placement: AdPlacement
  duration_days: 7 | 14 | 30
  // optionnel V2.1
  geo_city_id?: string
  category_slug?: string
}
```

### 4.4 Frontend `/merchant/ads` (refonte UI)

Structure recommandée (alignée `ShopSectionLayout` / `MerchantMenuPanel`) :

1. **Hero + plan gate** — CTA upgrade si Starter
2. **Stepper campagne** — Objectif → Emplacement → Durée → Paiement
3. **Preview live** — mockup carte spot / produit
4. **Historique** — table avec statuts, dates, stats
5. **Onglet boutique** — si `user.shops` standalone sans merchant

Composants :

- `MerchantAdsPanel.tsx` (marchand)
- `ShopVisibilityPanel.tsx` (standalone, dans shop section)
- `AdCampaignWizard.tsx` (partagé)
- `AdCampaignCard.tsx`

---

## 5. Règles métier

### 5.1 Éligibilité

| Cible | Conditions |
|-------|------------|
| MERCHANT | `verification_status = VERIFIED`, `is_active`, plan Growth+ |
| SHOP | `status = ACTIVE`, ≥1 produit ACTIVE, plan Growth+ (via merchant lié ou plan shop owner) |
| PRODUCT | Produit ACTIVE, stock > 0, boutique ACTIVE |

### 5.2 Limites anti-spam UX

- **DISCOVERY_SEARCH** : max 3 sponsors par page résultats (déjà partiellement fait)
- **MARKETPLACE_SPOTLIGHT** : respecter `platformSetting marketplace_spotlight_limit` (défaut admin)
- **MARKETPLACE_FEATURED_PRODUCTS** : max 8 produits sponsorisés simultanés en homepage
- **1 campagne active max** par couple `(target_id, placement)` — renouvellement = extension de `ends_at`

### 5.3 Tarification

Conserver la grille actuelle comme base, ajouter coefficients :

| Facteur | Coefficient suggéré |
|---------|---------------------|
| Cible PRODUCT | ×0.7 vs SHOP |
| Cible SHOP marketplace | ×1.0 |
| Cible MERCHANT discovery | ×1.2 |
| Ville Abidjan | ×1.0 (référence) |
| Autres villes | ×0.8 (phase 1) |

### 5.4 Paiement & expiration

- Réutiliser `PaymentTransaction` (`purpose: AD_CAMPAIGN`)
- `expireCampaigns()` : poll horaire au démarrage API + appel lazy à chaque lecture
- Ne plus toggler `is_sponsored` globalement ; calcul runtime

---

## 6. Plan de mise en place (phases)

### Phase 0 — Correctifs rapides (1–2 j)

- [x] Fix DTO : autoriser `MARKETPLACE` dans `CreateAdCampaignDto`
- [x] Refonte UI minimale `/merchant/ads` (cohérence MerchantShell, toasts, empty states)
- [x] Filtrer rendu SEARCH/FEATURED par `placement` réel au lieu du seul `is_sponsored`
- [x] Tests unitaires : pricing, recordEvent, confirmPayment
- [x] Tests e2e : création campagne → paiement → apparition spotlight (`scripts/e2e-ads-campaign.ts`)

### Phase 1 — Modèle multi-cible (1 sprint)

- [x] Migration Prisma `target_type`, `shop_id`, `product_id`, `owner_id`
- [x] `GET /ads/eligibility`
- [x] Wizard 3 étapes marchand
- [x] `MARKETPLACE_FEATURED_PRODUCTS` sur carrousel existant
- [x] Tracking impressions (Intersection Observer + `POST /ads/events`)

### Phase 2 — Boutiques standalone (0.5 sprint)

- [x] `/merchant/shop/visibility` + onglet shop
- [x] Campagnes `shop_id` sans `merchant_id` obligatoire
- [x] Facturation au `owner_id`

### Phase 3 — Analytics & optimisation (1 sprint)

- [x] Dashboard stats campagne (résumé + CTR par campagne)
- [x] Suggestions dans eligibility (produit/boutique/fiche sans campagne active)
- [ ] A/B créatif (image produit vs logo shop)
- [ ] Limites dynamiques admin

### Phase 4 — Monétisation avancée (backlog)

- [ ] Enchères second prix par emplacement
- [ ] Pack multi-placements (-15 %)
- [ ] Crédits pub inclus plan Scale
- [ ] WhatsApp « booster ma promo du jour »

---

## 7. Impacts transverses

| Domaine | Impact |
|---------|--------|
| **Plans** | `adsSelfService` reste Growth+ ; envisager quota campagnes/mois par plan |
| **Admin** | Console campagnes, modération, override spotlight |
| **Search / Meilisearch** | Index champs `sponsored_placements[]` ou requête post-filter |
| **Marketplace** | `fetchFeaturedProducts`, `listMarketplaceSpotlight` à fusionner campagnes + admin |
| **Analytics** | Events `ad_impression`, `ad_click` (GA + interne) |
| **Docs** | MAJ `REGLES_DEVELOPPEMENT.md`, critères acceptance DN |

---

## 8. Critères d'acceptation V2 (MVP enrichi)

1. Un marchand retail peut sponsoriser **un produit** et le voir dans le carrousel marketplace sous 5 min après paiement.
2. Un marchand restaurant peut sponsoriser **sa fiche** en recherche sans affecter le spotlight boutique (séparation placements).
3. Une **boutique standalone** peut lancer une campagne `MARKETPLACE_SPOTLIGHT` sans fiche établissement.
4. Les campagnes expirées disparaissent automatiquement des surfaces publiques.
5. Le marchand voit impressions/clics sur `/merchant/ads`.
6. Aucune régression sur le toggle admin `marketplace_featured` et `is_sponsored` manuel.

---

## 9. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| UX surchargée de badges « Sponsorisé » | Limiter densité par page, label discret, max 3 en search |
| Fraude clics | Rate limit events, fingerprint session, filtrage bots |
| Dette `is_sponsored` | Migration calculée + période dual-read |
| Standalone vs merchant confusion | Wizard contextualisé, copy claire |
| Performance spotlight | Cache Redis 5 min sur `getActiveCampaigns` |

---

## 10. Fichiers à modifier (checklist dev)

### Backend

- `apps/api/prisma/schema.prisma`
- `apps/api/src/ads/ads.service.ts`
- `apps/api/src/ads/dto/ad.dto.ts`
- `apps/api/src/ads/ad-pricing.ts`
- `apps/api/src/marketplace/marketplace.service.ts` (featured products, spotlight)
- `apps/api/src/search/search.service.ts`
- `apps/api/src/merchants/merchants.service.ts` (featured)

### Frontend

- `apps/web/src/app/merchant/ads/page.tsx`
- `apps/web/src/features/merchant/components/MerchantAdsPanel.tsx` ✅
- `apps/web/src/app/merchant/shop/visibility/page.tsx` ✅
- `apps/web/src/features/merchant/components/shop/ShopSectionLayout.tsx` (onglet Visibilité) ✅
- `apps/web/src/lib/adsApi.ts` ✅
- `apps/web/src/hooks/useAdImpression.tsx` ✅
- `apps/web/src/features/marketplace/components/SpotlightShopsCarousel.tsx`
- `apps/web/src/features/marketplace/components/MarketplacePageClient.tsx`
- `apps/web/src/lib/planLimits.ts` (quotas futurs)

---

## 11. Conclusion

La brique **ads self-service** est fonctionnelle de bout en bout (wizard, paiement simulé, rendu par placement, tracking, suggestions). **Prochaine étape** : limites admin dynamiques et A/B créatif (Phase 3 restante).
