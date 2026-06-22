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
| **Coursiers admin** | `DeliveryCourier` (nom, téléphone, ville, véhicule) — **sans compte User** |
| **Dispatch marchand** | `DeliveryDispatchPanel` — choix coursier + lien tracking |
| **Tracking client** | `/delivery/track/:token` + carte OSM (GPS simulé / coords statut) |
| **Notifications** | Push client à chaque changement de statut |
| **Admin ops** | `/admin/delivery` (stats zones, communes non couvertes) |
| **Géo** | `GeoCity` / `GeoCommune` multi-pays (CI, BF, SN) |

### ❌ Manques structurants

- Pas de **compte livreur** ni dashboard dédié
- Pas de **notation livreur** ni trust score livreur
- Pas de **zones de service livreur** (choix communes / créneaux)
- Pas de **structure logistique** (entreprise, flotte, contrats)
- Pas d’**assignation automatique** ni file d’attente (task queue)
- Pas de **preuve de livraison** (OTP, photo)
- Pas de **rémunération / wallet livreur**
- Coursiers créés implicitement — pas d’onboarding KYC

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

| ID | Slice | Livrable |
|----|-------|----------|
| DN-0.1 | Rôle `COURIER` + `CourierProfile` + migration depuis `DeliveryCourier` | Schema + auth |
| DN-0.2 | Onboarding `/courier/signup` + KYC upload | Web + API |
| DN-0.3 | Zones service livreur (CRUD communes) | `/courier/zones` |
| DN-0.4 | Toggle online + `POST /courier/location` | GPS réel PWA |

### Phase DN-1 — Missions & dashboard livreur (2–3 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-1.1 | API missions : available / accept / reject / status transitions | Permissions courier |
| DN-1.2 | UI `/courier` mission active + historique | Mobile-first |
| DN-1.3 | Push « nouvelle course » + timeout acceptation | Queue |
| DN-1.4 | Wallet ledger + écran gains (sans payout auto) | `/courier/earnings` |

### Phase DN-2 — Notation & trust livreur (1 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-2.1 | `CourierReview` + modal client post-livraison | Trust |
| DN-2.2 | Recalc rating + seuils suspension | Admin alertes |
| DN-2.3 | Affichage note livreur tracking + dispatch | Transparence |

### Phase DN-3 — Structures logistiques (3–4 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-3.1 | `LogisticsPartner` + onboarding `/logistics/signup` | Compte org |
| DN-3.2 | Flotte partner (inviter lier couriers `PARTNER_FLEET`) | `/logistics/couriers` |
| DN-3.3 | `DeliveryPartnerContract` + workflow signature | Merchant + partner UI |
| DN-3.4 | Dispatch partner + dashboard ops | `/logistics/dispatch` |

### Phase DN-4 — Orchestration & auto-dispatch (2 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-4.1 | `fulfilment_mode` sur Order/Shop + routing job | Config marchand |
| DN-4.2 | Algorithme assignation v1 + fallback manuel | Orchestrator |
| DN-4.3 | Admin couriers/partners KYC | `/admin/delivery/*` enrichi |

### Phase DN-5 — Preuve & polish (2 sem.)

| ID | Slice | Livrable |
|----|-------|----------|
| DN-5.1 | OTP livraison client ↔ livreur | Proof |
| DN-5.2 | Photo proof + disputes | SAV livraison |
| DN-5.3 | SSE / polling tracking temps réel | Carte client live |

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

- [ ] Shop mode `MERCHANT_OWN`, livreur staff rattaché
- [ ] Dispatch depuis `DeliveryDispatchPanel` sans file plateforme
- [ ] Tracking identique côté client

### Scénario C — Structure « Express Sahel » + boutique Ouaga

- [ ] Partner vérifié, 5 motos en flotte
- [ ] Contrat signé avec boutique mode
- [ ] Commande BF → job routé partner → dispatcher assigne ou auto
- [ ] Commissions split enregistrées

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
2. **Importer les slices DN-0 → DN-5** dans `ROADMAP_PRODUIT_V2.md` (Phase 20+)
3. **Maquettes** : `/courier` mobile + `/logistics/dispatch` (optionnel `Docs/maquettes/`)
4. **Schema Prisma détaillé** : ticket DN-0.1 avec migration safe depuis MVP

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

---

*Document rédigé pour LaPlasse — juin 2026. Version 1.0 — à iterer avant decoupe roadmap.*
