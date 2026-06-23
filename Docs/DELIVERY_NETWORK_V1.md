# LaPlasse — Delivery Network & Courier Platform

> **Spécification produit v1.0** — Juin 2026  
> Document fondateur pour le **réseau livreurs**, les **structures logistiques** et leur intégration bout-en-bout dans LaPlasse.  
> Complète le Delivery Engine MVP (Phase 5 / 19) et prépare la mise à jour de `ROADMAP_PRODUIT_V2.md`.

**Références :** Tome 02 §8 (Delivery Personas) · Tome 03 §13 (Delivery Engine) · ROADMAP §12.4 (zones boutique) · Phase 5/19 (tracking GPS, dispatch marchand)

---

## 1. Vision

LaPlasse adopte un **modèle hybride de livraison last-mile**, comparable à Glovo / Uber Eats / Jumia Food :

| Mode | Description | Exemple |
|------|-------------|---------|
| **Merchant delivery** | Le commerce livre avec sa propre flotte | Restaurant avec 2 motos internes |
| **Independent rider** | Livreur freelance inscrit sur LaPlasse | Moto indépendant à Cocody |
| **Logistics partner** | Structure logistique tierce sous contrat | « Express Sahel », « Yango Delivery BF » |

Objectif : qu’une commande marketplace **ne se limite plus à un dispatch manuel admin**, mais passe par un **moteur d’assignation**, un **dashboard livreur mobile-first**, une **notation**, des **zones de service choisies par le livreur**, et des **contrats boutique ↔ structure logistique**.

Principe directeur (aligné `REGLES_DEVELOPPEMENT.md`) :

> **Modular first** — le module `delivery` s’active par boutique ; le réseau LaPlasse n’impose pas la livraison à ceux qui ne la veulent pas.

---

## 2. État actuel (baseline code — juin 2026)

### ✅ Déjà en place

| Brique | Détail |
|--------|--------|
| **Zones boutique** | `ShopDeliveryZone` + règles ville/commune, quote checkout |
| **Jobs livraison** | `DeliveryJob` + statuts (`PENDING` → `DELIVERED`) |
| **Coursiers admin** | `DeliveryCourier` (legacy, dispatch marchand manuel) |
| **Dispatch marchand** | `DeliveryDispatchPanel` — choix coursier + lien tracking |
| **Tracking client** | `/delivery/track/:token` + carte OSM live (livreur + destination GPS) |
| **Notifications client** | Push + in-app à chaque changement de statut livraison |
| **Push PWA (VAPID)** | Abonnement web, SW handlers, toggle profil |
| **Admin ops** | `/admin/delivery` (stats zones, communes non couvertes) |
| **Géo** | `GeoCity` / `GeoCommune` multi-pays + coords admin |
| **Compte livreur (DN-0)** | Rôle `COURIER`, `CourierProfile`, signup, zones, online, GPS PWA |
| **Missions livreur (DN-1.1/1.2)** | API accept/status + UI `/courier/missions` + dashboard |
| **Offres push (DN-1.3)** | `DeliveryOfferService`, timeout 30 s, push `delivery_job_offered`, reject |
| **Wallet livreur (DN-1.4)** | `CourierWallet` + crédit 75 % frais livraison + `/courier/earnings` |
| **Adresses GPS client** | Pin carte profil/checkout → `Order.delivery_latitude/longitude` |
| **Nav publique livreur** | Lien « Devenir livreur » → `/courier/signup` |
| **Notation livreur (DN-2)** | `CourierReview`, modal client, modération admin, note sur suivi |
| **Preuve livraison (DN-5)** | OTP + photo + `DeliveryDispute`, admin `/admin/delivery/disputes` |
| **Fulfilment & orchestration (DN-4)** | `DeliveryFulfilmentMode`, routing platform / partner / merchant |
| **Partenaires logistiques (DN-3)** | API `/logistics/*`, contrats, flotte, dispatch |
| **Admin ops livraison** | `/admin/delivery`, KYC, assignments, KPI ETA |
| **ETA dynamique (DN-6)** | `DeliveryEtaService`, bandeaux, notifs retard, GPS 15s |
| **Portail logistique B2B (DN-7 partiel)** | Dispatch carte, finances, paramètres, qualité |

### ❌ Manques structurants (reste)

- **Landing B2B (DN-7.1)** — page publique + simulateur gains
- **Wizard onboarding pro (DN-7.2)** — KYC 4 étapes + zones service
- Pas d’**assignation auto multi-candidats** plateforme (score distance) — v1 = offre séquentielle
- Pas de **payout automatique** Mobile Money — ledger + payout manuel admin
- **DN-7.5 / 7.9** en pause (équipe multi-users, API enterprise)

---

## 3. Architecture cible — vue d’ensemble

```
                         ┌─────────────────────────────────────┐
                         │           LaPlasse Core             │
                         │  Orders · Payments · Notifications  │
                         │  Geo · Multi-pays · Trust Engine    │
                         └──────────────┬──────────────────────┘
                                        │
          ┌─────────────────────────────┼─────────────────────────────┐
          │                             │                             │
          ▼                             ▼                             ▼
   ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
   │   Merchant   │            │   Courier    │            │  Logistics   │
   │   Dashboard  │            │   App / Web  │            │   Partner    │
   │  zones,      │            │  missions,   │            │  contrats,   │
   │  dispatch,   │            │  GPS, gains, │            │  flotte,     │
   │  contrats    │            │  zones, avis  │            │  dispatch    │
   └──────┬───────┘            └──────┬───────┘            └──────┬───────┘
          │                           │                           │
          └───────────────────────────┼───────────────────────────┘
                                      ▼
                         ┌────────────────────────┐
                         │   Delivery Orchestrator │
                         │  assign · route · SLA   │
                         └────────────┬───────────┘
                                      ▼
                         ┌────────────────────────┐
                         │      DeliveryJob        │
                         │  (existant, enrichi)    │
                         └────────────────────────┘
```

### 3.1 Modes de fulfilment par commande

Chaque `Order` en `delivery_type = DELIVERY` porte un **`delivery_fulfilment_mode`** :

| Valeur | Qui livre | Assignation |
|--------|-----------|-------------|
| `MERCHANT_OWN` | Flotte interne du commerce | Marchand ou staff |
| `PLATFORM_RIDER` | Réseau LaPlasse (indépendants) | Auto ou acceptation livreur |
| `LOGISTICS_PARTNER` | Structure sous contrat | Partner dispatch ou auto partner |

Le checkout et la boutique configurent le mode **par défaut** ; le marchand peut basculer au dispatch.

---

## 4. Acteurs, rôles & permissions

### 4.1 Extension `Role` (Prisma)

```prisma
enum Role {
  USER
  MERCHANT
  COURIER              // livreur indépendant ou rattaché partner
  LOGISTICS_PARTNER    // owner structure logistique
  MODERATOR
  ADMIN
  SUPER_ADMIN
}
```

### 4.2 Profils métier (tables dédiées, 1 User = 1 profil actif max par type)

| Profil | Table | Description |
|--------|-------|-------------|
| **CourierProfile** | `courier_profiles` | Livreur avec KYC, véhicule, zones, stats |
| **LogisticsPartner** | `logistics_partners` | Entreprise (SIRET-like, pays, flotte) |
| **PartnerStaff** | `logistics_partner_staff` | Dispatcher / manager partner |
| **MerchantCourier** | lien shop ↔ courier interne | Livreur salarié du restaurant |

### 4.3 Matrice permissions (résumé)

| Action | Client | Livreur | Partner | Marchand | Admin |
|--------|--------|---------|---------|----------|-------|
| Noter livraison | ✅ | — | — | — | modère |
| Accepter mission | — | ✅ | ✅ (flotte) | — | — |
| Choisir zones service | — | ✅ | ✅ (zones org) | — | valide |
| Signer contrat boutique | — | — | ✅ | ✅ | arbitre |
| Dispatch manuel | — | — | ✅ | ✅ | ✅ |
| Voir gains / payouts | — | ✅ | ✅ | — | ✅ |

---

## 5. Modèle de données — évolution proposée

> **Note :** v1 documente le modèle cible ; l’implémentation sera découpée en slices (§14).

### 5.1 CourierProfile (remplace / enrichit `DeliveryCourier`)

```prisma
enum CourierStatus {
  DRAFT           // onboarding incomplet
  PENDING_REVIEW  // KYC en attente
  ACTIVE
  SUSPENDED
  OFFLINE
}

enum CourierKind {
  INDEPENDENT     // réseau plateforme
  MERCHANT_STAFF  // rattaché à un shop
  PARTNER_FLEET   // salarié / sous-traitant partner
}

model CourierProfile {
  id                String        @id @default(cuid())
  user_id           String        @unique
  kind              CourierKind   @default(INDEPENDENT)
  logistics_partner_id String?    // si PARTNER_FLEET
  merchant_id       String?       // si MERCHANT_STAFF
  country           String        @default("CI")
  city              String
  phone             String
  vehicle           DeliveryVehicle @default(MOTO)
  plate_number      String?
  status            CourierStatus @default(DRAFT)
  is_online         Boolean       @default(false)
  rating_avg        Float         @default(0)
  rating_count      Int           @default(0)
  completed_jobs    Int           @default(0)
  cancellation_rate Float         @default(0)
  current_latitude  Float?
  current_longitude Float?
  last_location_at  DateTime?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  user              User          @relation(...)
  service_zones     CourierServiceZone[]
  jobs              DeliveryJob[]
  reviews           CourierReview[]
  availability      CourierAvailability[]
}
```

**Migration depuis MVP :** mapper les `DeliveryCourier` existants vers `CourierProfile` sans `user_id` (comptes fantômes) puis inviter à lier un compte.

### 5.2 Zones de service livreur

Le livreur **choisit** où il accepte des missions — granularité alignée sur le référentiel geo existant.

```prisma
model CourierServiceZone {
  id          String   @id @default(cuid())
  courier_id  String
  city_id     String
  all_communes Boolean @default(false)
  communes    CourierServiceZoneCommune[]
  is_active   Boolean  @default(true)

  courier CourierProfile @relation(...)
  city    GeoCity        @relation(...)
}

model CourierServiceZoneCommune {
  zone_id    String
  commune_id String
  // ...
}
```

**Règle matching :** une mission est proposée à un livreur **en ligne** dont la zone couvre `Order.delivery_commune_id` (ou ville entière si `all_communes`), véhicule compatible, et SLA compatible.

Option v2 : **créneaux horaires** (`CourierAvailability` — jour, heure début/fin).

### 5.3 Structure logistique & contrats

```prisma
enum PartnerVerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
}

enum DeliveryContractStatus {
  DRAFT
  PENDING_PARTNER
  PENDING_MERCHANT
  ACTIVE
  PAUSED
  TERMINATED
}

model LogisticsPartner {
  id              String   @id @default(cuid())
  owner_user_id   String
  legal_name      String
  trade_name      String?
  slug            String   @unique
  country         String
  city            String
  phone           String
  email           String?
  logo            String?
  verification    PartnerVerificationStatus @default(UNVERIFIED)
  commission_rate Float    @default(0.15)  // part plateforme sur frais livraison
  is_active       Boolean  @default(true)
  rating_avg      Float    @default(0)
  rating_count    Int      @default(0)
  created_at      DateTime @default(now())

  owner     User @relation(...)
  staff     LogisticsPartnerStaff[]
  couriers  CourierProfile[]
  contracts DeliveryPartnerContract[]
  service_areas LogisticsPartnerServiceArea[]
}

model DeliveryPartnerContract {
  id                    String @id @default(cuid())
  shop_id               String
  logistics_partner_id  String
  status                DeliveryContractStatus @default(DRAFT)
  // Tarification négociée (override zone shop ou forfait partner)
  fee_override          Int?           // FCFA fixe par course si défini
  commission_to_partner Float?         // % des frais livraison pour le partner
  sla_eta_max_minutes   Int?
  auto_dispatch         Boolean @default(true)
  priority              Int     @default(0)
  signed_at             DateTime?
  expires_at            DateTime?
  created_at            DateTime @default(now())

  shop    Shop             @relation(...)
  partner LogisticsPartner @relation(...)

  @@unique([shop_id, logistics_partner_id])
}
```

**Parcours contrat :**
1. Partner ou marchand initie une demande
2. Négociation tarif / SLA (UI simple v1 — champs numériques)
3. Double validation → `ACTIVE`
4. Les commandes `LOGISTICS_PARTNER` du shop routent vers la flotte du partner

### 5.4 DeliveryJob enrichi

```prisma
model DeliveryJob {
  // ... champs existants ...
  fulfilment_mode     DeliveryFulfilmentMode @default(PLATFORM_RIDER)
  logistics_partner_id String?
  courier_profile_id   String?   // remplace courier_id (migration)
  assignment_mode     AssignmentMode @default(MANUAL)
  offered_at          DateTime?
  accepted_at         DateTime?
  rejected_count      Int       @default(0)
  delivery_fee_split  Json?     // { platform, partner, courier, merchant }
  proof_otp           String?
  proof_photo_url     String?
  proof_confirmed_at  DateTime?
  client_rating_id    String?   @unique
}
```

### 5.5 Notation livreur

```prisma
model CourierReview {
  id          String       @id @default(cuid())
  courier_id  String
  order_id    String       @unique
  user_id     String
  rating      Int          // 1-5
  comment     String?
  tags        String[]     // "rapide", "poli", "colis abîmé"
  status      ReviewStatus @default(PENDING)
  created_at  DateTime     @default(now())

  courier CourierProfile @relation(...)
  order   Order          @relation(...)
  user    User           @relation(...)
}
```

**Règles trust (alignées Review Engine Tome 03) :**
- Avis **verified** uniquement si `DeliveryJob.status = DELIVERED`
- Fenêtre 7 jours post-livraison
- Modération admin (comme avis produit)
- `rating_avg` recalculé à chaque approbation
- Livreur `< 3.5` après 20 courses → review manuelle ops
- Livreur `< 3.0` → suspension auto + alerte admin

---

## 6. Parcours utilisateur — synthèse

### 6.1 Client

```
Commande livraison
    → choix adresse (GeoCommune existant)
    → frais zone boutique (existant)
    → paiement
    → suivi /delivery/track/:token
    → notification push à chaque étape
    → livraison + OTP (v2) ou confirmation
    → modal notation livreur (1–5 + tags)
```

### 6.2 Livreur indépendant

```
Inscription /courier/signup
    → profil + véhicule + pièce identité (upload)
    → choix zones (carte / liste communes)
    → validation admin (PENDING_REVIEW → ACTIVE)
    → toggle En ligne / Hors ligne
    → file missions disponibles + push nouvelle course
    → Accepter (30 s timeout) → navigation pickup
    → Marquer récupéré → En route → Livré (+ photo v2)
    → historique + gains jour / semaine
```

**Dashboard livreur (`/courier/*`) — écrans v1 :**

| Route | Contenu |
|-------|---------|
| `/courier` | Mission active ou file + toggle online |
| `/courier/missions` | Historique statuts |
| `/courier/zones` | Villes / communes actives |
| `/courier/earnings` | Courses, frais, commissions |
| `/courier/profile` | Véhicule, docs, note moyenne |
| `/courier/reviews` | Avis clients |

UI **mobile-first**, PWA installable (réutiliser infra Phase 17).

### 6.3 Structure logistique

```
Inscription /logistics/signup
    → fiche entreprise + documents
    → validation admin partnerships
    → invitation livreurs flotte (/logistics/couriers/invite)
    → recherche boutiques + proposition contrat
    → dashboard dispatch multi-courses
    → analytics SLA (retard, annulations)
```

**Dashboard partner (`/logistics/*`) — écrans v1 :**

| Route | Contenu |
|-------|---------|
| `/logistics` | KPI jour + courses en cours |
| `/logistics/contracts` | Contrats boutiques (CRUD + statuts) |
| `/logistics/couriers` | Flotte, online, performance |
| `/logistics/dispatch` | Carte + assignation manuelle |
| `/logistics/settings` | Zones service org, tarifs default |

### 6.4 Marchand / boutique

Extensions de l’existant :

| Zone | Ajout |
|------|-------|
| `/merchant/shop/delivery-zones` | Mode fulfilment default (own / platform / partner) |
| Nouveau `/merchant/shop/delivery-contracts` | Contrats avec structures logistiques |
| `DeliveryDispatchPanel` | Auto-dispatch, choix partner, statut flotte |
| Paramètres shop | « Utiliser le réseau LaPlasse » toggle |

### 6.5 Admin plateforme

Extensions `/admin/delivery` + nouvelles sections :

| Route | Contenu |
|-------|---------|
| `/admin/delivery/couriers` | KYC, suspensions, stats |
| `/admin/delivery/partners` | Validation structures |
| `/admin/delivery/disputes` | Litiges livraison |
| `/admin/delivery/assignments` | Vue globale jobs + réassignation |

---

## 7. Moteur d’assignation (Orchestrator)

### 7.1 Déclenchement

À `Order.status = CONFIRMED` (ou PAID selon flow) + `delivery_type = DELIVERY` :

1. Lire `shop.delivery_fulfilment_default`
2. Créer `DeliveryJob` (existant)
3. Router selon mode :

```
MERCHANT_OWN      → notifier staff shop ; pas d’auto v1
LOGISTICS_PARTNER → si contrat ACTIVE → partner queue
PLATFORM_RIDER    → algorithme plateforme
```

### 7.2 Algorithme v1 (simple, explicable)

Score candidats = livreurs `is_online` + zone match + véhicule OK + `rating_avg ≥ seuil`

```
score = (1 / distance_pickup_km) * 0.4
      + rating_avg * 0.3
      + (1 / active_jobs) * 0.2
      + acceptance_rate * 0.1
```

- Top 3 reçoivent une **offre** (`offered_at`, timeout 30 s)
- Premier accept → `ASSIGNED`
- 3 refus / timeout → élargir rayon ou escalade admin / partner manuel

v2 : batching multi-commandes, surge pricing, ML.

### 7.3 Intégration GPS

| Phase | Comportement |
|-------|--------------|
| **Actuel (19)** | Coords simulées par statut |
| **DN-1** | Livreur envoie position via PWA (`POST /courier/location`) toutes les 15 s en mission |
| **DN-2** | App native background GPS |

Client : carte temps réel sur `/delivery/track/:token` (déjà prêt côté UI).

---

## 8. Économie & paiements

### 8.1 Décomposition frais livraison

Sur une commande avec `delivery_fee = 1500 FCFA` :

| Acteur | Part typique (configurable) |
|--------|----------------------------|
| Livreur | 70–80 % |
| Structure logistique | 10–20 % (si partner) |
| LaPlasse | 10–15 % commission |

Stocké dans `delivery_fee_split` sur le job pour audit.

### 8.2 Wallet livreur (v1 simplifié)

```prisma
model CourierWallet {
  id         String @id @default(cuid())
  courier_id String @unique
  balance    Int    @default(0)  // FCFA
  // ...
}

model CourierWalletEntry {
  id          String @id @default(cuid())
  wallet_id   String
  job_id      String?
  amount      Int
  type        WalletEntryType  // EARNING, BONUS, PENALTY, PAYOUT
  created_at  DateTime @default(now())
}
```

**Payout v1 :** manuel admin (export CSV + virement MM quand MM réel activé).  
**Payout v2 :** automatique seuil hebdo via Mobile Money.

---

## 9. Intégration technique — points d’ancrage code

### 9.1 API — nouveaux modules NestJS

```
apps/api/src/
  delivery/           # existant — orchestrator + jobs
  courier/            # profil, zones, online, missions
  logistics/          # partners, contrats, flotte
  courier-reviews/    # notation + modération
```

### 9.2 Web — nouvelles zones app

```
apps/web/src/app/
  courier/            # dashboard livreur (layout dédié CourierShell)
  logistics/          # dashboard partner (LogisticsShell)
  merchant/shop/delivery-contracts/
```

Réutiliser :
- `deliveryApi.ts`, `DeliveryMapPanel`, `DeliveryDispatchPanel`
- `GeoCity` / `GeoCommune` hooks checkout
- `NotificationQueue`, push device tokens
- Patterns `AdminShell`, `ShopSectionLayout`, `useRequireAuth`

### 9.3 Événements & notifications

| Event | Destinataire | Canal |
|-------|--------------|-------|
| `delivery.job.offered` | Livreur | Push + son |
| `delivery.job.assigned` | Client, marchand | Push |
| `delivery.location.updated` | Client (polling/SSE v2) | — |
| `delivery.proof.required` | Client | Push OTP |
| `courier.review.pending` | Client | In-app modal |
| `contract.pending_signature` | Partner / marchand | Email + push |

---

## 10. Multi-pays & conformité

- Tout profil courier / partner est **scopé `country`** (comme shops)
- Zones service = subset du référentiel geo du pays
- Un livreur CI **ne voit pas** les missions BF
- KYC : champs documents adaptables par pays (CNI, permis, carte grise)
- Contrats : mention légale locale dans PDF généré (v2)

Feature flag par pays (`delivery_network_enabled`) — BF peut n’activer que partner sans freelance v1.

---

## 11. Sécurité & fraude

| Risque | Mitigation |
|--------|------------|
| Faux livreur | KYC admin + vérif téléphone |
| GPS spoof | Corrélation vitesse / timestamps ; flag anomalies |
| Collusion note 5★ | Verified review only + modération |
| Acceptation sans livraison | OTP client ou photo obligatoire v2 |
| Multi-comptes | Device fingerprint léger + phone unique |

---

## 12. Non-objectifs v1

- App native iOS/Android dédiée (PWA d’abord)
- Routing optimisé type OR-Tools
- Livraison inter-pays
- Intégration API externe type Uber Direct (v3)
- Assurances colis / responsabilité civile automatisée

---

## 13. Dépendances

| Dépendance | Impact |
|------------|--------|
| **Mobile Money réel** | Payouts automatiques — v1 = ledger + payout manuel |
| **Geo référentiel BF/SN** | Zones livreur — seed communes requis |
| **Notifications push** | Offres missions — ✅ infra existante |
| **Module shop `delivery`** | Boutiques sans module = pas de jobs |

---

## 14. Roadmap d’implémentation — slices proposées

Découpage vertical pour intégration progressive dans LaPlasse :

### Phase DN-0 — Fondations compte livreur (2–3 sem.)

| ID | Slice | Livrable | Statut |
|----|-------|----------|--------|
| DN-0.1 | Rôle `COURIER` + `CourierProfile` + migration depuis `DeliveryCourier` | Schema + auth | ✅ |
| DN-0.2 | Onboarding `/courier/signup` + KYC upload | Web + API | ✅ |
| DN-0.3 | Zones service livreur (CRUD communes) | `/courier/zones` | ✅ |
| DN-0.4 | Toggle online + `POST /courier/location` | GPS réel PWA | ✅ |

### Phase DN-1 — Missions & dashboard livreur (2–3 sem.)

| ID | Slice | Livrable | Statut |
|----|-------|----------|--------|
| DN-1.1 | API missions : available / accept / reject / status transitions | Permissions courier | ✅ |
| DN-1.2 | UI `/courier` mission active + historique | Mobile-first | ✅ |
| DN-1.3 | Push « nouvelle course » + timeout acceptation 30 s | `DeliveryOfferService` | ✅ |
| DN-1.4 | Wallet ledger + écran gains (sans payout auto) | `/courier/earnings` | ✅ |

### Phase DN-2 — Notation & trust livreur (1 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-2.1 | `CourierReview` + modal client post-livraison | Trust | ✅ |
| DN-2.2 | Recalc rating + seuils suspension | Admin alertes | ✅ |
| DN-2.3 | Affichage note livreur tracking | Transparence | ✅ |

### Phase DN-3 — Structures logistiques (3–4 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-3.1 | `LogisticsPartner` + onboarding `/logistics/signup` | Compte org | ✅ |
| DN-3.2 | Flotte partner (inviter lier couriers `PARTNER_FLEET`) | `/logistics/fleet` | ✅ |
| DN-3.3 | `DeliveryPartnerContract` + workflow signature | Merchant + partner UI | ✅ |
| DN-3.4 | Dispatch partner + dashboard ops | `/logistics/dispatch` | ✅ |

### Phase DN-4 — Orchestration & auto-dispatch (2 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-4.1 | `fulfilment_mode` sur Order/Shop + routing job | Config marchand | ✅ |
| DN-4.2 | Algorithme assignation v1 + fallback manuel | Orchestrator | ✅ |
| DN-4.3 | Admin couriers/partners KYC | `/admin/delivery/*` enrichi | ✅ |

### Phase DN-5 — Preuve & polish (2 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-5.1 | OTP livraison client ↔ livreur | Proof | ✅ |
| DN-5.2 | Photo proof + disputes | SAV livraison | ✅ |
| DN-5.3 | SSE / polling tracking temps réel | Carte client live | ✅ |

### Phase DN-6 — ETA dynamique (2–3 sem.)

| ID | Slice | Livrable | Statut |
|----|-------|----------|--------|
| DN-6.1 | Timer prep au statut `PREPARING` | `Order.prep_*`, UI marchand/client | ✅ |
| DN-6.2 | ETA travel GPS (Haversine + véhicule) | Recalcul position livreur | ✅ |
| DN-6.3 | Surfaces UI + API `/orders/:id/eta`, track | Bandeaux client / suivi | ✅ |
| DN-6.4 | Schema Prisma `eta_arrival_at`, migrations | Order + DeliveryJob | ✅ |
| DN-6.5 | Alertes retard + KPI admin « % à l'heure » | Notifs + ops | ✅ |

**Baseline actuelle (code git) :** `DeliveryJob.eta_minutes` fixe à la création ; scoring SLA partner dans `logistics-partner-scoring.service.ts` ; pas de champs `Order.eta_*` ni service `DeliveryEtaService`.

### Phase DN-7 — Portail logistique B2B — acquisition partenaires (8–16 sem.)

> Objectif : faire du portail `/logistics/*` une **plateforme de revenus B2B** qui convainc de vraies structures de livraison de s'inscrire et d'y opérer quotidiennement — pas seulement un outil de démo interne. Voir §20 pour le détail complet.

| Tier | Slices | Durée | Statut (juin 2026) |
|------|--------|-------|---------------------|
| **Tier 1** — Conviction | DN-7.1 Landing B2B, DN-7.2 Onboarding KYC/zones, DN-7.3 Dispatch carte, DN-7.4 Finances ledger | 4–6 sem. | ⏳ partiel — **DN-7.3/7.4 ✅** (dispatch carte, finances) · landing B2B ⏳ |
| **Tier 2** — Scalabilité | DN-7.5 Équipe multi-users, DN-7.6 Flotte avancée, DN-7.7 Contrats + prospects | 6–8 sem. | ⏸ en pause |
| **Tier 3** — Enterprise | DN-7.8 Qualité/incidents, DN-7.9 API + webhooks | 8–12 sem. | **DN-7.8 ✅** · DN-7.9 ⏸ |

---

### Phase DN-6 — ETA dynamique — détail

Objectif : remplacer les estimations statiques (checkout, fiche commande, suivi) par des **horaires recalculés en continu** selon l'état réel de la commande et la position GPS du livreur.

#### DN-6.1 — Temps de préparation dynamique (priorité restaurants)

| Aspect | Spécification |
|--------|---------------|
| **Déclencheur** | Le décompte démarre au **changement de statut marchand** (`CONFIRMED` → `PREPARING`), pas à la création de la commande |
| **Source** | `Shop.estimated_prep_minutes` (défaut par vertical) + éventuel override par commande |
| **Persistance** | `Order.prep_started_at`, `Order.prep_eta_minutes` (snapshot au passage en préparation) |
| **Calcul live** | `prep_remaining = max(0, prep_eta_minutes − minutes_since(prep_started_at))` |
| **Affichage client** | « Préparation · ~12 min restantes » sur `/profile/orders/:id`, `/delivery/track/:token`, push si retard > seuil |
| **Affichage marchand** | Timer inversé dans le détail commande restaurant + alerte si dépassement SLA |

**Règles métier :**

- Food / restaurant : prep timer **obligatoire** dès `PREPARING`
- Marketplace retail : prep optionnel (0 min ou masqué) — l'ETA client = prep + livraison
- Si le marchand repasse en `READY` avant la fin du timer → prep_remaining = 0, bascule sur phase livraison

#### DN-6.2 — ETA livraison dynamique (distance livreur → client)

| Aspect | Spécification |
|--------|---------------|
| **Prérequis GPS** | `Order.delivery_latitude/longitude`, `CourierProfile.last_latitude/longitude` (ou position job) |
| **Calcul distance** | Haversine (v1) ; OSRM / Mapbox Directions en v2 si besoin trafic |
| **Vitesse effective** | Par véhicule : moto ~25 km/h, voiture ~18 km/h (Abidjan, ajustable par commune) |
| **Formule v1** | `travel_minutes = ceil(distance_km / speed_kmh × 60) + buffer_pickup_min` (2–5 min selon statut job) |
| **Heure d'arrivée** | `arrival_at = now + prep_remaining + travel_minutes` (ISO, timezone locale CI) |
| **Recalcul** | À chaque `POST /couriers/me/location` (throttle 15 s) + polling client 8 s sur suivi actif |

**Phases combinées (toutes commandes livrées) :**

```
Commande payée     → ETA = prep_estimé + quote_livraison_statique (checkout)
PREPARING          → ETA = prep_remaining + quote_livraison
READY / ASSIGNED   → ETA = buffer_retrait + travel_minutes (livreur → commerce)
PICKED_UP          → ETA = travel_minutes (livreur → client)
IN_TRANSIT         → ETA = travel_minutes recalculé (GPS live)
DELIVERED          → masquer ETA, afficher heure effective
```

#### DN-6.3 — Surfaces UI & API

| Surface | Contenu ETA |
|---------|-------------|
| Checkout | Fourchette statique (existant) — « estimé à la confirmation » |
| `/profile/orders/:id` | Bandeau : prep restant + « Arrivée estimée ~ HH:mm » |
| `/delivery/track/:token` | Carte + ETA minutes + heure d'arrivée |
| `/courier/missions` | ETA pickup + ETA dropoff pour le livreur |
| `/logistics/dispatch` | ETA assignation + ETA client (déjà partiel via `eta_minutes` job) |
| Push client | « Votre commande arrive vers 19h45 » (1 notif max / changement de fenêtre 5 min) |

**Endpoints proposés :**

- `GET /orders/:id/eta` — snapshot calculé (auth client)
- `GET /delivery/track/:token/eta` — public, lié au token
- Enrichir `DeliveryJob` : `eta_updated_at`, `eta_arrival_at`, `eta_prep_remaining_minutes`

#### DN-6.4 — Schema Prisma (ébauche)

```prisma
model Order {
  prep_started_at    DateTime?
  prep_eta_minutes   Int?
  eta_arrival_at     DateTime?   // dernière estimation globale
  eta_updated_at     DateTime?
}

model DeliveryJob {
  eta_arrival_at     DateTime?
  eta_travel_minutes Int?
  eta_updated_at     DateTime?
}
```

#### DN-6.5 — Critères d'acceptation

- [x] Restaurant : timer prep démarre au statut `PREPARING`, décompte visible client sans rechargement
- [x] Livreur en route : ETA client recalculé ≤ 30 s après mouvement GPS significatif (> 100 m)
- [x] Heure d'arrivée affichée sur suivi + détail commande pour **toutes** les commandes `DELIVERY` actives
- [x] Retard > 10 min vs ETA initial → notification client + flag ops admin
- [x] KPI « % livraisons à l'heure » alimenté par comparaison `delivered_at` vs `eta_arrival_at` (§16)

**Dépendances :** DN-0.4 (GPS livreur), DN-5.3 (polling suivi), adresses GPS checkout (baseline juin 2026).

---

## 15. Critères d’acceptation — scénarios E2E

### Scénario A — Livreur indépendant Abidjan

- [ ] Inscription, KYC validé admin
- [ ] Choisit communes Cocody + Plateau
- [ ] Passe en ligne → reçoit offre commande restaurant Cocody
- [ ] Accepte → client voit carte mise à jour
- [ ] Marque livré → client note 5★
- [ ] Gain visible dans `/courier/earnings`

### Scénario B — Restaurant avec livreur interne

- [x] Shop mode `MERCHANT_OWN`, livreur staff rattaché (`/merchant/shop/delivery-zones?tab=staff`)
- [x] Dispatch depuis `DeliveryDispatchPanel` sans file plateforme
- [ ] Tracking identique côté client (smoke test manuel)

### Scénario C — Structure « Express Abidjan » + boutique marchand

- [x] Partner vérifié, flotte `PARTNER_FLEET` (`/logistics`, seed `logistique@laplasse.ci`)
- [x] Contrat actif avec boutique (`/merchant/shop/delivery-zones?tab=partners`)
- [x] Commande → job `LOGISTICS_PARTNER` → offre flotte partner
- [ ] Commissions split enregistrées (hors scope v1)

### Scénario D — Ops admin

- [ ] Suspension livreur note < 3.0
- [ ] Vue communes non couvertes + livreurs disponibles par zone
- [ ] Réassignation manuelle job bloqué

---

## 16. Métriques produit

| KPI | Cible v1 |
|-----|----------|
| Temps acceptation médian | < 60 s |
| Taux acceptation offres | > 70 % |
| Note moyenne livreurs actifs | ≥ 4.2 |
| % livraisons à l’heure (ETA max) | ≥ 85 % |
| Courses / livreur / jour (actif) | benchmark 8–15 (food) |

PostHog : events `courier_online`, `delivery_offer_received`, `delivery_accepted`, `courier_review_submitted`, `contract_signed`.

---

## 17. Prochaines étapes documentaires

1. **Valider v1** de ce document ( produit + tech )
2. **Importer les slices DN-0 → DN-7** dans `ROADMAP_PRODUIT_V2.md` (Phase 20+)
3. **Maquettes** : `/courier` mobile + `/logistics/dispatch` + landing B2B DN-7.1 (optionnel `Docs/maquettes/`)
4. **Schema Prisma détaillé** : tickets DN-7.2/7.4/7.5 avec migrations safe
5. **Runbook lancement partenaire** : checklist onboarding + seed démo BF avant expansion

---

## 18. Glossaire

| Terme | Définition |
|-------|------------|
| **Job / Course** | Instance `DeliveryJob` liée à une commande |
| **Offre** | Proposition temporaire à un livreur avant assignation |
| **Zone service** | Aire géo où le livreur accepte des missions |
| **Zone boutique** | Aire geo + tarif défini par le marchand (`ShopDeliveryZone`) |
| **Partner** | Structure logistique B2B |
| **Fulfilment mode** | Qui exécute physiquement la livraison |
| **Service area partenaire** | Communes couvertes par une structure logistique (`LogisticsPartnerServiceArea`) |
| **Prospect** | Commerce sans contrat actif dans les communes couvertes d'un partenaire |
| **Payout** | Versement mensuel de la commission partenaire (`LogisticsPartnerPayout`) |
| **SLA breach** | Course livrée hors délai négocié (`delivered_at > assigned_at + sla_eta_max × 1.15`) |

---

## 19. Journal d'intégration (juin 2026)

| Date | Slice | Fichiers / endpoints clés |
|------|-------|---------------------------|
| 2026-06-22 | DN-0.x | `CourierProfile`, `/courier/signup`, `/courier/zones`, `POST /couriers/me/location` |
| 2026-06-22 | DN-1.1/1.2 | `CourierJobsService`, `/couriers/me/jobs/*`, `/courier/missions` |
| 2026-06-22 | GPS adresses | `UserAddress.latitude`, checkout picker, track dropoff pin |
| 2026-06-22 | DN-1.3 | `DeliveryOfferService`, champs `offered_*`, push `delivery_job_offered`, `POST …/reject` |
| 2026-06-22 | DN-1.4 | `CourierWallet`, `CourierWalletEntry`, `GET /couriers/me/wallet`, `/courier/earnings` |
| 2026-06-22 | UX nav | `nav.courier` → `/courier/signup` dans `GLOBAL_NAV_ITEMS` |
| 2026-06-22 | Sync statut client | `Order.status` ← `DELIVERED`, fix `orderUtils`, polling détail commande |
| 2026-06-22 | DN-2.1 | `CourierReview`, `POST /orders/:id/courier-review`, `CourierReviewPrompt` |
| 2026-06-22 | DN-2.3 | Note livreur sur page suivi (`/delivery/track/:token`) |
| 2026-06-22 | DN-2.2 | Modération avis livreur, recalc `rating_avg`, auto-suspend &lt; 3.0 |
| 2026-06-22 | DN-4.3 | Admin KYC livreurs `/admin/delivery/couriers`, avis `/admin/courier-reviews` |
| 2026-06-22 | DN-5.1 | OTP livraison : `proof_otp`, saisie livreur, affichage client track + commande |
| 2026-06-22 | DN-5.2 | Photo preuve livreur, `DeliveryDispute`, admin `/admin/delivery/disputes`, bouton Expédier marchand |
| 2026-06-22 | Fix offres | `OUT_FOR_DELIVERY` dans missions dispo, `reofferPendingJobs` au go-online |
| 2026-06-22 | DN-5.3 | Polling adaptatif 4s/8s sur page suivi client |
| 2026-06-22 | DN-4.1 | `DeliveryFulfilmentMode`, config boutique, routing job platform vs marchand |
| 2026-06-23 | DN-3.x | Partenaires logistiques : API `/logistics/*`, contrats shop, dispatch 3 modes, UI marchand/logistics/admin |
| 2026-06-22 | DN-4.2 | Scoring charge livreur, admin `/admin/delivery/assignments` + réassignation |
| 2026-06-23 | Portail logistique v2 | Dispatch temps réel polling + cloche notifications + UI refonte + avis livreur auto-publiés + UX commande client |

**Migrations à appliquer :** `20260622250000` … `20260623000000_delivery_stakeholders`

**Comptes démo stakeholders :** `logistique@laplasse.ci` / `Logistique2026!` — seed : `npx tsx scripts/seed-delivery-stakeholders.ts`

**Prochaine slice recommandée :** **DN-6** (ETA dynamique) ou **DN-7 Tier 1** (landing B2B + finances + carte dispatch). Script API scénarios A–D (`e2e-delivery-network.ts`) optionnel — **sans Playwright** (retiré, instabilité WSL).

---

### §19.1 — Restauration post-crash WSL (23/06/2026)

> Travail session perdu au `git restore` — **réimplémenté le 23/06/2026** (sans Playwright).

| Slice | Statut |
|-------|--------|
| DN-6.5 ETA dynamique | ✅ `delivery-eta.service.ts`, migrations, bandeaux, GPS 15s/100m |
| DN-7.3 Dispatch carte + release | ✅ `/logistics/dispatch`, Leaflet, `PATCH …/release` |
| DN-7.4 Finances | ✅ `/logistics/finances`, payouts, export CSV |
| Paramètres partner | ✅ `/logistics/settings`, logo, KYC |
| DN-7.8 Qualité | ✅ `/logistics/quality`, alertes |
| E2E API A–D | ✅ `scripts/e2e-delivery-network.ts` (HTTP, pas navigateur) |

**Migrations :** `20260623180000_delivery_split_eta`, `20260623200000_logistics_payouts`, `20260624120000_order_eta_delay`

**Prochaine slice :** DN-7.1 landing B2B, DN-7.2 wizard onboarding, DN-7.5 équipe (en pause)

---

## 20. Phase DN-7 — Portail logistique B2B (acquisition & rétention partenaires)

> **Contexte** : le portail `/logistics/*` v1 couvre les opérations de base (dispatch, flotte, stats, contrats). Pour convaincre de vraies structures de livraison (« Express Sahel », flottes restaurant, opérateurs Yango-like) de s'inscrire sur LaPlasse, il manque des couches **commerciales, financières et multi-utilisateurs** qui font la différence entre un outil de démo et une plateforme de revenus B2B.

---

### DN-7.1 — Landing B2B & page de valeur

> *Répond à : « Pourquoi rejoindre LaPlasse plutôt que gérer mes propres contrats marchands ? »*

**Objectif :** une page publique (`/logistics` sans auth, ou `/devenir-partenaire-livraison`) qui présente la proposition de valeur avant toute inscription.

| Contenu | Détail |
|---------|--------|
| **Chiffres marché** | Commerces actifs / commandes mensuelles par ville (données agrégées anonymisées) |
| **Modèle de revenus** | Commission partenaire (%), pas de frais fixes, exemple chiffré : « 30 livreurs Abidjan = ~450 000 F/mois » |
| **Simulateur gains** | Saisie flotte + ville → estimation revenus mensuels |
| **Score & visibilité** | Badge « Partenaire certifié LaPlasse » + classement ville côté marchand |
| **CTA double** | « S'inscrire maintenant » + « Demander une démo » (WhatsApp) |

**Critères d'acceptation :**
- [ ] Page accessible sans authentification, indexée SEO
- [ ] Simulateur de revenus fonctionnel (côté client, formule transparente)
- [ ] Lien présent dans la nav globale (`/logistics/signup` accessible depuis la navbar publique)
- [ ] Variables affichées dynamiques (compteur commerces/commandes depuis l'API publique)

---

### DN-7.2 — Onboarding professionnel (KYC structure)

> *Répond à : « Est-ce que cette plateforme est sérieuse ? »*

**Objectif :** wizard d'inscription en 4 étapes, remplaçant le formulaire minimal actuel.

#### Étape 1 — Identité légale
- Raison sociale + nom commercial
- RCCM / numéro fiscal (champ texte + upload scan)
- Email, téléphone, adresse siège
- **Pays depuis le sous-domaine** (`country` depuis `getCountryCode()`, non hardcodé CI)

#### Étape 2 — Flotte & véhicules
- Taille de flotte déclarée (fourchette : 1–5, 6–20, 21–100, 100+)
- Types de véhicules opérés (checkbox : moto, voiture, tricycle, vélo, camionnette)
- Zones géographiques couvertes (sélecteur communes multi-select — alimente `LogisticsPartnerServiceArea`)

#### Étape 3 — Modalités commerciales
- Tarif indicatif de livraison (optionnel, remplacé par contrat par commerce)
- SLA maximal (fourchette ETA proposée : < 30 min, < 45 min, < 60 min)
- Auto-dispatch souhaité (oui / non par défaut)
- Mode de paiement préféré pour les commissions (Mobile Money : MTN, Orange, Wave)

#### Étape 4 — Confirmation & attente
- Récapitulatif + upload documents manquants
- Statut `PENDING` visible avec checklist de validation admin
- Email de confirmation automatique

**Schema Prisma — additions :**

```prisma
model LogisticsPartner {
  // champs existants…
  fleet_size_range       String?   // "1-5", "6-20", "21-100", "100+"
  vehicle_types          String[]  // ["MOTO", "VOITURE", "TRICYCLE"]
  rccm_number            String?
  kyc_document_url       String?
  payout_method          String?   // "MTN_MOBILE_MONEY", "ORANGE_MONEY", "WAVE"
  payout_number          String?
  onboarding_step        Int       @default(0)
}

model LogisticsPartnerServiceArea {
  id                   String          @id @default(cuid())
  logistics_partner_id String
  commune_id           String
  partner              LogisticsPartner @relation(fields: [logistics_partner_id], references: [id])
  commune              GeoCommune       @relation(fields: [commune_id], references: [id])
  @@unique([logistics_partner_id, commune_id])
}
```

**Critères d'acceptation :**
- [ ] Wizard 4 étapes avec navigation avant/arrière, state persisté
- [ ] Upload document (Cloudflare R2 ou S3) + visuel dans l'admin KYC
- [ ] `country` résolu depuis le cookie/sous-domaine, pas hardcodé
- [ ] Sélecteur communes multi-pays (BF → Ouaga/Bobo, CI → Abidjan/Yamoussoukro…)
- [ ] Email de bienvenue + confirmation envoyé automatiquement

---

### DN-7.3 — Dispatch cartographique + assignation intelligente

> *Répond à : « Est-ce que je peux gérer 50 courses simultanées ? »*

**Objectif :** remplacer la liste dispatch par un vrai centre de contrôle opérationnel.

| Feature | Détail |
|---------|--------|
| **Carte live** | Livreurs en ligne (points colorés : libre / en course / hors ligne) + pins commandes PENDING |
| **Assignation suggestive** | Bouton « Meilleur livreur » → calcul Haversine distance pickup + score livreur |
| **Auto-dispatch** | Toggle global + toggle par contrat (respecte `DeliveryPartnerContract.auto_dispatch`) |
| **Alertes SLA** | Course PENDING > seuil → badge rouge + notification push dispatcher |
| **Réassignation** | Si livreur ne répond pas / refuse → sélecteur nouveau livreur depuis la carte |
| **Filtre zone** | Afficher seulement les courses dans une commune sélectionnée |

**Logique assignation suggestive (v1) :**

```
score_livreur_disponible(c, job) =
  (1 / distance_km(c.position, job.pickup)) * 0.6
  + (1 - c.active_jobs / 5)              * 0.3
  + (c.rating_avg / 5)                   * 0.1
→ top 3 suggérés, dispatcher choisit ou valide
```

**Critères d'acceptation :**
- [ ] Carte (OSM / Leaflet) avec positions livreurs temps réel (refresh 10 s)
- [ ] Pins commandes PENDING avec badge urgence si > 5 min
- [ ] Bouton « Assigner le plus proche » sur chaque course
- [ ] Toggle auto-dispatch actif/inactif (persisté en base par partenaire)
- [ ] Notification push dispatcher si PENDING > seuil configurable (défaut 5 min)
- [ ] Réassignation en 2 clics si livreur actif tombe (course rebascule PENDING)

---

### DN-7.4 — Finances & ledger partenaire

> *Répond à : « Combien j'ai gagné et quand je suis payé ? »*

**Objectif :** remplacer les estimations 30j par un vrai relevé de commissions structuré.

#### Page `/logistics/finances`

| Bloc | Contenu |
|------|---------|
| **Vue mensuelle** | Sélecteur mois/année → total courses, frais livrés, commission partenaire réelle |
| **Détail par commerce** | Tableau : boutique, nb courses, frais collectés, commission, statut payout |
| **Détail par livreur** | Tableau : livreur, nb courses, gains versés (75 %), actif / inactif |
| **Ledger** | Historique ligne par ligne (course ID, date, boutique, montant, statut) |
| **Statut payout** | `PENDING` / `PROCESSING` / `PAID` + référence virement |
| **Export** | CSV téléchargeable (filtre mois + boutique + livreur) |

**Schema Prisma — additions :**

```prisma
model LogisticsPartnerPayout {
  id                   String          @id @default(cuid())
  logistics_partner_id String
  period_start         DateTime
  period_end           DateTime
  amount               Int             // en francs CFA
  status               PayoutStatus    @default(PENDING)
  reference            String?
  paid_at              DateTime?
  note                 String?
  created_at           DateTime        @default(now())
  updated_at           DateTime        @updatedAt
  partner              LogisticsPartner @relation(fields: [logistics_partner_id], references: [id])
}

enum PayoutStatus {
  PENDING
  PROCESSING
  PAID
  FAILED
}
```

**Endpoints :**
- `GET /logistics/me/finances?month=2026-06` — ledger mensuel agrégé
- `GET /logistics/me/finances/export?month=2026-06` — CSV téléchargeable
- Admin : `POST /admin/logistics/payouts/:partnerId` — créer payout manuel

**Critères d'acceptation :**
- [ ] Ledger mensuel consultable jusqu'à 12 mois en arrière
- [ ] Détail par boutique et par livreur exportable en CSV
- [ ] Statut payout visible et mis à jour depuis l'admin
- [ ] Totaux cohérents avec `PartnerOpsService.getPartnerStats()` (vérification croisée)

---

### DN-7.5 — Équipe multi-utilisateurs (rôles)

> *Répond à : « Mon dispatcher peut-il accéder sans voir la compta ? »*

**Objectif :** permettre à une structure d'inviter des membres avec des rôles différenciés.

| Rôle | Accès |
|------|-------|
| `OWNER` | Tout (contrats, finances, équipe, paramètres) |
| `DISPATCHER` | Dispatch, flotte, commandes — pas finances ni équipe |
| `FINANCE` | Finances uniquement (lecture) — pas dispatch |

**Flux d'invitation :**
1. Owner saisit l'email → création d'un lien d'invitation tokenisé (TTL 48 h)
2. Le destinataire reçoit un email → accepte via `/logistics/invite/:token`
3. Si l'utilisateur n'a pas encore de compte LaPlasse → création compte simplifié

**Page `/logistics/settings/team` :**
- Liste des membres actifs avec rôle + date d'ajout
- Bouton « Inviter » + formulaire email + sélecteur rôle
- Bouton « Retirer » (avec confirmation)

**Schema Prisma — additions :**

```prisma
model LogisticsPartnerStaff {
  // champs existants…
  role       String   @default("DISPATCHER")  // OWNER | DISPATCHER | FINANCE
  invited_by String?
  invited_at DateTime?
}

model LogisticsPartnerInvite {
  id                   String   @id @default(cuid())
  logistics_partner_id String
  email                String
  role                 String   @default("DISPATCHER")
  token                String   @unique @default(cuid())
  expires_at           DateTime
  accepted_at          DateTime?
  created_at           DateTime @default(now())
  partner              LogisticsPartner @relation(fields: [logistics_partner_id], references: [id])
}
```

**Critères d'acceptation :**
- [ ] Owner peut inviter un dispatcher sans accès aux finances
- [ ] Lien d'invitation expirant (48 h) avec flow acceptation
- [ ] Guards API vérificant le rôle (`OWNER` uniquement pour finances & équipe)
- [ ] Page équipe consultable dans `/logistics/settings/team`

---

### DN-7.6 — Gestion de flotte avancée

> *Répond à : « Comment je gère 50 livreurs au quotidien ? »*

| Feature | Détail |
|---------|--------|
| **Invitation flotte** | Lien unique (SMS / copier-coller) : « Rejoignez la flotte [Nom] sur LaPlasse » → `/courier/signup?ref=partner:slug` |
| **Carte flotte live** | Vue GPS de tous les livreurs de la flotte en temps réel (même base que dispatch) |
| **Suspendre / réactiver** | Partenaire peut passer un livreur `SUSPENDED` sans retirer de la flotte |
| **Shift management (v2)** | Créneaux disponibles (ex. : lundi–vendredi 8h–22h) par livreur |
| **Vue livreur offline** | Alerte si livreur était en ligne et a disparu pendant une course active |

**Critères d'acceptation :**
- [ ] Lien d'invitation flotte généré depuis `/logistics/fleet` (copie dans le presse-papier)
- [ ] Lien pre-remplit le formulaire `/courier/signup` avec `logistics_partner_id`
- [ ] Partenaire peut suspendre un livreur de sa flotte sans le supprimer
- [ ] Carte flotte accessible depuis `/logistics/fleet` (même tile Leaflet que dispatch)

---

### DN-7.7 — Contrats enrichis & prospection

> *Répond à : « Comment je trouve de nouveaux clients et négocie mes tarifs ? »*

#### Fiche contrat enrichie (`/logistics/contracts/:id`)

| Champ | Détail |
|-------|--------|
| SLA négocié | `sla_eta_max_minutes` — affiché et modifiable par le partenaire |
| Tarif override | `fee_override` — tarif fixe ou % négo, visible par les 2 parties |
| Toggle auto-dispatch | Activé / désactivé pour ce contrat précis |
| Stats contrat | Nb courses 30j, CA généré, taux SLA, dernière livraison |
| Pause / résiliation | Partenaire peut suspendre temporairement (statut `PAUSED`) |

#### Marketplace inversée — `/logistics/prospects`

**Logique :** afficher les commerces (boutiques actives, vérifiées) situés dans les communes couvertes par le partenaire, sans contrat actif avec lui.

```
prospects = Shops WHERE
  commune IN partner.service_areas
  AND NOT EXISTS(contract partenaire ACTIVE)
  AND delivery_type IN ('DELIVERY')
```

- Carte des prospects + liste avec type de commerce + volume livraisons estimé
- Bouton « Proposer un partenariat » → crée un `DeliveryPartnerContract` côté partenaire (`PENDING_MERCHANT`)
- Email automatique au marchand avec profil + score du partenaire

**Critères d'acceptation :**
- [ ] Fiche contrat avec stats, SLA, tarif override, toggle auto-dispatch
- [ ] Partenaire peut mettre en pause un contrat actif
- [ ] Liste prospects dans `/logistics/prospects` filtrée sur les communes du partenaire
- [ ] Action « Proposer » depuis un prospect crée le contrat en attente côté marchand
- [ ] Email marchand avec score + lien vers profil public du partenaire

---

### DN-7.8 — Qualité & gestion des incidents

> *Répond à : « Comment je pilote la qualité de ma flotte ? »*

#### Page `/logistics/quality`

| Bloc | Contenu |
|------|---------|
| **Litiges actifs** | Liste des `DeliveryDispute` liés aux courses du partenaire + statut |
| **Incidents livreurs** | Livreurs avec cancellation_rate > seuil, rating < 4.0 |
| **SLA breach** | Courses livrées hors délai (delivered_at > assigned_at + sla_eta_max_minutes × 1.15) |
| **Alertes automatiques** | Livreur note < 3.5 → alerte → partenaire peut suspendre |
| **Historique résolutions** | Disputes clôturées avec note admin |

**Critères d'acceptation :**
- [ ] Litiges liés au partenaire visibles dans `/logistics/quality`
- [ ] Indicateur rouge si taux SLA breach > 15 % sur 30j
- [ ] Partenaire reçoit notification si livreur de sa flotte génère un litige
- [ ] Alerte livreur sous-performant (rating < 3.5 ou cancellation > 20 %)

---

### DN-7.9 — API & intégrations (Enterprise)

> *Répond à : « Est-ce que je peux brancher mon TMS existant ? »*

| Feature | Détail |
|---------|--------|
| **Clés API** | Génération depuis `/logistics/settings/api` — clé secrète hashée, scope lecture/écriture |
| **Webhooks** | `job.created`, `job.assigned`, `job.delivered`, `job.failed` → URL HTTPS configurable |
| **Lien tracking white-label** | `/delivery/track/:token?partner=express-abidjan` — affichage logo partenaire |
| **Doc OpenAPI** | Swagger `/api/docs` filtré sur les endpoints `/logistics/*` publics |

**Schema Prisma :**

```prisma
model LogisticsPartnerApiKey {
  id                   String   @id @default(cuid())
  logistics_partner_id String
  key_hash             String   @unique
  label                String?
  last_used_at         DateTime?
  created_at           DateTime @default(now())
  revoked_at           DateTime?
  partner              LogisticsPartner @relation(fields: [logistics_partner_id], references: [id])
}

model LogisticsPartnerWebhook {
  id                   String   @id @default(cuid())
  logistics_partner_id String
  url                  String
  events               String[] // ["job.created", "job.delivered"]
  is_active            Boolean  @default(true)
  created_at           DateTime @default(now())
  partner              LogisticsPartner @relation(fields: [logistics_partner_id], references: [id])
}
```

**Critères d'acceptation :**
- [ ] Génération / révocation clé API depuis `/logistics/settings/api`
- [ ] Webhook testé (`POST /logistics/me/webhooks/test`) avec payload exemple
- [ ] Livraisons avec `?partner=slug` affichent le logo de la structure dans la page de suivi
- [ ] `GET /api/logistics/v1/jobs` authentifiable par clé API (en plus du JWT)

---

### Résumé — roadmap DN-7 par tiers

#### Tier 1 — Conviction (4–6 sem.) — **priorité**

| ID | Slice | Impact |
|----|-------|--------|
| DN-7.1 | Landing B2B + simulateur revenus | Acquisition |
| DN-7.2 | Onboarding KYC/zones wizard | Crédibilité |
| DN-7.3 | Dispatch carte + assignation suggestive + alertes SLA | Rétention opérationnelle |
| DN-7.4 | Finances / ledger + export CSV | Rétention financière |

#### Tier 2 — Scalabilité (6–8 sem.)

| ID | Slice | Impact |
|----|-------|--------|
| DN-7.5 | Équipe multi-utilisateurs + rôles | Scale structure |
| DN-7.6 | Invitation flotte + carte GPS + suspend livreur | Scale flotte |
| DN-7.7 | Contrats enrichis + marketplace inversée (prospects) | Croissance commerciale |

#### Tier 3 — Enterprise (8–12 sem.)

| ID | Slice | Impact |
|----|-------|--------|
| DN-7.8 | Qualité / incidents / SLA breach | Fidélisation |
| DN-7.9 | API + webhooks + tracking white-label | Enterprise / intégrations |

---

### Métriques de succès DN-7

| KPI | Cible |
|-----|-------|
| Partenaires inscrits (60 j post-launch) | ≥ 5 structures vérifiées |
| Taux complétion onboarding | > 70 % des inscrits passent PENDING → VERIFIED |
| Rétention partenaires 90j | > 80 % encore actifs (≥ 1 course/semaine) |
| Contrats boutiques par partenaire | ≥ 3 contrats actifs en moyenne |
| Courses via partenaire logistique / total | ≥ 20 % des courses `DELIVERY` en v2 |
| Temps moyen dispatch (PENDING → ASSIGNED) | < 3 min en mode manuel |

**Dépendances :** DN-3.x (base partenaires, contrats, flotte ✅), DN-6 (ETA dynamique pour dispatch intelligent), geo communes multi-pays (BF/SN seedé ✅).

---

**Prochaine slice recommandée :** **DN-6.1–6.5** (ETA dynamique) puis **DN-7.1 / 7.4** (landing B2B + finances). Voir §19.1 pour restaurer le travail session perdu.

---

*Document rédigé pour LaPlasse — juin 2026. Version 1.3 — resync code git post-restore WSL (23/06/2026).*
