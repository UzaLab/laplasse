# LaPlasse — Analyse produit & roadmap V2+

> Audit du parcours web (juin 2026) — marketplace, flux, UX, modules verticaux.  
> Complète `REGLES_DEVELOPPEMENT.md` (état livré) et les Tomes (vision long terme).

**Version :** 2.1  
**Date :** 19 juin 2026 (MAJ Phase 9 — 21 juin 2026)  
**Statut :** Document de référence produit — recommandations priorisées + journal d'exécution §14

---

## Table des matières

1. [Synthèse exécutive](#1-synthèse-exécutive)
2. [État des lieux — moteurs produit](#2-état-des-lieux--moteurs-produit)
3. [Cartographie des parcours](#3-cartographie-des-parcours)
4. [Lacunes UX transverses](#4-lacunes-ux-transverses)
5. [Marketplace 100 % — recommandations priorisées](#5-marketplace-100--recommandations-priorisées)
6. [Modules verticaux activables](#6-modules-verticaux-activables)
7. [Optimisations UX rapides](#7-optimisations-ux-rapides)
8. [Architecture cible](#8-architecture-cible)
9. [Roadmap d'exécution suggérée](#9-roadmap-dexécution-suggérée)
10. [Top 5 priorités absolues](#10-top-5-priorités-absolues)
11. [Multi-pays — Afrique de l'Ouest](#11-multi-pays--afrique-de-louest)
12. [Catégories produits, codes promo & zones de livraison](#12-catégories-produits-codes-promo--zones-de-livraison)
13. [Références code & routes](#13-références-code--routes)
14. [Journal d'exécution locale V2](#14-journal-dexécution-locale-v2)

---

## 1. Synthèse exécutive

LaPlasse n'est plus un simple annuaire local : c'est une **plateforme modulaire** avec trois moteurs qui coexistent aujourd'hui :

| Moteur | Maturité | Description |
|--------|----------|-------------|
| **Discovery** | Mature | Recherche établissements, fiches, avis, favoris, WhatsApp |
| **Marketplace retail** | V1.6 fonctionnelle | Shop, produits, panier multi-boutiques, checkout 4 étapes, commandes |
| **Booking vertical** | Fonctionnel (sans paiement) | Table / chambre / RDV / consultation — parcours client + marchand bout-en-bout |

Le tunnel **achat produit** est bout-en-bout (simulateur de paiement). Ce qui manque pour rivaliser avec de grandes plateformes e-commerce et des acteurs verticaux (Glovo, Airbnb, Planity…) n'est pas le squelette technique — c'est la **profondeur métier**, le **paiement réel**, la **logistique** et des **modules activables par vertical**.

**Principe directeur (Tome 3) :** *Modular First* — chaque commerce active uniquement les modules dont il a besoin.

**Enjeu transversal V2+ :** expansion **multi-pays Afrique de l'Ouest** (§11) ; **catalogue marketplace** (catégories produit, codes promo, zones livraison par commune) — §12.

---

## 2. État des lieux — moteurs produit

### 2.1 Discovery (V0.5 → V1.0) — ✅ mature

- Homepage, recherche Meilisearch, catégories, fiches `/m/[slug]`
- Avis modérés, favoris établissements, OTP marchand, trust score
- SEO (sitemap, JSON-LD), analytics marchand (vues, clics)

### 2.2 Marketplace ecommerce (V1.5 → V1.6) — ✅ fonctionnelle, ⚠️ simulateur

**Livré :**
- Entité `Shop` modulaire, dashboard `/merchant/shop/*`
- Produits, variantes, images multiples (max 10), composition
- Modes retrait/livraison par produit (`allow_pickup`, `allow_delivery`)
- Panier multi-boutiques, split commande + paiement par boutique
- Checkout 4 URLs : `/cart` → `/checkout` → `/checkout/payment` → `/checkout/confirmation`
- Marketplace spotlight, vitrines `/m/[slug]/boutique` et `/boutique/[slug]`

**Limites actuelles :**
- Paiement **simulateur** uniquement (`PaymentProvider.SIMULATOR`)
- Frais livraison par zones marchand (§12.4) ✅ — moteur delivery **V3.0 MVP** (statuts + tracking token) ; dispatch auto / GPS ⏳
- Avis **produits** ✅ + modération admin ✅
- Remboursements transition `REFUNDED` côté marchand ✅ — pas de reversement Mobile Money

### 2.3 Booking vertical (V1.0 → V1.8) — ✅ fonctionnel, ⚠️ sans paiement MM

Mapping catégorie → type : `apps/api/src/common/booking-config.ts`

| Vertical | Catégories | Type booking | Maturité |
|----------|------------|--------------|----------|
| Restauration | restaurants, fast-food, cafes, bars-lounges | `TABLE` | Menu structuré ✅, fiche onglets ✅, réservation table ✅, formulaire + créneaux ✅ |
| Hôtels | hotels | `ROOM` | Chambres + calendrier mois ✅, plage dates ✅, tarif/nuit + total séjour ✅, dispo multi-nuits API ✅, tarifs dynamiques week-end/saison ✅ |
| Beauté / fitness | beaute, fitness | `APPOINTMENT` | Staff + prestations ✅, fiche onglets ✅, réservation + modification ✅ |
| Pharmacie / défaut | pharmacies, … | `CONSULTATION` | RDV + consultations seed ✅, fiche onglets ✅, modification service ✅ |
| Retail | boutiques | — | Booking désactivé, focus shop |

**Parcours client :** réservation depuis fiche `/m/[slug]` (vertical-aware) → compte lié via cookie httpOnly → `/profile/bookings` (liste par vertical, fiche détail, modifier/annuler).

**Parcours marchand :** `/merchant/bookings` — filtres statut/type/recherche, vue liste + agenda, fiche détail, actions (confirmer, refuser, terminer, absent, annuler), contact client, tarifs hôtel estimés.

**Limites restantes :** pas de paiement à la réservation ; rappels SMS/WhatsApp simulés (logs + wa.me) en attendant provider ; enrichissement tarif hôtel legacy via `room_type` si `service_id` absent (API ✅).

---

## 3. Cartographie des parcours

### 3.1 Parcours acheteur (discovery → post-achat)

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌────────┐
│  Discovery  │───▶│ Boutique /   │───▶│   Panier    │───▶│Checkout│
│ /, /search  │    │ Fiche produit│    │   /cart     │    │ 4 étapes│
└─────────────┘    └──────────────┘    └─────────────┘    └───┬────┘
                                                               │
                    ┌──────────────┐    ┌─────────────────────▼──┐
                    │ Confirmation │◀───│ Paiement (simulateur)  │
                    │ /confirmation│    │ /checkout/payment      │
                    └──────┬───────┘    └────────────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Profil       │
                    │ /profile/    │
                    │ orders       │
                    └──────────────┘
```

#### Routes clés

| Étape | Route | API / composant |
|-------|-------|-----------------|
| Catalogue global | `/marketplace` | `MarketplacePageClient.tsx`, `GET /marketplace/products` |
| Vitrine boutique | `/m/[slug]/boutique`, `/boutique/[slug]` | `BoutiquePageClient.tsx`, `GET /shops/:slug/products` |
| Fiche produit | `/m/[slug]/p/[productSlug]` | Galerie, variantes, cross-sell |
| Panier | `/cart` | `cartStore.ts`, `GET/POST /cart` |
| Livraison | `/checkout` | `POST /orders/checkout`, `checkoutSession.ts` |
| Paiement | `/checkout/payment` | `confirm-batch` ou `confirm` |
| Confirmation | `/checkout/confirmation?status=` | Tracking PostHog, récap commande |
| Post-achat | `/profile/orders`, `/profile/orders/[id]` | `GET /orders/mine` |

#### Forces

- Checkout en 4 URLs distinctes (analytics)
- Variantes, galerie multi-images, cross-sell « même boutique »
- Résumé commande **avant** simulateur paiement en mobile
- Panier multi-boutiques avec paiement batch

#### Frictions critiques

| Friction | Impact |
|----------|--------|
| Auth obligatoire avant ajout panier | Friction conversion (pas de guest checkout) |
| Code promo panier UI non branché | Confiance utilisateur |
| Promotions marchand non appliquées checkout | Feature existante inutilisée |
| Frais livraison jamais calculés | Panier trompeur |
| Un seul mode livraison pour panier multi-boutiques | Incohérence multi-vendeurs |
| Paiement simulateur sans retry | Commandes PENDING orphelines |
| « Suivre commande » = WhatsApp | Pas de suivi in-app |
| Cœur favoris produit décoratif | UX incohérente |
| `/search` = établissements ; produits = `/marketplace` | Confusion découvrabilité |
| Session checkout perdue si refresh | Abandon |

---

### 3.2 Parcours marchand ecommerce

```
Register → merchant/signup → verify-phone → dashboard
    → shop/create (DRAFT) → produits → settings (ACTIVE) → shop/orders
```

#### Routes clés

| Zone | Routes |
|------|--------|
| Onboarding | `/merchant/signup`, `/merchant/verify-phone` |
| Hub boutique | `/merchant/shop` |
| Catalogue | `/merchant/shop/products`, `/new`, `/[id]/edit` |
| Commandes | `/merchant/shop/orders` |
| Paramètres | `/merchant/shop/settings`, `/merchant/shop/promotions` |
| Legacy (redirect) | `/merchant/products` → `/merchant/shop/products` |

#### Workflow commandes marchand

```
PENDING → CONFIRMED → PREPARING → READY → COMPLETED
                              └── CANCELLED
```

> Statut `REFUNDED` en schéma Prisma — **aucun flow UI/API** aujourd'hui.

#### Frictions marchand

- Passage DRAFT → ACTIVE manuel, sans wizard « publier ma boutique »
- Pas d'alerte stock bas / rupture
- Pas de collections, tags, menu structuré (food)
- Analytics = vues/clics, pas funnel e-commerce (conversion, panier abandonné)
- Promotions créées mais sans effet sur les ventes checkout

---

### 3.3 Parcours booking (parallèle à l'e-commerce)

| Acteur | Route | API / composants |
|--------|-------|------------------|
| Client | `/m/[slug]` (`BookingForm`, onglets vertical) | `POST /bookings/merchant/:id` (cookie user optionnel) |
| Client | `/profile/bookings` | `GET /bookings/mine`, `BookingDetailSheet`, `EditBookingModal`, `bookingDisplay.ts` |
| Marchand | `/merchant/bookings` | `GET /bookings/merchant`, `MerchantBookingDetailSheet`, `PATCH /bookings/:id/status` |
| Marchand (GROWTH+) | `/merchant/offerings` | Services, staff, chambres, blocs dispo |
| API dispo | — | `GET …/availability`, `GET …/room-calendar`, `availability.service` (nuits chambre) |

**Limites :** pas de paiement à la réservation, pas de menu restaurant intégré à la commande food (flux food = panier miroir séparé).

---

## 4. Lacunes UX transverses

| Zone | Problème | Priorité |
|------|----------|----------|
| **Mobile nav** | Pas de raccourci Panier / Marketplace dans bottom nav | Haute |
| **Erreurs réseau** | Fetch silencieux (`null`) sans message ni retry | Haute |
| **Empty states** | Marketplace catalogue vide — CTA vendeur faible | Moyenne |
| **Favoris produits** | Icônes Heart sans handler | Moyenne |
| **Facture** | Bouton « Bientôt disponible » sur détail commande | Moyenne |
| **Recherche unifiée** | Établissements vs produits séparés | Haute |
| **Onboarding shop** | Pas de checklist publication | Moyenne |
| **Fiche établissement** | CTAs contextualisés par vertical | ✅ (`MerchantContextualCTAs`, onglets vertical) |
| **Copy marque multipays** | Textes « ivoirien / Abidjan » en dur dans l'UI globale | ✅ `brandCopy.ts` + ville dynamique ; quartiers search via API geo ✅ |

---

## 5. Marketplace 100 % — recommandations priorisées

Alignement avec les standards Amazon, Jumia, Shopify, etc.

### P0 — Indispensable marketplace « réelle » (4–8 semaines)

| # | Feature | Description | Réf. code existant |
|---|---------|-------------|-------------------|
| 1 | **Mobile Money réel** | Wave, Orange Money, MTN — webhooks, statuts paiement | `PaymentProvider.SIMULATOR` → à remplacer/étendre |
| 2 | **Promotions au checkout** | Appliquer `Promotion` (PERCENTAGE/FIXED) au panier | `promotions/` module + UI `/merchant/shop/promotions` |
| 3 | **Zones livraison personnalisées** | Ville + commune, tarif/délai/véhicule par boutique | §12.4 |
| 4 | **Timeline commande client** | Statuts visibles + notifications in-app/push | `OrderStatus`, `/profile/orders/[id]` |
| 5 | **Paiement retry** | Lien « payer à nouveau » sur commande PENDING | `PaymentTransaction` PENDING |
| 6 | **Adresses sauvegardées** | Modèle `UserAddress`, sélection checkout | `/checkout` formulaire actuel |
| 7 | **Code promo panier** | Brancher UI existante ou retirer | `/cart` page |
| 8 | **Recherche unifiée** | Produits + établissements dans `/search` ou barre globale | Meilisearch index `merchants` seulement aujourd'hui |

### P1 — Parité grandes marketplaces (2–3 mois)

| # | Feature | Référence marché |
|---|---------|------------------|
| 9 | Avis produits (distincts avis établissement) | Amazon, Jumia |
| 10 | Wishlist produits | Favoris ≠ wishlist |
| 11 | Remboursements partiels/total | Flow marchand + `REFUNDED` |
| 12 | Facture PDF / reçu | Bouton déjà en UI |
| 13 | Alertes stock marchand | Seuil + notification |
| 14 | Collections / catégories produit | §12.1 — taxonomie admin + collections shop |
| 15 | Guest checkout OTP téléphone | Standard Afrique |
| 16 | Split livraison multi-boutiques | Mode + adresse par vendeur |
| 17 | Analytics e-commerce marchand | Conversion, abandon panier, top produits |
| 18 | Order again / réachat 1 clic | `/profile/orders` |

### P2 — Différenciation & scale (3–6 mois)

| # | Feature |
|---|---------|
| 19 | Recommandations produits (collaboratif + catégorie) |
| 20 | Fidélité liée aux achats (XP commande — aujourd'hui review/favori only) |
| 21 | Recently viewed / comparateur |
| 22 | Export commandes CSV marchand |
| 23 | Multi-langue FR + EN |
| 24 | PWA offline-lite (cache catalogue, reprise checkout) |

### Matrice fonctionnalités e-commerce

| Feature standard | État LaPlasse (juin 2026) |
|------------------|---------------------------|
| Panier multi-vendeurs | ✅ |
| Variantes produit | ✅ |
| Images multiples | ✅ |
| Checkout structuré | ✅ (4 étapes) |
| Paiement réel | ❌ Simulateur |
| Coupons checkout | ✅ Promos + code panier |
| Catégories produit marketplace | ✅ ProductCategory + admin |
| Frais livraison | ✅ Zones par commune (§12.4) |
| Avis produits | ✅ + modération admin |
| Wishlist produits | ✅ ProductFavorite |
| Remboursements | ⚠️ Statut `REFUNDED` marchand — pas reversement MM |
| Guest checkout | ✅ OTP téléphone |
| Suivi livraison temps réel | ⚠️ Timeline + `/delivery/track/:token` — pas GPS |
| Facture PDF | ✅ Reçu imprimable navigateur |
| Recherche produits globale | ✅ Recherche unifiée `/search` |

---

## 6. Modules verticaux activables

### 6.1 Modèle cible — capabilities par établissement

```
Merchant / Shop
├── module_catalog       (retail, produits génériques)
├── module_menu          (restaurant — type Glovo)
├── module_delivery      (logistique last-mile)
├── module_table_booking (réservation table)
├── module_room_booking  (hôtel — type Airbnb)
├── module_appointment   (beauté, services)
└── module_consultation  (pharmacie, médical)
```

Chaque module s'active selon `category.slug` + choix marchand (feature gating plan).

---

### 6.2 Module RESTAURANT — type Glovo / Uber Eats

**État actuel :** menu structuré API + dashboard `/merchant/menu` ; fiche `/m/[slug]` onglet **Menu & carte** (plus de page séparée).

| Capacité | Priorité | Détail | Statut |
|----------|----------|--------|--------|
| Menu structuré | P0 vertical | Catégories (Entrées, Plats, Boissons) — distinct du catalog retail | ✅ |
| Fiche établissement — onglets vertical | P0 UX | `[Vertical]` · Informations · Horaires · Galerie | ✅ |
| Modificateurs | P1 | Suppléments, sauces, tailles — groupes/options par plat | ✅ |
| Flux commande food dédié | P0 | Menu → panier → adresse → paiement → suivi (UX ≠ retail) | ⏳ |
| Temps préparation / ETA | P1 | Affiché avant validation commande | ⏳ |
| Statuts livraison | P0 | `OUT_FOR_DELIVERY`, `DELIVERED` | ✅ |
| Suivi temps réel | P2 | Phase 1 : timeline ✅ ; Phase 2 : carte GPS livreur | ⚠️ |
| Frais distance | P1 | Calcul quartier → quartier (zones commune ✅) | ⚠️ |
| Commande sans compte | P1 | OTP SMS | ✅ |
| Onglets Commander / Réserver | Quick win UX | CTAs sidebar → onglets fiche | ✅ |

---

### 6.3 Module HÔTEL / RÉSIDENCE — type Airbnb / Booking.com

**État actuel :** booking `ROOM`, chambres seed, calendrier 14j API + onglet **Chambres** fiche établissement.

| Capacité | Priorité | Détail | Statut |
|----------|----------|--------|--------|
| Calendrier disponibilité | P0 vertical | Vue mois par chambre/type | ✅ `MerchantHotelTab` + API `room-calendar` |
| Tarification affichée | P0 | Prix/nuit × nuits = total avant confirmation | ✅ `BookingForm`, fiches profil/marchand |
| Tarification dynamique | P0 | Prix par nuit, week-end, saison | ⏳ `nightly_rate` fixe par service |
| Min stay / restrictions | P1 | Nuits minimum, jours check-in | ⏳ |
| Paiement à la réservation | P0 | Acompte ou total via MM | ⏳ (bloqué MM) |
| Fiche hébergement riche | P1 | Équipements, règles, annulation, photos/chambre | ⏳ |
| Gestion ménage | P2 | Statuts : disponible, occupée, nettoyage | ⏳ |
| Channel manager | P3 | Sync iCal / OTAs | ⏳ |

**Quick win :** ~~date range picker + prix total calculé~~ ✅ livré (`MerchantHotelTab`, `getBookingPricing`).

---

### 6.4 Module BEAUTÉ / SERVICES — type Planity / Fresha

**État actuel :** le plus avancé (staff, prestations, créneaux, blocs dispo).

| Capacité | Priorité | Détail |
|----------|----------|--------|
| Acompte réservation | P1 | Paiement MM partiel |
| Rappels SMS/WhatsApp auto | P1 | Exploiter `reminder_sent_at` |
| File d'attente walk-in | P2 | |
| Forfaits / abonnements client | P2 | |
| Politique no-show | P1 | Pénalité configurable |

---

### 6.5 Module RETAIL / BOUTIQUE — type Shopify / Jumia

**État actuel :** le plus proche du complet — prioriser P0/P1 section 5.

| Capacité | Priorité | Détail |
|----------|----------|--------|
| Collections, tags, SEO produit | P1 | |
| Retours SAV structuré | P1 | Au-delà de WhatsApp |
| Inventaire multi-entrepôt | P2 | |
| Ventes flash / countdown | P2 | |

---

### 6.6 Module PHARMACIE / CONSULTATION

**État actuel :** booking `CONSULTATION` basique.

| Capacité | Priorité | Détail |
|----------|----------|--------|
| Upload ordonnance | P2 | |
| Catalogue OTC réglementé | P2 | |
| Téléconsultation | P3 | |

---

### 6.7 Matrice verticaux vs plateformes de référence

| Capacité | Glovo | Airbnb | Planity | Jumia | LaPlasse |
|----------|-------|--------|---------|-------|----------|
| Catalogue produits | ✅ | — | — | ✅ | ✅ |
| Paiement MM | ✅ | ✅ | ✅ | ✅ | ❌ simulé |
| Suivi livraison GPS | ✅ | — | — | ⚠️ | ⚠️ token only |
| Calendrier tarifaire | — | ✅ | ✅ | — | ✅ mois + total |
| Réservation + paiement | — | ✅ | ✅ | — | ⚠️ réservation ✅, paiement ⏳ |
| Menu structuré food | ✅ | — | — | — | ✅ |
| Avis produits | ✅ | ✅ | ✅ | ✅ | ✅ |
| Promotions checkout | ✅ | — | ✅ | ✅ | ✅ |
| Fiche vertical intégrée | ✅ | ✅ | ✅ | — | ✅ onglets |

---

## 7. Optimisations UX rapides

Changements à fort impact, faible refonte backend :

1. **Navigation mobile** — ajouter Marketplace + Panier dans `MobileBottomNav`
2. **Wizard publication boutique** — checklist : logo → 3 produits → activer → partager lien
3. **Empty states actionnables** — marketplace vide → CTA « devenir vendeur »
4. **Erreurs réseau explicites** — toasts + bouton retry (remplacer fetch silencieux)
5. ~~**Fiche établissement contextualisée**~~ — ✅ CTAs + onglets vertical
6. ~~**Favoris produits**~~ — ✅ branchés
7. **Funnels PostHog** — mesurer abandon par étape checkout (URLs déjà distinctes)
8. **Onboarding marchand vertical** — pack modules proposé à l'inscription selon catégorie
9. **Copy multipays** — ✅ ton « excellence locale » ; reste : quartiers search dynamiques par ville/pays

---

## 8. Architecture cible

```
                    ┌─────────────────────────────────┐
                    │     LaPlasse Core Platform      │
                    │  Auth · Search · Trust · Notif  │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │   Country Tenant Layer (V2.4)   │
                    │  bf.* / ci.* · XOF · villes · MM  │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────┬───────────┼───────────┬───────────────┐
        ▼               ▼           ▼           ▼               ▼
   Discovery      Marketplace   Payments    Booking Engine   Delivery Engine
   (mature)       (V1.6→V2)     (simulateur  (partiel)        (à créer)
                                   → MM)
        │               │                       │               │
        └───────────────┴───────────────────────┴───────────────┘
                                    │
                    Modules activables par Merchant / Shop
              ┌─────────┬─────────┬─────────┬─────────┬─────────┐
              │ Catalog │  Menu   │  Room   │  Table  │ Delivery│
              │ (retail)│ (Glovo) │(Airbnb) │ (resto) │ (Glovo) │
              └─────────┴─────────┴─────────┴─────────┴─────────┘
```

### Évolution schéma suggérée (indicatif)

```prisma
// Voir §12 pour le modèle complet DeliveryZone + géographie
model Shop {
  enabled_modules  String[]  // catalog, menu, delivery, ...
}
```

> Détail : [§12.4 Zones de livraison](#124-zones-de-livraison-personnalisées--spécification)

---

## 9. Roadmap d'exécution suggérée

| Version | Focus | Livrables | Résultat |
|---------|-------|-----------|----------|
| **V2.0** | Transactions réelles | MM réel, promos checkout, **zones livraison**, catégories produit, timeline commande | Marketplace crédible |
| **V2.1** | Module Glovo MVP | Menu restaurant, statuts livraison, OTP guest, onglets Commander/Réserver | Food delivery crédible |
| **V2.2** | Module Airbnb MVP | Calendrier hôtel, tarifs/nuit, paiement réservation chambre | Hébergement crédible |
| **V2.3** | Parité e-commerce | Avis/wishlist produits, remboursements, factures PDF | Retail complet |
| **V2.4** | Multi-pays UEMOA | Sous-domaines, `Country` tenant, villes BF/SN, paiements locaux | Expansion ouest-africaine |
| **V3.0** | Scale plateforme | Delivery engine (coursiers, GPS), channel manager, analytics funnel | Plateforme multi-verticale |

### Numérotation

- **REGLES / exécution :** V1.6 = shop modulaire actuel ; **V2.0** = prochaine slice majeure (transactions réelles).
- **Tomes / stratégie :** V2.0 = ecosystem platform — aligner les deux référentiels lors de la clôture V2.0.

---

## 10. Top 5 priorités absolues

Pour passer de « V1.6 démo solide » à « marketplace + verticaux crédibles » :

| Rang | Chantier | Pourquoi |
|------|----------|----------|
| **1** | Mobile Money réel | Sans paiement, tout est vitrine |
| **2** | **Zones livraison + promos checkout** | Tarifs commune, codes promo — voir [§12](#12-catégories-produits-codes-promo--zones-de-livraison) |
| **3** | Suivi commande structuré (timeline + notifs) | Remplace dépendance WhatsApp post-achat |
| **4** | Module Menu Restaurant | Première brique Glovo |
| **5** | ~~Calendrier + tarification hôtel~~ | ✅ MVP livré — reste tarifs dynamiques / paiement séjour |

Le socle (Shop modulaire, checkout 4 étapes, booking engine, multi-boutiques) est **suffisant pour absorber ces modules** sans refonte totale — à condition de formaliser `enabled_modules[]` et l'admin capabilities.

> **Note multi-pays :** M0/M1 livrés (cookie pays, filtre API, copy dynamique, sous-domaines `ci|bf|sn.laplasse.tech`, middleware host, redirect CountrySwitcher). Reste : lancement BF opérationnel (§11.12), DNS prod `laplasse.tech`.

---

## 11. Multi-pays — Afrique de l'Ouest

### 11.1 Contexte & objectif produit

LaPlasse vise initialement la **zone UEMOA / CEDEAO francophone**, puis extension anglophone (Ghana, Nigeria) :

| Phase | Pays cibles | Devise | Langue |
|-------|-------------|--------|--------|
| **Lancement** | Côte d'Ivoire (CI) | XOF | FR |
| **V2.4 — UEMOA** | Burkina Faso (BF), Sénégal (SN), Mali (ML), Bénin (BJ), Togo (TG), Niger (NE), Guinée-Bissau (GW) | XOF | FR |
| **V3+** | Ghana (GH), Nigeria (NG), Guinée (GN) | GHS, NGN, GNF | EN + FR |

**Expérience attendue pour un utilisateur au Burkina :**

- Arrive sur le site → détection / choix **Burkina Faso**
- Homepage : « Les adresses incontournables de **Ouagadougou** » (pas Abidjan)
- Recherche, catégories, marketplace : **uniquement** établissements BF
- Filtres quartiers : **Ouaga 2000, Gounghin, Cissin…** (pas Cocody)
- Prix en **FCFA (XOF)**, téléphones **+226**, paiement **Orange Money BF / Moov / Wave SN…**
- CGU, support, numéros WhatsApp marchands locaux
- SEO : `bf.laplasse.com` ou `laplasse.bf` indexé pour le Burkina

---

### 11.2 État actuel du code (juin 2026)

Le schéma Prisma prévoit déjà des champs pays — mais l'application les **ignore presque partout** :

| Élément | Existant | Problème |
|---------|----------|----------|
| `User.country` | `@default("CI")` | Non propagé à l'UX |
| `MerchantLocation.country` | `@default("CI")` | Seed CI uniquement |
| `Shop.country`, `Shop.city` | `@default("CI")`, `"Abidjan"` | Pas de filtre API |
| `Product.currency`, `Order.currency` | `@default("XOF")` | OK UEMOA, pas multi-devise |
| API `findFeatured(city = 'Abidjan')` | Default hardcodé | Pas de param pays |
| Meilisearch | Index `merchants` global | Pas de filtre `country` |
| Web metadata | ~~`locale: 'fr_CI'`, textes Abidjan~~ | ✅ `brandCopy.ts`, OG `fr`, ville via cookie ; sous-domaines ✅ (`middleware.ts`) |
| Search districts | Liste quartiers Abidjan (`COCODY_DISTRICTS`) | ✅ — `useGeoCommunesForDefaultCity` + API geo |
| Copy UI globale | « Élégance ivoirienne », Côte d'Ivoire | ✅ réécriture multipays juin 2026 |

**Conclusion :** le multi-pays n'est pas une feature UI — c'est une **refonte de tenancy géographique** à traiter avant ou en parallèle de l'expansion BF/SN.

---

### 11.3 Options d'architecture — comparaison

#### Option A — Sous-domaine par pays ⭐ **Recommandée**

```
ci.laplasse.com   → Côte d'Ivoire (marché lancement)
bf.laplasse.com   → Burkina Faso
sn.laplasse.com   → Sénégal
ml.laplasse.com   → Mali
…
```

| Avantages | Inconvénients |
|-----------|---------------|
| SEO local fort (Google BF indexe bf.*) | DNS wildcard + certificat SSL `*.laplasse.com` |
| Cookies / panier isolés par pays | Liens cross-pays = changement d'hôte explicite |
| Campagnes marketing par pays | Config CDN / cache par host |
| Confiance utilisateur (« site burkinabè ») | |
| Analytics PostHog / GA segmentés naturellement | |
| Évolution vers `laplasse.bf` CNAME sans changer l'app | |

#### Option B — Préfixe URL `/bf/`, `/ci/`

```
laplasse.com/bf/marketplace
laplasse.com/ci/m/le-bushman-cafe
```

| Avantages | Inconvénients |
|-----------|---------------|
| Un seul certificat, un seul host | SEO moins fort qu'un sous-domaine dédié |
| Next.js `[country]` segment simple | URLs longues, partage moins « local » |
| Pas de wildcard DNS | Risque de mélange cookies si mal configuré |

#### Option C — Domaine ccTLD par pays

```
laplasse.ci   laplasse.bf   laplasse.sn
```

| Avantages | Inconvénients |
|-----------|---------------|
| Confiance maximale locale | Coût & gestion N domaines |
| | Renouvellements, DNS, SSL multiples |
| | Complexité juridique (entités locales) |

**Usage recommandé :** en **phase 2**, `laplasse.bf` → CNAME vers `bf.laplasse.com` (alias marketing, même app).

#### Option D — Paramètre query `?country=BF`

| Verdict | ❌ **À éviter** — non bookmarkable, mauvais SEO, fuites de contexte, partage de liens cassé.

#### Option E — Déploiement / base de données séparés par pays

| Verdict | ❌ **Prématuré** pour UEMOA — coût ops × N, sauf contrainte légale data residency (Nigeria plus tard).

---

### 11.4 Top recommandation — « Single app, country as tenant, subdomain as router »

> **Architecture retenue : sous-domaines pays sur une seule application, avec `country` comme dimension de tenancy en base et dans tous les services.**

```
                    Utilisateur BF
                         │
                         ▼
              bf.laplasse.com  (ou laplasse.bf → CNAME)
                         │
              ┌──────────▼──────────┐
              │  Next.js Middleware  │
              │  Host → countryCode  │
              │  BF, CI, SN…         │
              └──────────┬──────────┘
                         │ X-LaPlasse-Country: BF
              ┌──────────▼──────────┐
              │   NestJS API (unique) │
              │   CountryGuard/Scope  │
              └──────────┬──────────┘
                         │
         ┌───────────────┼───────────────┐
         ▼               ▼               ▼
   PostgreSQL      Meilisearch       Redis
   WHERE country    filter country    cache key
   = 'BF'           = 'BF'            country:BF:*
```

#### Pourquoi cette approche

1. **Un seul codebase, un déploiement Coolify** — cohérent avec l'exécution actuelle.
2. **Sous-domaine = identité pays** pour l'utilisateur burkinabè (bf.laplasse.com).
3. **Tenancy `country` en data** — pas de fuite CI/BF dans search, marketplace, panier.
4. **Panier et commandes strictement mono-pays** — pas de checkout cross-border (UEMOA OK en devise, pas en logistique).
5. **Évolution domaine local** sans refonte (`laplasse.bf` → alias).
6. **Admin central** — super-admin active/désactive pays, configure paiements & villes.

#### Résolution du pays — ordre de priorité

```
1. Host header        bf.laplasse.com → BF
2. Cookie lp_country  (persiste choix manuel)
3. GeoIP (Cloudflare / MaxMind) → suggestion modal
4. Default            ci.laplasse.com (marché lancement)
```

Si l'utilisateur sur `ci.laplasse.com` choisit « Burkina Faso » dans le sélecteur → **redirect 302** vers `bf.laplasse.com` (pas seulement un cookie sur le mauvais host).

---

### 11.5 Modèle de données proposé

#### Nouvelles tables / config

```prisma
model Country {
  code           String   @id  // ISO 3166-1 alpha-2 : CI, BF, SN
  name           String        // Côte d'Ivoire
  name_local     String?       // Burkina Faso
  default_locale String        // fr_CI, fr_BF
  currency       String        // XOF, GHS
  phone_prefix   String        // +225, +226
  is_active      Boolean  @default(false)
  subdomain      String        // bf, ci, sn
  flag_emoji     String?       // 🇧🇫
  timezone       String        // Africa/Ouagadougou
  launch_at      DateTime?
}

model CountryCity {
  id         String @id @default(cuid())
  country    String
  name       String   // Ouagadougou, Abidjan
  slug       String
  is_default Boolean @default(false)
  latitude   Float?
  longitude  Float?
  @@unique([country, slug])
}

model CountryCity {
  id         String @id @default(cuid())
  country    String
  name       String   // Ouagadougou, Abidjan
  slug       String
  is_default Boolean @default(false)
  // ...
}

model CountryCommune {
  id      String @id @default(cuid())
  city_id String
  name    String   // Cocody, Gounghin, Plateau
  slug    String
  @@unique([city_id, slug])
}
```

> Le **quartier** n'est pas référencé en base plateforme — champ **libre** saisi par le client au checkout (complément d'adresse). Voir [§12.4](#124-zones-de-livraison-personnalisées--spécification) pour le matching zones.

model CountryConfig {
  country              String @id
  legal_terms_url      String?
  legal_privacy_url    String?
  support_whatsapp     String?
  support_email        String?
  payment_providers    Json   // ["ORANGE_MONEY_BF", "MOOV_BF"]
  delivery_enabled     Boolean @default(false)
  marketplace_enabled  Boolean @default(true)
  booking_enabled      Boolean @default(true)
  meta_title_suffix    String?  // "— LaPlasse Burkina"
}
```

#### Scoping existant — règles obligatoires

| Entité | Règle |
|--------|-------|
| `Merchant` / `MerchantLocation` | `country` requis, index composite |
| `Shop` | `country` + `city` — slug unique **par pays** (`@@unique([country, slug])`) |
| `Product`, `Order`, `Cart` | héritent du shop → pas de panier cross-country |
| `User` | `country` = pays d'inscription ; peut voyager, le host prime |
| `Promotion`, `AdCampaign` | scoped pays |
| `PlatformSetting` | clé préfixée `bf.marketplace_spotlight_limit` ou JSON par pays |
| Meilisearch | attribut filterable `country` sur merchants, products |

#### Slugs marchands cross-pays

Deux établissements « Burger Republic » en CI et BF peuvent coexister :

```
bf.laplasse.com/m/burger-republic-ouaga
ci.laplasse.com/m/burger-republic-cocody
```

---

### 11.6 Couches produit à localiser

| Couche | Exemple CI | Exemple BF |
|--------|------------|------------|
| **Copy UI** | « Découvrez Abidjan » | « Découvrez Ouagadougou » |
| **Villes / quartiers** | Cocody, Plateau | Ouaga 2000, Gounghin |
| **Devise** | FCFA (XOF) | FCFA (XOF) — même symbole, pays différent |
| **Téléphone** | +225 | +226 |
| **Paiement** | Wave CI, Orange CI | Orange BF, Moov BF, Coris Money |
| **Livraison** | Zones Abidjan | Zones Ouagadougou, Bobo-Dioulasso |
| **SEO** | `fr_CI`, hreflang | `fr_BF` |
| **CGU / Privacy** | Entité CI | Entité BF (future) |
| **Categories** | Identiques mostly | Activer/désactiver par pays si besoin |
| **Seed / contenu** | 25 marchands Abidjan | Seed Ouaga séparé |
| **Spotlight marketplace** | Boutiques CI | Boutiques BF |
| **Notifications** | Template FR localisé | Idem |

**i18n technique :** Next.js `next-intl` ou fichiers JSON `locales/fr-BF.json`, `fr-CI.json` — même langue, **variantes régionales** (comme `fr_CA` vs `fr_FR`).

---

### 11.7 Implémentation technique — plan par slices

#### Slice M0 — Fondations (2–3 semaines) — **prérequis expansion**

| Tâche | Détail |
|-------|--------|
| Table `Country` + seed CI/BF/SN | Admin active BF quand prêt |
| `CountryMiddleware` Next.js | Parse `Host` → `countryCode`, set cookie `lp_country` |
| `CountryContext` React | `{ code, currency, defaultCity, cities, config }` |
| Header API `X-LaPlasse-Country` | Tous les fetch web ; guard NestJS |
| Refactor defaults | Supprimer `'Abidjan'` hardcodé → `config.defaultCity` |
| Filtre API | `findFeatured`, `listMerchants`, marketplace → `WHERE country = :ctx` |
| Meilisearch | Attribut `country` + filter à l'indexation |
| Slug unique | Migration `@@unique([country, slug])` sur Shop/Merchant |
| Panier | Rejet si produit pays ≠ host country |

#### Slice M1 — UX pays (1–2 semaines) — ✅ code livré (DNS prod ⏳)

| Tâche | Détail | Statut |
|-------|--------|--------|
| Sélecteur pays header | Redirect sous-domaine `ci\|bf\|sn.laplasse.tech` | ✅ `CountrySwitcher` + `buildCountrySwitchUrl` |
| Middleware host | Cookie `lp_country` sync + redirect apex → `ci.` | ✅ `middleware.ts` |
| GeoIP suggestion | « Vous semblez être au Burkina Faso » | ⏳ |
| Pages légales par pays | `/terms`, `/privacy` contenu ou URL config | ⏳ |
| Metadata dynamique | `generateMetadata` lit CountryContext | ⏳ |
| Sitemap par pays | `bf.laplasse.tech/sitemap.xml` | ⏳ |
| hreflang | `<link rel="alternate" hreflang="fr-BF" …>` | ⏳ |

#### Slice M2 — Contenu BF (2–4 semaines)

| Tâche | Détail |
|-------|--------|
| `CountryCity` / districts Ouaga, Bobo | Remplacer listes Abidjan en dur — ✅ search + signup ; seed geo BF ⏳ |
| Seed marchands BF | 20–50 établissements démo Ouagadougou |
| Paiements BF | Orange Money BF simulateur → réel |
| Admin pays | `/admin/countries` — activer, config, stats par pays |
| Onboarding marchand | Pays verrouillé au host d'inscription |

#### Slice M3 — Domaines locaux & ops

| Tâche | Détail |
|-------|--------|
| DNS `laplasse.bf` → `bf.laplasse.com` | Marketing local |
| PostHog par pays | Property `country` sur tous les events |
| Support & modération | File admin filtrable par pays |
| Runbook | Playbook lancement pays (seed, paiements, legal) |

---

### 11.8 DNS, SSL & déploiement

```
*.laplasse.com     A/CNAME → Coolify (web)
laplasse.com       redirect → ci.laplasse.com (ou page hub « Choisissez votre pays »)
laplasse.bf        CNAME → bf.laplasse.com
laplasse.ci        CNAME → ci.laplasse.com
```

- **Certificat wildcard** `*.laplasse.com` (Let's Encrypt DNS challenge)
- **Coolify** : une app web, variables `SUPPORTED_COUNTRIES=ci,bf,sn`
- **API** : même host `api.laplasse.com` + header country **ou** `api.bf.laplasse.com` (optionnel, même backend)
- **CORS** : autoriser `https://*.laplasse.com`

#### Page hub racine (optionnel)

`laplasse.com` sans sous-domaine → carte interactive UEMOA pour choisir son pays (comme Amazon country picker).

---

### 11.9 Règles métier non négociables

1. **Pas de panier cross-pays** — un checkout = un pays, une devise, une zone livraison.
2. **Pas de mélange search** — un Burkinabè ne voit jamais un restaurant de Cocody en résultats (sauf changement explicite de pays).
3. **Marchand enregistré dans un pays** — pas de multi-pays single merchant en V1 multi (un compte peut avoir CI + BF = **2 merchants**, pas 1 merchant bi-pays).
4. **Paiement providers par pays** — table config, pas hardcode Wave CI partout.
5. **Modération & trust score** — calculés **dans le pays**, pas global.
6. **Feature flags par pays** — marketplace/booking/delivery activables indépendamment (ex. BF discovery only, CI full stack).

---

### 11.10 Ce qu'il ne faut PAS faire

| Anti-pattern | Pourquoi |
|--------------|----------|
| Dupliquer le repo par pays | Dette de sync insupportable |
| Base PostgreSQL par pays (maintenant) | Ops × N sans gain UEMOA |
| Garder `?country=BF` en query string | SEO, partage, fuites |
| Traduction UI seule sans filtre data | Site « en français burkinabè » avec restos Abidjan |
| Slug global unique | Empêche même enseigne multi-pays |
| Ignorer le phone prefix | OTP et WhatsApp cassés |

---

### 11.11 Intégration roadmap globale

Le multi-pays est une **capacité plateforme**, pas un vertical :

```
V2.0  Transactions réelles (CI d'abord)
  │
  ├─ M0 Multi-pays fondations (en parallèle — dette technique sinon)
  │
V2.4  Lancement BF (+ SN)
  │
V2.x  Autres UEMOA
  │
V3.0  GH / NG (devise GHS/NGN, EN, data residency à étudier)
```

**Recommandation planning :** démarrer **M0 dès V2.0** (middleware + country scope API), même si BF n'est lancé qu'en V2.4. Coût de refactor si reporté : réécriture de ~80 % des requêtes list/search/checkout.

---

### 11.12 Critères d'acceptation — « Burkina ready »

- [ ] `bf.laplasse.com` résout et affiche homepage Ouagadougou
- [ ] Zéro résultat Côte d'Ivoire dans search/marketplace BF
- [ ] Inscription marchand BF → `country=BF`, téléphone +226
- [ ] Checkout BF → paiement provider BF configuré
- [ ] Sélecteur pays redirige CI ↔ BF correctement
- [ ] Sitemap + metadata `fr_BF` indexables
- [ ] Admin peut activer/désactiver pays sans redeploy
- [ ] PostHog events tagués `country=BF`

---

## 12. Catégories produits, codes promo & zones de livraison

Trois briques marketplace **critiques pour V2.0**, complémentaires au multi-pays (§11). Aujourd'hui : catégories = établissements uniquement, promos CRUD sans effet checkout, livraison = booléen produit sans tarification.

---

### 12.1 Catégories produits marketplace

#### Problème actuel

| Élément | Existant | Limite |
|---------|----------|--------|
| `Category` (Prisma) | Hiérarchie `parent_id` pour **marchands** (restaurants, boutiques…) | Aucun lien `Product` |
| Filtres `/marketplace` | Boutique, prix, tri texte | Pas de filtre catégorie produit |
| Formulaire produit | Nom, prix, variantes, images | Pas de rayon / collection |
| SEO boutique | Slug shop + slug produit | Pas de landing « Mode homme » |

Les **catégories établissement** (discovery) et **catégories produit** (e-commerce) sont deux taxonomies distinctes — ne pas les fusionner.

#### Modèle recommandé — double niveau

```
Niveau 1 — Taxonomie marketplace (admin LaPlasse)
  Mode › Homme › Chaussures
  Alimentation › Épicerie
  Maison › Déco

Niveau 2 — Collections boutique (marchand, optionnel)
  « Nouveautés », « Promo été », « Best-sellers »
```

| Entité | Scope | Gestion |
|--------|-------|---------|
| `ProductCategory` | Global, arbre hiérarchique | Admin `/admin/product-categories` |
| `ShopCollection` | Par boutique | Marchand `/merchant/shop/collections` |
| `Product.category_id` | 1 catégorie marketplace principale | Formulaire produit |
| `ProductCollection` | N-N produit ↔ collection | Tags merchandising |

#### Fonctionnalités attendues

**Admin plateforme**
- CRUD catégories produit (nom, slug, icône, parent, ordre, actif/inactif)
- Activation par pays (`ProductCategoryCountry` — masquer « Neige » en CI)
- Synonymes search (optionnel Meilisearch)

**Marchand**
- Choix catégorie principale à la création/édition produit (select arbre)
- Collections propres : créer, ordonner, y affecter des produits
- Preview filtre boutique par collection

**Client**
- Filtre catégorie sur `/marketplace` (sidebar + mobile modale)
- Filtre sur vitrine `/boutique/[slug]` et `/m/[slug]/boutique`
- Breadcrumb : Marketplace › Mode › Chaussures › [Produit]
- URL SEO : `/marketplace/c/mode/homme` ou query `?category=mode-homme`

**API**
- `GET /marketplace/product-categories` (arbre public)
- `GET /marketplace/products?category=slug`
- Index Meilisearch : attributs `category_slug`, `category_path`, filterables

#### Critères d'acceptation

- [ ] Admin crée une catégorie produit, visible filtre marketplace
- [ ] Marchand assigne catégorie à un produit, produit apparaît sous filtre
- [ ] Collection boutique n'apparaît que sur vitrine du shop
- [ ] Panier / checkout inchangés (catégorie = discovery only)

#### Slice implémentation

| Phase | Livrable |
|-------|----------|
| **V2.0a** | Modèle `ProductCategory`, migration, admin CRUD, champ produit |
| **V2.0b** | Filtres marketplace + boutique + Meilisearch |
| **V2.1** | Collections shop + merchandising |

---

### 12.2 Codes promo & promotions

#### État actuel

| Couche | Statut |
|--------|--------|
| Modèle `Promotion` | ✅ `PERCENTAGE`, `FIXED`, `FREE_ITEM`, `EARLY_ACCESS` |
| UI marchand | ✅ `ShopPromotionsPanel` — `/merchant/shop/promotions` |
| API CRUD | ✅ `POST /promotions`, toggle, delete |
| Feature gating | ✅ Plans STARTER+ |
| Panier `/cart` | ⚠️ Champ code promo **UI seulement** — non branché |
| Checkout | ❌ Aucun calcul remise sur `Order.subtotal` |
| Scope shop | Promotions liées `merchant_id`, pas `shop_id` explicite |

#### Modèle cible — promotion complète

**Types à supporter (enum étendu)**

| Type | Effet checkout |
|------|----------------|
| `PERCENTAGE` | −X % sur sous-total éligible |
| `FIXED` | −X FCFA sur sous-total |
| `FREE_DELIVERY` | Frais livraison = 0 (nécessite §12.4) |
| `FREE_ITEM` | Produit offert (future — ligne panier) |
| `EARLY_ACCESS` | Hors checkout (accès anticipé collection) |

**Champs additionnels proposés**

```prisma
model Promotion {
  // existant…
  shop_id           String?      // scope boutique (prioritaire si shop lié)
  code              String?      // ex. ETE2026 — unique par shop ou global
  min_order_amount  Int?         // commande minimum
  max_discount      Int?         // plafond remise %
  applies_to        PromotionScope @default(ORDER)  // ORDER | DELIVERY_FEE | CATEGORY
  category_id       String?      // si scope catégorie produit
  product_ids       String[]     // produits éligibles (optionnel)
  per_user_limit    Int?         // max utilisations / client
  stackable         Boolean @default(false)
}
```

**Règles métier**

1. **Un code actif par boutique par panier** — pas de cumul sauf `stackable` explicite.
2. **Panier multi-boutiques** : validation **par shop** — chaque sous-total a son promo indépendant.
3. **Validation** : dates, `uses_count < max_uses`, `min_order_amount`, éligibilité produits/catégorie.
4. **Enregistrement** : `PromotionRedemption` (order_id, user_id, promotion_id, amount_saved).
5. **Affichage** : ligne « Remise promo ETE2026 » dans résumé panier + checkout + confirmation.

#### Parcours utilisateur

```
/cart → saisie code → POST /cart/promo/apply { code, shopId? }
  → réponse { valid, discount, new_subtotal, message }
/checkout → reprend promos validées (session ou cart snapshot)
/orders/checkout → persiste promotion_id + discount_amount sur Order
```

#### Parcours marchand

```
/merchant/shop/promotions → créer
  - Type, valeur, code (auto-généré ou custom)
  - Période, limite utilisations
  - Option : catégorie / produits ciblés
  - Preview : « −15 % sur Mode, min 10 000 FCFA »
```

#### Codes promo plateforme (V2.2+)

Admin LaPlasse : codes cross-shops (`LAPLASSE10` — commission absorbée plateforme) — hors scope V2.0.

#### Critères d'acceptation

- [ ] Code valide réduit le total affiché panier et checkout
- [ ] Code invalide → message explicite (expiré, min order, épuisé)
- [ ] Commande enregistrée avec montant remise + référence promo
- [ ] Panier 2 boutiques : code shop A n'affecte pas shop B
- [ ] `FREE_DELIVERY` annule frais zone livraison calculés (§12.4)

#### Slice implémentation

| Phase | Livrable |
|-------|----------|
| **V2.0** | `POST /cart/promo/apply`, calcul checkout, brancher UI `/cart` |
| **V2.0** | Lier `Promotion.shop_id`, redemption table |
| **V2.1** | Scope catégorie/produit, `FREE_DELIVERY` |

---

### 12.3 Référentiel géographique — pays › ville › commune › quartier

Base **plateforme** (admin), partagée avec le multi-pays (§11), utilisée par les zones de livraison marchands.

#### Hiérarchie

```
Pays (CI, BF, SN…)
 └── Ville (Abidjan, Ouagadougou, Bobo-Dioulasso…)
      └── Commune (Cocody, Plateau, Gounghin, Cissin…)
           └── Quartier → CHAMP LIBRE client (texte, non référencé admin)
```

| Niveau | Gestion | Exemple |
|--------|---------|---------|
| **Pays** | Admin — `Country` §11 | Burkina Faso |
| **Ville** | Admin — seed + CRUD | Ouagadougou |
| **Commune** | Admin — rattachée à 1 ville | Gounghin |
| **Quartier** | **Saisie libre** acheteur au checkout | « près du marché Rood Woko » |

**Pourquoi quartier en libre ?** Densité de micro-quartiers variable, impraticable à maintenir centralement. Le tarif se calcule sur **ville + commune** ; le quartier affine l'adresse livreur (instructions + future GPS).

#### Modèle Prisma — référentiel

```prisma
model GeoCity {
  id         String @id @default(cuid())
  country    String
  name       String
  slug       String
  is_active  Boolean @default(true)
  @@unique([country, slug])
}

model GeoCommune {
  id      String @id @default(cuid())
  city_id String
  name    String
  slug    String
  city    GeoCity @relation(fields: [city_id], references: [id])
  @@unique([city_id, slug])
}
```

Aligner / fusionner avec `CountryCity` / `CountryCommune` du §11 — **une seule source de vérité géographique**.

#### Données initiales

- **CI** : Abidjan (Cocody, Plateau, Yopougon, Marcory…), Bouaké, San-Pédro…
- **BF** : Ouagadougou (Gounghin, Cissin, Ouaga 2000…), Bobo-Dioulasso, Koudougou…
- Import CSV admin + contribution marchands (suggestion commune — modération admin, P2)

---

### 12.4 Zones de livraison personnalisées — spécification

Cœur de la feature demandée : le **propriétaire de boutique** définit des **zones libres** composées de sélections géographiques granulaires, chacune avec **tarif, délai et mode d'expédition**.

#### Concept

Une **zone de livraison** n'est pas un simple rayon GPS — c'est un **ensemble de règles géographiques** :

> « Je livre dans **Ouagadougou** (communes Gounghin + Cissin + Dassasgho) **et** dans **Bobo-Dioulasso** (toutes communes) au tarif **1 500 FCFA**, délai **45–60 min**, en **moto**. »

> « Livraison inter-villes **Ouaga → Koudougou** : **5 000 FCFA**, **3–5 h**, en **voiture**. »

```
Shop
 └── DeliveryZone « Ouaga centre-est »
      ├── fee: 1500 XOF
      ├── min_order: 5000
      ├── free_delivery_threshold: 25000 (optionnel)
      ├── eta_min_minutes: 45
      ├── eta_max_minutes: 60
      ├── vehicle: MOTO
      ├── priority: 10
      └── CoverageRules[]
           ├── { city: Ouagadougou, communes: [Gounghin, Cissin] }
           └── { city: Ouagadougou, communes: [Dassasgho] }

Shop
 └── DeliveryZone « Inter-villes Ouaga-Bobo »
      ├── fee: 8000
      ├── eta: 180–300 min
      ├── vehicle: CAR
      └── CoverageRules[]
           └── { cities: [Ouagadougou, Bobo-Dioulasso], all_communes: true }
           // règle spéciale inter-villes — voir §12.4.4
```

#### Modèle Prisma proposé

```prisma
enum DeliveryVehicle {
  MOTO      // intra-ville court
  TRICYCLE  // charge moyenne
  CAR       // inter-communes / inter-villes
  VAN       // gros volumes
}

model ShopDeliveryZone {
  id                      String @id @default(cuid())
  shop_id                 String
  name                    String          // « Ouaga centre-est »
  description             String?
  fee                     Int             // FCFA
  min_order_amount        Int?
  free_delivery_threshold Int?            // livraison offerte si subtotal ≥
  eta_min_minutes         Int
  eta_max_minutes         Int
  vehicle                 DeliveryVehicle @default(MOTO)
  is_active               Boolean @default(true)
  priority                Int @default(0)  // tie-break si plusieurs zones matchent
  sort_order              Int @default(0)

  shop    Shop @relation(...)
  rules   ShopDeliveryZoneRule[]
}

model ShopDeliveryZoneRule {
  id       String @id @default(cuid())
  zone_id  String
  city_id  String              // GeoCity — obligatoire

  // Granularité commune : liste explicite OU toutes
  all_communes Boolean @default(false)
  communes     ShopDeliveryZoneCommune[]

  zone ShopDeliveryZone @relation(...)
  city GeoCity @relation(...)
}

model ShopDeliveryZoneCommune {
  zone_rule_id String
  commune_id   String
  @@id([zone_rule_id, commune_id])
}
```

#### UI marchand — `/merchant/shop/delivery-zones`

**Étape 1 — Créer une zone**
- Nom, description
- Tarif (FCFA), commande minimum, seuil livraison gratuite
- Délai min/max (minutes)
- Véhicule : moto / tricycle / voiture / utilitaire
- Actif / inactif

**Étape 2 — Définir la couverture géographique**

Interface en **arbre à cases** (comme décrit) :

```
☑ Ouagadougou
    ☑ Gounghin
    ☑ Cissin
    ☐ Ouaga 2000
    ☐ Dassasgho
☑ Bobo-Dioulasso
    ☑ [Toutes les communes]   ← raccourci
    ☐ ou sélection détaillée…
```

- Ajouter **plusieurs villes** dans une même zone (multi-select villes)
- Pour chaque ville : cocher communes **au détail** ou « toutes les communes »
- Preview carte/liste : « 3 communes à Ouaga, 1 ville entière à Bobo »

**Étape 3 — Tester**
- Simulateur : « Si client = Ouaga + Gounghin → 1 500 FCFA, moto, 45–60 min »

#### Résolution au checkout — algorithme

Entrée client (par boutique du panier) :
```json
{
  "city_id": "…",
  "commune_id": "…",
  "quartier": "face au Total Rood Woko"  // libre, non matché tarif
}
```

**Pour chaque `Shop` du panier :**

```
1. Charger zones actives du shop (country = host country)
2. Filtrer zones où une rule matche :
     rule.city_id = client.city_id
     AND (rule.all_communes OR client.commune_id IN rule.communes)
3. Si plusieurs zones matchent → prendre celle à plus haute priority
   (puis la plus spécifique : plus de communes listées = plus spécifique)
4. Si aucune zone → DELIVERY_UNAVAILABLE pour ce shop
5. Appliquer promo FREE_DELIVERY si validée (§12.2)
6. Retourner { fee, eta, vehicle, zone_name }
```

**Panier multi-boutiques :** frais livraison **somme par boutique** (comme split commande actuel).

```
Shop A (Ouaga, Gounghin) → 1 500 FCFA
Shop B (Ouaga, Cissin)     → 2 000 FCFA
Total livraison checkout   → 3 500 FCFA
```

#### Cas particuliers

| Cas | Comportement |
|-----|--------------|
| **Inter-villes longue distance** | Zone dédiée `vehicle: CAR`, 2 rules (ville A + ville B), fee majoré, ETA heures |
| **Pickup** | Toujours 0 FCFA — ignore zones |
| **Commune non couverte** | Message : « Livraison indisponible à [commune]. Retrait sur place ou autre commune. » |
| **Quartier libre** | Stocké `Order.delivery_address` ; affiché livreur ; n'influence pas le tarif V1 |
| **Zone chevauchement** | `priority` marchand ; défaut = zone la plus restrictive (plus petit set communes) |
| **Produit `allow_delivery: false`** | Exclu livraison ; si panier mixte → split ou blocage |
| **Hors pays shop** | Interdit (§11 mono-pays) |

#### Moyens d'expédition — sémantique

| Véhicule | Usage typique | Impact UX |
|----------|---------------|-----------|
| `MOTO` | Intra-commune, < 8 km | Délais courts, petits colis |
| `TRICYCLE` | Courses alimentaires volumineuses | |
| `CAR` | Inter-communes, inter-villes | ETA longues, fee élevé |
| `VAN` | Meubles, gros retail B2C | Sur devis (P2) |

Affiché client : « Livraison moto — 45 à 60 min » / « Livraison voiture — 3 à 5 h ».

#### Extension future (V2.2+)

- Quartiers référencés optionnellement (suggestions autocomplete)
- Tarif dynamique surge (pluie, heure de pointe)
- GPS shop → calcul distance override zone
- Intégration flotte livreurs (module Delivery Engine §6)

---

### 12.5 Parcours checkout livraison — UX cible

Remplace le textarea adresse unique actuel.

**Étape 2 `/checkout` — mode DELIVERY**

```
1. [Select] Ville          ← GeoCity filtrées par pays host
2. [Select] Commune        ← GeoCommune filtrées par ville
3. [Input]  Quartier       ← libre, placeholder « ex. près du marché… »
4. [Input]  Complément     ← porte, immeuble, repères
5. [Input]  Téléphone

→ Appel POST /checkout/delivery-quote { shopIds[], city_id, commune_id }
← { quotes: [{ shop_id, fee, eta, vehicle, zone_name }], total_delivery_fee }

Affichage résumé :
  « Burger Republic — Livraison moto (Gounghin) : 1 500 FCFA · ~45 min »
  « Mode Afrik — Livraison voiture (inter-zone) : 5 000 FCFA · ~3 h »
```

Adresses sauvegardées (P0 §5) : preset `{ city_id, commune_id, quartier, … }`.

---

### 12.6 Intégration avec multi-pays (§11)

| Règle | Détail |
|-------|--------|
| Référentiel geo | Scopé `country` — communes BF ≠ communes CI |
| Zones shop | Shop.country doit = host ; zones ne couvrent que villes du même pays |
| Sous-domaine BF | Villes/communes BF uniquement dans selects checkout |
| Seed | Chaque lancement pays = pack GeoCity + GeoCommune |

---

### 12.7 Admin plateforme

| Route | Rôle |
|-------|------|
| `/admin/geo/cities` | CRUD villes par pays |
| `/admin/geo/communes` | CRUD communes par ville |
| `/admin/product-categories` | Taxonomie produit marketplace |
| `/admin/delivery` (P2) | Stats zones, communes non couvertes |

---

### 12.8 Roadmap slices — catalogue, promos, livraison

| Slice | Version | Contenu |
|-------|---------|---------|
| **L0** | V2.0 prep | Modèles GeoCity, GeoCommune + seed CI |
| **L1** | V2.0 | ShopDeliveryZone + UI marchand + quote API checkout |
| **L2** | V2.0 | Promotions checkout branchées + UI panier |
| **L3** | V2.0 | ProductCategory + filtres marketplace |
| **L4** | V2.1 | Collections shop, FREE_DELIVERY, scope promo catégorie |
| **L5** | V2.4 | Référentiel geo BF/SN + zones marchands locaux |

**Dépendances :**
- L1 avant L2 (`FREE_DELIVERY`)
- L0 aligné M0 multi-pays (§11) — même tables geo
- L3 indépendant, parallélisable

---

### 12.9 Critères d'acceptation — scénario Burkina

**Marchand** « Mode Sahel » à Ouagadougou :
- [ ] Crée zone « Ouaga express » : Gounghin + Cissin, 1 500 FCFA, moto, 45–60 min
- [ ] Crée zone « Bobo longue distance » : Bobo toutes communes, 6 000 FCFA, voiture, 3–5 h

**Client** sur `bf.laplasse.com` :
- [ ] Commande livraison Ouaga + Gounghin → tarif 1 500 FCFA appliqué
- [ ] Commande Ouaga + commune non couverte → message clair + option pickup
- [ ] Code `SAHEL10` −10 % sur sous-total + affiché checkout
- [ ] Filtre marketplace catégorie « Mode » → produits Mode Sahel visibles

---

## 13. Références code & routes

### Web (`apps/web`)

| Domaine | Fichiers / routes |
|---------|-------------------|
| Marketplace | `src/features/marketplace/`, `/marketplace` |
| Boutique | `BoutiquePageClient.tsx`, `/m/[slug]/boutique`, `/boutique/[slug]` |
| Fiche produit | `/m/[slug]/p/[productSlug]/page.tsx` |
| Panier | `stores/cartStore.ts`, `/cart`, `CartDrawer.tsx` |
| Checkout | `/checkout/*`, `lib/checkoutSession.ts`, `CheckoutOrderSummary.tsx` |
| API client | `lib/marketplaceApi.ts`, `lib/shopApi.ts` |
| Booking | `features/merchant/components/BookingForm.tsx`, `profile/MerchantHotelTab.tsx` |
| Booking profil | `app/profile/bookings/page.tsx`, `BookingDetailSheet.tsx`, `lib/bookingDisplay.ts` |
| Booking marchand | `app/merchant/bookings/page.tsx`, `MerchantBookingDetailSheet.tsx` |
| Copy marque | `lib/brandCopy.ts` |
| Promotions (UI) | `ShopPromotionsPanel.tsx` — checkout branché ✅ |
| Livraison | Zones tarifaires ✅ — `ShopDeliveryZone`, quote checkout |

### API (`apps/api`)

| Domaine | Fichiers |
|---------|----------|
| Marketplace | `src/marketplace/marketplace.service.ts`, `marketplace.controller.ts` |
| Shops | `src/shops/shops.service.ts` |
| Bookings | `src/bookings/` (+ `availability.service`, auth cookie réservation) |
| Promotions | `src/promotions/` |
| Payments | `src/payments/` (abonnements ; commandes via marketplace confirm) |
| Search | `src/search/search.service.ts` (index `merchants` uniquement) |
| Géographie | `src/geo/` — `GET /geo/cities`, `GET /geo/cities/:slug/communes` |

### Dette multi-pays identifiée (juin 2026)

| Fichier | État |
|---------|------|
| `apps/web/src/lib/brandCopy.ts` | ✅ Copy globale multipays |
| `apps/web/src/app/layout.tsx` | ✅ Metadata dynamique, plus de `fr_CI` |
| `apps/web/src/app/page.tsx` | ✅ Homepage geo-aware (`lp_country`) |
| `apps/web/src/app/search/page.tsx` | ✅ Ville + quartiers dynamiques (`useGeoCommunesForDefaultCity`) |
| Formulaires marchand (`signup`, `shop/create`, `ShopSettingsPanel`) | ✅ Default ville via `getDefaultCity(getCountryCode())` ; quartiers signup via API geo |
| `apps/api/src/merchants/merchants.service.ts` | Filtre `location.country` ✅ (M1) |
| Sous-domaines `ci.laplasse.tech` | ✅ M1 — `middleware.ts` + `CountrySwitcher` redirect |

---

## Documents liés

| Document | Rôle |
|----------|------|
| `REGLES_DEVELOPPEMENT.md` | Journal d'exécution V0.5 → V1.6 |
| `Implementation Blueprint.md` | Guide technique fondateur |
| `Tome 03.md` | Architecture modulaire (Modular First) |
| `Tome 13.md` | UX checkout & marketplace |
| `Tome 19.md` | Monétisation spotlight / ads |
| `maquettes/*.md` | Références UI |
| `Tome 04.md` / `Tome 11.md` | Expansion géographique (vision Tomes) |

---

## 14. Journal d'exécution locale V2

> Suivi des slices implémentées en local avant déploiement. Mettre à jour à chaque étape.

**Branche de travail :** `main` / `feature/v2-local` (à créer si besoin)  
**Dernière mise à jour :** 19 juin 2026 (v2.0)

### Phase 1 — Quick wins UX (§7)

| # | Slice | Statut | Fichiers / notes |
|---|-------|--------|------------------|
| 1.1 | Mobile nav : Marketplace + Panier | ✅ Fait | `MobileBottomNav.tsx` — Shop + drawer panier avec badge |
| 1.2 | Erreurs réseau + retry | ✅ Fait | `fetchPublicJson`, `NetworkErrorBanner`, marketplace homepage + catalogue |
| 1.3 | CTAs contextualisés fiche établissement | ✅ Fait | `MerchantContextualCTAs`, `categoryBooking.ts`, produits toutes catégories |
| 1.4 | Timeline commande client | ✅ Fait | `OrderTimeline.tsx` → `/profile/orders/[id]` |
| 1.5 | Favoris produit branchés ou retirés | ✅ Fait | API `ProductFavorite`, `ProductFavoriteButton`, onglet Produits sur `/favoris` |
| 1.6 | Persistance checkout au refresh | ✅ Fait | `CheckoutDraft` sessionStorage dans `checkoutSession.ts` |

### Phase 2 — Fondations données

| # | Slice | Statut | Fichiers / notes |
|---|-------|--------|------------------|
| F1 | GeoCity + GeoCommune + seed CI | ✅ Fait | Migration `20260620100000`, `GET /geo/cities`, `GET /geo/cities/:slug/communes` |
| F2 | Country scope (cookie + header API) | ✅ Fait (M0) | `lib/country.ts`, header `X-LaPlasse-Country`, `CountryInterceptor` API |
| F3 | `Shop.enabled_modules[]` | ✅ Fait (M0) | Champ Prisma + `UpdateShopDto` + select public shop |

### Phase 3 — V2.0 marketplace

| Slice | Statut |
|-------|--------|
| L3 ProductCategory | ✅ V2.0a | Modèle, seed CI, admin CRUD, filtre `/marketplace` |
| L3 V2.0b Meilisearch + vitrine | ✅ V2.0b | Index `products`, `GET /search/products`, filtres catégorie boutique |
| L1 Zones livraison | ✅ V2.0 | Modèle zones, quote checkout, UI marchand `/merchant/shop/delivery-zones` |
| L2 Promos checkout | ✅ V2.0 | `POST /cart/promo/apply`, remises + `PromotionRedemption` sur Order |
| L2b FREE_DELIVERY preview | ✅ V2.0 | Remise livraison visible checkout + résumé commande |
| P0 #5 Retry paiement PENDING | ✅ V2.0 | `GET /orders/pay/resume`, CTA profil + `/checkout/payment?orderIds=` |
| P0 #6 Adresses sauvegardées | ✅ V2.0 | CRUD `/addresses`, checkout + **Paramètres profil** |
| Téléphone checkout obligatoire | ✅ V2.0 | Préremplissage compte + validation API |
| P0 #8 Recherche unifiée | ✅ V2.0 | Endpoint unifié + onglets + cartes produits `/search` + pagination |
| §7 Wizard publication boutique | ✅ V2.0 | Checklist logo → 3 produits → activer → partager lien |
| L4 Collections shop | ✅ V2.1 | CRUD marchand + filtre vitrine boutique |

### Phase 4 — V2.1 fin + P1 + verticaux + multi-pays M0

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **1** Promo scope catégorie | ✅ V2.1 | `Promotion.category_id`, validation panier lignes éligibles, picker `ShopPromotionsPanel` |
| **1** Empty states marketplace | ✅ V2.1 | Catalogue vide vs filtres — CTAs `/search`, reset, `/merchant/signup` |
| **2** Remboursements marchand | ✅ P1 | Transition `→ REFUNDED` (`COMPLETED`, `CONFIRMED`, `PREPARING`) + libellé panneau commande |
| **2** Avis produits | ✅ P1 | Modèle `ProductReview`, `GET/POST /product-reviews/products/:slug`, onglet fiche produit |
| **2** Reçu / facture | ✅ P1 | `/profile/orders/[id]/receipt` imprimable (PDF via navigateur) |
| **2** Guest checkout OTP | ✅ P1 | `POST /auth/guest/otp/*`, panneau checkout sans compte préalable |
| **3** Menu restaurant MVP | ✅ V2.1 Glovo | `MenuSection`/`MenuItem` liés à **Merchant**, `GET /merchants/:slug/menu`, dashboard `/merchant/menu` (sidebar, hors boutique) |
| **3** Calendrier hôtel MVP | ✅ V2.2 slice | `nightly_rate` sur `MerchantService`, `GET /bookings/merchant/:id/room-calendar`, `HotelRoomCalendar` |
| **4** Multi-pays V2.4 M0 | ✅ M0 | Seed geo BF/SN, filtre `shop.country` catalogue, `CountrySwitcher` navbar |
| **5** Seed verticals | ✅ | `seed-verticals.ts` : menus food, chambres hôtel, prestations beauté/fitness, consultations pharmacie, booking settings, avis produits (CI + BF/SN) |
| **5** Multi-pays V2.4 M1 | ✅ M1 | Filtre `location.country`, cookie pays, `middleware.ts` sous-domaines, redirect `CountrySwitcher`, quartiers geo API |
| **5** Delivery engine V3.0 | ✅ MVP | `DeliveryCourier`/`DeliveryJob`, statuts `OUT_FOR_DELIVERY`/`DELIVERED`, module `/delivery/*`, tracking `/delivery/track/:token` |
| **5** Modération avis produits | ✅ | `ProductReview.status`, liste publique `APPROVED` only, admin `/admin/product-reviews` |

### Phase 6 — Fiche établissement & verticals UX

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| Onglets fiche `/m/[slug]` | ✅ | Ordre fixe : **`[Vertical]`** · Informations · Horaires · Galerie |
| Contenu vertical inline | ✅ | `MerchantMenuTab`, `MerchantHotelTab`, `MerchantOfferingsTab` — plus de page `/menu` (redirect) |
| Informations / Horaires / Galerie | ✅ | `MerchantInfoTab`, `MerchantHoursTab`, `MerchantGalleryTab` |
| CTAs sidebar → onglets | ✅ | `MerchantContextualCTAs` + `?tab=` + `#profile-tabs` |
| Module métier marchand (sidebar) | ✅ | Menu hors boutique : `/merchant/menu` via `getVerticalNavItems()` |

### Phase 7 — P0 verticals & P1 infra (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Flux commande food** | ✅ MVP | `POST /cart/menu-items`, produits miroir `menu-item-*`, `FoodMenuOrderPanel` → checkout `?flow=food`, exclusion miroirs listings + Meilisearch |
| **Calendrier hôtel vue mois** | ✅ MVP | `MerchantHotelTab` grille mensuelle + tarifs/nuit ; `BookingForm` total séjour (nuits × tarif) |
| **Dispatch livraison marchand** | ✅ MVP | `DeliveryDispatchPanel` sur panneau commande marchand, `POST /delivery/orders/:id/dispatch` |
| **Tracking client profil** | ✅ MVP | `delivery_job` inclus dans `GET /orders/:id`, lien `/delivery/track/:token` |
| **Meilisearch scoping pays** | ✅ MVP | Champ `country` index merchants, filtre `GET /search` + recherche unifiée |

### Phase 8 — Booking bout-en-bout & marque multipays (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Disponibilité chambres multi-nuits** | ✅ | `availability.service` — `getRoomNightAvailability`, overlap, dates locales |
| **Lien réservation ↔ compte** | ✅ | Cookie httpOnly à la création (`getAccessTokenFromRequest`) |
| **Fiche hôtel — plage dates + chambres** | ✅ | `MerchantHotelTab` : calendrier mois, scroll horizontal chambres, galerie images |
| **BookingForm vertical-aware** | ✅ | Tous types ; invalidation cache post-réservation |
| **Chrome mobile marchand** | ✅ | `MerchantMobileActionBar`, dock panier food, avis mobile bas de fiche |
| **Profil `/profile/bookings`** | ✅ | Cartes par vertical, tarifs hôtel, `BookingDetailSheet`, modifier/annuler |
| **Marchand `/merchant/bookings`** | ✅ | Filtres, fiche détail, actions complètes, tarifs hôtel, contact client |
| **Helpers affichage booking** | ✅ | `lib/bookingDisplay.ts` — dates, tarifs, actions marchand |
| **Modification CONSULTATION** | ✅ | `EditBookingModal` — sélection service |
| **Copy marque multipays** | ✅ | `lib/brandCopy.ts` — « excellence locale », plus de focus CI/Abidjan en UI globale |
| **Profil dashboard — prochaine résa** | ✅ | Snippet `/profile` via `getBookingWhenDisplay`, `getBookingCardMeta`, `getBookingPricing` |
| **Calendrier visuel marchand bookings** | ✅ | `MerchantBookingAgenda` — toggle Liste/Agenda sur `/merchant/bookings` |
| **Paiement à la réservation** | ✅ simulateur | Acompte via `PaymentPurpose.BOOKING` — MM réel ⏳ |

### Phase 9 — Dettes techniques, M1 sous-domaines & profondeur marketplace (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Quartiers search dynamiques** | ✅ | `useGeoCommunesForDefaultCity`, `/search` sans `COCODY_DISTRICTS` |
| **Formulaires marchand geo-aware** | ✅ | `merchant/signup`, `shop/create`, `ShopSettingsPanel` — ville + quartiers API |
| **Tarifs hôtel dynamiques** | ✅ | Migration `room_dynamic_pricing`, `room-pricing.ts` API + web |
| **Enrichissement résa hôtel legacy** | ✅ | `bookings.service.enrichRoomBookings` — match `room_type` → `MerchantService` |
| **Filtres marchand unifiés** | ✅ | `MerchantListToolbar`, bookings/products/orders |
| **M1 sous-domaines pays** | ✅ | `middleware.ts`, `country.ts` (`ROOT_DOMAIN`, `buildCountrySwitchUrl`), `CountrySwitcher` |
| **Alertes stock bas marchand** | ✅ | `ShopProductsPanel` — badge + filtre « Stock bas » (seuil ≤ 5) |
| **DNS prod laplasse.tech** | ⏳ | Domaine non acheté — middleware actif dès config DNS Coolify |
| **Migration room_dynamic_pricing prod** | ⏳ | En attente déploiement explicite |

### Phase 5–6 — Delivery V3.0 (complément long terme)

| Slice | Statut | Description |
|-------|--------|-------------|
| Modèles + statuts commande | ✅ MVP | `DeliveryCourier`, `DeliveryJob`, `OUT_FOR_DELIVERY`, `DELIVERED` |
| API tracking public | ✅ MVP | `GET /delivery/track/:token`, page `/delivery/track/[token]` |
| UI dispatch marchand | ✅ MVP | `DeliveryDispatchPanel` — assignation coursier + lien tracking copiable |
| Lien tracking client | ✅ MVP | `delivery_job` sur orders API + CTA `/profile/orders/[id]` → `/delivery/track/:token` |
| Notifications temps réel | ⏳ | Push client à chaque étape livraison |
| Carte GPS livreur | ⏳ | Phase 2 suivi (§6.2) |
| Partenaires logistiques | ⏳ | Intégration flotte externe |

---

## Reste à faire — synthèse priorités (post Phase 9)

### 🔴 P0 — Bloquant « marketplace / plateforme réelle »

| # | Slice | Détail |
|---|-------|--------|
| 1 | **Mobile Money réel** | Wave / Orange Money / MTN — webhooks, remplacer `SIMULATOR` (§5 P0 #1) — *reporté volontairement* |
| 2 | **Paiement à la réservation** | Acompte ou total séjour/RDV — dépend P0 #1 |
| 3 | **DNS + déploiement laplasse.tech** | Sous-domaines code ✅ — config DNS Coolify + wildcard `*.laplasse.tech` |

### 🟠 P1 — Parité & profondeur métier (Sprint 10+)

| Domaine | Slices |
|---------|--------|
| **Marketplace** | ~~Analytics e-commerce~~ ✅ · ~~Order again~~ ✅ · ~~Split livraison multi-boutiques~~ ✅ |
| **Restaurant** | ~~Modificateurs menu (suppléments)~~ ✅ · ~~ETA préparation checkout~~ ✅ |
| **Hôtel** | ~~Tarification dynamique~~ ✅ · Fiche chambre riche · Notifications rappel séjour |
| **Booking** | ~~Rappels SMS/WhatsApp auto~~ ✅ · ~~Politique no-show~~ ✅ · ~~Réservations invité rattachables~~ ✅ |
| **Delivery V3** | ~~Notifications temps réel~~ ✅ (push) · GPS livreur · Partenaires logistiques |
| **Multi-pays** | Autocomplete merchants par pays · ~~Critères §11.12 « Burkina ready » (geo + smoke)~~ ✅ · Seed BF opérationnel prod |
| **Retail** | Retours SAV structuré · SEO produit avancé · ~~Export CSV commandes~~ ✅ |
| **UX transverse** | ~~Funnels PostHog checkout~~ ✅ · ~~Wizard marchand `/merchant/signup`~~ ✅ · Onboarding marchand vertical |

### 🟡 P2 — Scale & différenciation

| Domaine | Slices |
|---------|--------|
| **Paiement** | Remboursement automatique MM (après P0 #1) |
| **Delivery** | GPS livreur temps réel · Partenaires logistiques |
| **Discovery** | Recommandations · Recently viewed · Fidélité achats | ✅ Sprint 17 |
| **UX transverse** | i18n FR/EN · PWA offline-lite | ✅ MVP Sprint 17 |
| **Ops** | ~~Export CSV commandes~~ ✅ · Multi-langue FR/EN · PWA offline-lite |
| **Pharmacie** | Upload ordonnance · Catalogue OTC |
| **Admin** | `/admin/delivery` stats zones · `/admin/countries` |
| **Hôtel** | Channel manager · Gestion ménage |

### ✅ Déjà livré (ne pas replanifier)

Phases 1–4 intégrales · Phase 5 (seeds verticals, M1, delivery MVP, modération avis) · Phase 6 (onglets fiche) · Phase 7 (food checkout, calendrier hôtel, dispatch, Meilisearch pays) · Phase 8 (booking client/marchand complet, tarifs hôtel UI, copy multipays) · **Phase 9 (dettes geo, M1 sous-domaines, filtres marchand, alertes stock, tarifs dynamiques)**.

---

### Phase 17 — Paiement résa simulateur, discovery, i18n & PWA (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Paiement réservation (simulateur)** | ✅ | `BOOKING` PaymentPurpose, `booking_id`, settings `require_payment`/`deposit_percent`, `/bookings/pay`, `BookingForm` redirect |
| **Recommandations produits** | ✅ | `ProductDiscoveryService`, `GET /marketplace/recommendations`, `ProductRecommendations` |
| **Recently viewed** | ✅ | `ProductView`, track view API, `RecentlyViewedProducts`, guest key + compte |
| **Fidélité achats** | ✅ | `purchase` + `booking_payment` points dynamiques (montant / 1000 FCFA) |
| **i18n FR/EN** | ✅ MVP | `src/i18n/`, `LocaleProvider`, `LanguageSwitcher`, nav + PWA + booking |
| **PWA offline-lite** | ✅ | `manifest.webmanifest`, `sw.js`, `PwaRegister`, `PwaInstallPrompt`, `/offline.html` |

### Journal — Prochains sprints (backlog ordonné)

| Sprint | Slice | Priorité | Description |
|--------|-------|----------|-------------|
| **17** | Paiement résa simulateur | ✅ | Acompte hôtel 30 %, confirm API, page `/bookings/pay` |
| **17** | Discovery produits | ✅ | Recommandations + recently viewed |
| **17** | Fidélité achats | ✅ | Points commande + réservation payée |
| **17** | i18n FR/EN | ✅ MVP | Cookie `lp_locale`, switcher navbar |
| **17** | PWA offline-lite | ✅ | SW cache navigation + API marketplace |
| — | P0 Mobile Money réel | Reporté | Remplacer simulateur — prérequis prod UEMOA |
| — | Paiement réservation hôtel/RDV | P1 | Après MM réel |
| — | Remboursement paiement réel | P2 | Après intégration MM |
| — | GPS livreur | P2 | Carte suivi live |

### Journal — Slices clôturées Phase 9 (juin 2026)

| Slice | Statut | Fichiers clés |
|-------|--------|---------------|
| Search quartiers dynamiques | ✅ | `useGeoCommunes.ts`, `/search` |
| M1 sous-domaines | ✅ | `middleware.ts`, `country.ts`, `CountrySwitcher` |
| Formulaires ville dynamique | ✅ | signup, shop/create, ShopSettingsPanel |
| Tarifs hôtel dynamiques | ✅ | migration `room_dynamic_pricing`, `roomPricing.ts` |
| Agenda marchand bookings | ✅ | `MerchantBookingAgenda.tsx` |
| Snippet profil prochaine résa | ✅ | `/profile` + `bookingDisplay.ts` |
| Enrichissement résa legacy | ✅ | `bookings.service.enrichRoomBookings` |
| Alertes stock bas | ✅ | `ShopProductsPanel`, `merchantListFilters.ts` |
| Modificateurs menu | ✅ | migration `menu_modifiers_food_prep`, `MenuItemModifierSheet` |
| ETA food checkout | ✅ | `food_prep_minutes`, `estimated_prep_minutes` |

### Phase 16 — Onboarding vertical, SAV & fiche chambre (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Onboarding marchand vertical** | ✅ | `/merchant/onboarding`, checklist par catégorie, redirect post-OTP |
| **Retours SAV structuré** | ✅ | `OrderReturn` API + `/profile/orders/[id]` + `/merchant/shop/returns` |
| **Fiche chambre détail** | ✅ | `RoomDetailSheet`, équipements complets sur fiche hôtel publique |

### Phase 15 — Wizard marchand & layout public (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Wizard `/merchant/signup` refondu** | ✅ | `MerchantSignupWizard`, catégories API, villes/communes geo, hints modules |
| **Pays dynamique à l'inscription** | ✅ | `country_code` API, plus de `CI` hardcodé sur `location` |
| **Layout pages publiques** | ✅ | `pageLayout.ts`, `PublicPageHeader`, contact/CGU/privacy/login |

### Phase 14 — Livraison, ops marchand & no-show (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Notifications livraison push** | ✅ | `DeliveryService` + libellés FR `order-status-labels.ts` |
| **Export CSV commandes** | ✅ | `exportMerchantOrdersCsv`, bouton `/merchant/shop/orders` |
| **Politique no-show booking** | ✅ | `no_show_policy`, `BookingForm` + paramètres marchand |

### Phase 13 — Booking invité, rappels & analytics checkout (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Réservations invité rattachables** | ✅ | `linkGuestBookingsByPhone`, auto login/OTP, `POST /bookings/mine/claim` |
| **Rappels booking WhatsApp/SMS** | ✅ | Push client + wa.me/SMS simulé invité ; cron fallback sans Redis |
| **Funnels PostHog checkout** | ✅ | `lib/analytics.ts`, events `checkout_funnel` par étape marketplace |
| **Politique annulation hôtel** | ✅ | `MerchantBookingSettings.cancellation_policy`, UI marchand + fiche publique |

### Phase 12 — Order again & split livraison (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Order again (1 clic)** | ✅ | `reorderFromOrder`, `OrderAgainButton`, `/profile/orders` + détail |
| **Split livraison multi-boutiques** | ✅ | `ShopCheckoutDeliveryDto`, `shop_deliveries`, `ShopSplitDeliveryForm` |

### Phase 11 — Analytics boutique & Burkina ready (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Analytics ecommerce marchand** | ✅ | `getMerchantShopAnalytics`, `ShopAnalyticsPanel`, `/merchant/shop/analytics` |
| **CA, conversion, top produits** | ✅ | Revenus, panier moyen, statuts, abandons PENDING > 24 h |
| **Geo BF enrichi** | ✅ | Communes Ouaga (Cissin, Ouaga 2000, Dassasgho…) + Bobo-Dioulasso |
| **Smoke tests Burkina** | ✅ | `scripts/smoke-burkina-ready.sh` — geo, search, marketplace scopés BF |

### Phase 10 — Restaurant profondeur (juin 2026)

| Slice | Statut | Fichiers / notes |
|-------|--------|------------------|
| **Modificateurs menu (groupes + options)** | ✅ | `MenuModifierGroup`, `MenuModifierOption`, éditeur marchand |
| **Panier food avec options** | ✅ | `selected_modifiers` sur `CartItem`, prix unitaire dynamique |
| **Commande avec snapshot options** | ✅ | `modifiers` + `variant_name` sur `OrderItem` |
| **ETA préparation checkout** | ✅ | `Merchant.food_prep_minutes`, `MenuItem.prep_minutes`, affichage `/commande` + checkout |

---

*Ce document doit être mis à jour à chaque clôture de slice majeure (V2.0, V2.4 multi-pays, fiche verticals…).*
