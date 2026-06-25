# Programme Force Commerciale — LaPlasse

> **Document de conception** — Vision du Responsable Commercial  
> Auteur : Rôle fictif : Directeur Commercial LaPlasse  
> Date : Juin 2026  
> Statut : **Spécification complète** — prête pour implémentation

---

## Sommaire

1. [Vision & Enjeux](#1-vision--enjeux)
2. [Périmètre des Commerciaux](#2-périmètre-des-commerciaux)
3. [Grille de Rémunération](#3-grille-de-rémunération)
4. [Niveaux et Progression](#4-niveaux-et-progression)
5. [Portail Commercial (interface dédiée)](#5-portail-commercial)
6. [Interface Admin — Gestion de la Force de Vente](#6-interface-admin)
7. [Modèle de Données (Prisma)](#7-modèle-de-données-prisma)
8. [API — Endpoints](#8-api-endpoints)
9. [Flux de Paiement des Commissions](#9-flux-de-paiement-des-commissions)
10. [Roadmap d'Implémentation](#10-roadmap-dimplémentation)

---

## 1. Vision & Enjeux

### Contexte

LaPlasse est une plateforme locale (CI, BF, SN, ...) qui connecte établissements, boutiques, livreurs et clients. Sa croissance repose sur **l'acquisition terrain** : les établissements ne s'inscrivent pas seuls. Il faut des commerciaux qui vont démarcher, convaincre, et onboarder.

### Mission des Commerciaux

Les commerciaux LaPlasse (appelés **Sales Reps** en interne) sont des agents de terrain dont la mission est :

1. **Prospecter** les établissements, boutiques, partenaires logistique et livreurs dans leur territoire.
2. **Signer** de nouveaux comptes et les accompagner jusqu'à la **vérification**.
3. **Upsell** — faire monter en abonnement les clients FREE ou STARTER.
4. **Fidéliser** leur portefeuille (surveiller le churn, réactiver les dormants).

### Indicateurs de Succès (KPIs Plateforme)

| KPI | Cible Année 1 |
|-----|---------------|
| Établissements vérifiés | +500 par pays |
| Taux de conversion FREE → payant | 25 % |
| Churn mensuel du portefeuille | < 5 % |
| Commission mensuelle médiane/rep | 75 000 FCFA |

---

## 2. Périmètre des Commerciaux

Un Sales Rep peut rattacher 4 types d'entités à son portefeuille :

| Type | Description | Critère de validation |
|------|-------------|----------------------|
| **MERCHANT** | Établissement (restaurant, hôtel, salon, etc.) | `verification_status = VERIFIED` |
| **SHOP** | Boutique e-commerce | `status = ACTIVE` |
| **LOGISTICS_PARTNER** | Société de livraison | `verification = VERIFIED` |
| **COURIER** | Livreur indépendant | `status = ACTIVE` |

> **Règle d'attribution** : une entité n'appartient qu'à **un seul** Sales Rep. Toute entité non attribuée lors de son inscription peut être revendiquée sous 30 jours. Au-delà, elle tombe dans le "pool non attribué" et l'admin peut l'assigner manuellement.

---

## 3. Grille de Rémunération

### 3.1 — Prime d'Acquisition (one-time)

Déclenchée **à la vérification** de l'entité. Le commercial touche sa prime uniquement si l'entité est validée par l'admin.

| Entité | Plan | Prime d'Acquisition |
|--------|------|---------------------|
| Merchant | FREE | 0 FCFA |
| Merchant | STARTER | **5 000 FCFA** |
| Merchant | GROWTH | **15 000 FCFA** |
| Merchant | PREMIUM | **30 000 FCFA** |
| Shop (standalone) | — | **2 500 FCFA** |
| Logistics Partner | — | **20 000 FCFA** |
| Courier | — | **1 000 FCFA** |

> **Condition de reversement** : la prime est créditée en statut `PENDING` à la vérification, puis `VALIDATED` par l'admin (à J+15 maximum), et incluse dans le versement mensuel suivant.

---

### 3.2 — Commission Récurrente (mensuelle)

Pour chaque merchant **payant** dans le portefeuille, le Sales Rep touche une commission mensuelle tant que le client reste actif.

| Plan | Commission Mensuelle | Commission Annuelle (si cycle annuel) |
|------|---------------------|---------------------------------------|
| STARTER | **1 500 FCFA/mois** | **12 000 FCFA/an** |
| GROWTH | **3 500 FCFA/mois** | **28 000 FCFA/an** |
| PREMIUM | **7 500 FCFA/mois** | **60 000 FCFA/an** |

> Ces commissions représentent environ **10 %** du prix de l'abonnement mensuel LaPlasse.  
> Calculées automatiquement le 1er de chaque mois pour tous les comptes actifs du portefeuille.

---

### 3.3 — Prime d'Upgrade

Déclenchée quand un client de son portefeuille monte de plan.

| Transition | Prime |
|------------|-------|
| FREE → STARTER | **3 000 FCFA** |
| FREE → GROWTH | **8 000 FCFA** |
| FREE → PREMIUM | **18 000 FCFA** |
| STARTER → GROWTH | **5 000 FCFA** |
| STARTER → PREMIUM | **15 000 FCFA** |
| GROWTH → PREMIUM | **10 000 FCFA** |

> **Règle anti-abus** : le client doit rester sur le nouveau plan au moins **60 jours** avant que la prime soit validée.

---

### 3.4 — Bonus de Performance

Calculés en fin de mois calendaire.

#### Volume mensuel de nouveaux merchants signés (vérifiés)

| Seuil | Bonus sur les acquisitions du mois |
|-------|------------------------------------|
| 3 – 4 nouveaux merchants | +10 % sur toutes les primes d'acquisition du mois |
| 5 – 9 nouveaux merchants | +25 % |
| 10+ nouveaux merchants | +50 % |

#### Bonus objectif mensuel (si target définie par l'admin)

| Taux d'atteinte de l'objectif | Bonus fixe |
|-------------------------------|-----------|
| 100 % | +10 000 FCFA |
| 150 % | +25 000 FCFA |
| 200 %+ | +50 000 FCFA |

---

### 3.5 — Résumé des Gains Potentiels

**Exemple — Sales Rep SENIOR avec 20 merchants actifs (mix plans)**

| Élément | Montant |
|---------|---------|
| 5 merchants PREMIUM (récurrent) | 5 × 7 500 = **37 500 FCFA** |
| 8 merchants GROWTH (récurrent) | 8 × 3 500 = **28 000 FCFA** |
| 7 merchants STARTER (récurrent) | 7 × 1 500 = **10 500 FCFA** |
| 3 nouvelles acquisitions (GROWTH) | 3 × 15 000 = **45 000 FCFA** |
| Bonus +25 % performance (3 acquis) | 3 × 15 000 × 25 % = **11 250 FCFA** |
| **Total mensuel** | **~132 250 FCFA** |

---

## 4. Niveaux et Progression

Un système de niveaux motive la progression et débloque des avantages.

| Niveau | Critère Portfolio Actif | Avantages |
|--------|------------------------|-----------|
| **JUNIOR** | 0 – 10 clients | Taux de base |
| **SENIOR** | 11 – 30 clients | +5 % sur toutes les commissions |
| **EXPERT** | 31 – 50 clients | +10 % sur toutes les commissions + priorité sur les prospects non attribués |
| **MANAGER** | 51+ clients OU manage une équipe | +15 % sur ses propres commissions + 2 % sur les commissions de son équipe |

> **Mise à jour automatique** le 1er de chaque mois en fonction du portefeuille actif du mois précédent.  
> **Rétrogradation** possible si le portefeuille descend en dessous du seuil pendant 3 mois consécutifs.

---

## 5. Portail Commercial

### 5.1 — Accès

- URL dédiée : `/sales` (espace séparé du front public et de l'admin)
- Rôle : `SALES_REP` (nouveau rôle à ajouter à `enum Role`)
- Auth : même système JWT existant
- Mobile-first : les commerciaux travaillent sur le terrain avec leur téléphone

### 5.2 — Pages du Portail

#### `/sales` — Tableau de Bord

```
┌─────────────────────────────────────────────────────┐
│ 👋 Bonjour Kouamé — SENIOR · Code SR-CI-042         │
│ Juin 2026 · Territoire : Cocody-Plateau             │
├─────────────┬──────────────┬──────────┬─────────────┤
│  Portefeuille│  Gains/mois  │ Objectif │  Niveau     │
│    28 actifs │  87 500 FCFA │  73 %    │  SENIOR     │
└─────────────┴──────────────┴──────────┴─────────────┘

📊 Performance Juin
  ▸ 4 nouvelles acquisitions  (+2 vs mai)
  ▸ 1 upgrade STARTER→GROWTH
  ▸ 1 churn (restaurant fermé)
  ▸ Objectif : 5 → 4 / 5 signés ⚠️ 1 de plus pour bonus!

💰 Gains Estimés (en cours de mois)
  ▸ Récurrentes        : 72 000 FCFA ✓ validées
  ▸ Acquisitions       : 15 000 FCFA ⏳ en attente validation
  ▸ Upgrade            :  5 000 FCFA ⏳ 48j / 60j requis
  Total estimé :  92 000 FCFA

📅 Prochain versement : 31 juillet · ~72 000 FCFA confirmés
```

#### `/sales/portfolio` — Mon Portefeuille

Liste de toutes les entités attribuées :

- Filtres : Type (Merchant / Shop / Partner / Courier) · Statut (Actif / En attente / Churné) · Plan
- Tri : par date d'acquisition, par MRR généré, par plan
- Chaque carte affiche :
  - Nom de l'entité + type + plan actuel
  - Date de signature
  - Commission générée (à vie + ce mois)
  - Statut (vert = actif, orange = en attente vérification, rouge = churné)
  - Bouton "Voir le détail"

#### `/sales/portfolio/[entityType]/[entityId]` — Détail d'une Entité

- Informations de base (nom, contact, localisation)
- Historique des commissions liées
- Timeline des événements (signature → vérification → upgrade → ...)
- Lien vers la page publique de l'entité
- Possibilité d'ajouter une note de suivi

#### `/sales/commissions` — Mes Commissions

- Tableau chronologique de toutes les commissions
- Filtres : mois, type (acquisition / récurrente / upgrade / bonus), statut
- Totaux par mois avec indicateur payé / en attente
- Export CSV (pour comptabilité personnelle)

| Mois | Acquisitions | Récurrentes | Upgrades | Bonus | Total | Statut |
|------|-------------|-------------|----------|-------|-------|--------|
| Juin | 45 000 | 72 000 | 5 000 | 11 250 | 133 250 | ⏳ En cours |
| Mai | 30 000 | 68 500 | 0 | 0 | 98 500 | ✅ Payé |
| Avr | 15 000 | 65 000 | 10 000 | 10 000 | 100 000 | ✅ Payé |

#### `/sales/prospects` — Pipeline Prospects

CRM léger pour gérer les établissements en cours de démarchage.

Colonnes Kanban :
1. **À contacter** — prospect identifié
2. **Contacté** — premier échange
3. **En discussion** — intéressé, à suivre
4. **Inscrit** — compte créé, en attente vérification
5. **Signé** ✅ — vérifié, commission déclenchée

Chaque prospect :
- Nom / téléphone / ville / type d'activité
- Notes de suivi
- Date de dernier contact
- Rappel / relance

#### `/sales/targets` — Mes Objectifs

- Objectifs du mois courant (définis par admin) et atteinte en temps réel
- Historique des mois précédents avec taux d'atteinte
- Projection de fin de mois basée sur la tendance

#### `/sales/versements` — Mes Versements

- Historique complet des paiements reçus
- Détail de chaque versement (commissions incluses)
- Statut de paiement (Wave, Orange Money, virement)
- Reçu téléchargeable (PDF)

---

## 6. Interface Admin

### Accès

Menu admin : section **"Force Commerciale"** → `/admin/sales`

### 6.1 — Vue d'Ensemble `/admin/sales`

**KPIs globaux (tous commerciaux)**

```
┌───────────┬──────────────┬──────────────┬──────────────┐
│ 12 Reps   │ 287 Clients  │ 4.2M FCFA    │ 8.3 % Churn  │
│ actifs    │ portefeuille │ commissions/m│ mensuel      │
└───────────┴──────────────┴──────────────┴──────────────┘
```

- Tableau des Sales Reps : nom, niveau, portefeuille actif, gains du mois, objectif %, actions
- Filtres : pays, territoire, niveau
- Bouton "Créer un Sales Rep"
- Bouton "Lancer le calcul mensuel" (déclenche la génération des commissions récurrentes)

### 6.2 — Gestion d'un Sales Rep `/admin/sales/[repId]`

Onglets :
- **Profil** : infos, code, territoire, niveau, manager, compte bancaire/mobile money
- **Portefeuille** : toutes les attributions avec possibilité de réattribuer à un autre rep
- **Commissions** : liste avec validation manuelle, possibilité d'annuler ou d'ajuster
- **Versements** : créer un nouveau versement, historique
- **Objectifs** : définir les objectifs mensuels
- **Performance** : graphiques d'évolution sur 6 mois

### 6.3 — Attributions `/admin/sales/attributions`

Vue globale de toutes les attributions :
- Entités non attribuées (pool) → assigner à un rep
- Conflits / demandes de réattribution
- Historique des changements d'attribution

### 6.4 — Commissions `/admin/sales/commissions`

- Vue batch : toutes les commissions du mois en cours
- Filtres : rep, type, statut
- Actions en masse : valider, annuler
- "Recalculer" : re-génère les récurrentes du mois sur la base des portfolios actifs

### 6.5 — Versements `/admin/sales/payouts`

- Générer les versements mensuels (regroupe toutes les commissions VALIDATED par rep)
- Marquer comme payé avec référence de transaction
- Export comptable CSV/Excel

### 6.6 — Classement `/admin/sales/rankings`

Leaderboard mensuel :
- Podium des 3 meilleurs reps du mois
- Tableau complet trié par gains, acquisitions, portefeuille
- Comparaison mois N vs N-1

---

## 7. Modèle de Données (Prisma)

### Ajouts au schéma existant

```prisma
// ─── Rôle Sales Rep ───────────────────────────────────────────────────────────

enum Role {
  USER
  MERCHANT
  COURIER
  MODERATOR
  ADMIN
  SUPER_ADMIN
  SALES_REP      // ← nouveau
}

// ─── Niveaux ─────────────────────────────────────────────────────────────────

enum SalesRepLevel {
  JUNIOR    // 0-10 clients actifs
  SENIOR    // 11-30
  EXPERT    // 31-50
  MANAGER   // 51+ ou manage une équipe
}

// ─── Types d'entités attribuables ────────────────────────────────────────────

enum SalesEntityType {
  MERCHANT
  SHOP
  LOGISTICS_PARTNER
  COURIER
}

enum AttributionStatus {
  PENDING    // signé, en attente vérif
  ACTIVE     // vérifié et actif
  CHURNED    // parti de la plateforme
  CANCELLED  // annulé par admin
}

// ─── Types de commissions ────────────────────────────────────────────────────

enum CommissionType {
  ACQUISITION
  RECURRING
  UPGRADE
  BONUS_PERFORMANCE
  ADJUSTMENT     // correction manuelle admin
}

enum CommissionStatus {
  PENDING    // calculée, en attente validation
  VALIDATED  // validée par admin
  PAID       // dans un versement
  CANCELLED
}

// ─── Profil Sales Rep ────────────────────────────────────────────────────────

model SalesRep {
  id            String        @id @default(cuid())
  user_id       String        @unique
  code          String        @unique // SR-CI-001
  level         SalesRepLevel @default(JUNIOR)
  territory     String?       // ville ou région couverte
  phone         String
  manager_id    String?
  payout_method String?       // "wave" | "orange_money" | "bank_transfer"
  payout_info   String?       // numéro mobile money ou IBAN
  is_active     Boolean       @default(true)
  hire_date     DateTime      @default(now())
  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt

  user         User           @relation(fields: [user_id], references: [id], onDelete: Cascade)
  manager      SalesRep?      @relation("SalesRepHierarchy", fields: [manager_id], references: [id])
  team_members SalesRep[]     @relation("SalesRepHierarchy")
  attributions SalesRepAttribution[]
  commissions  SalesRepCommission[]
  payouts      SalesRepPayout[]
  targets      SalesRepTarget[]
  prospects    SalesRepProspect[]

  @@index([user_id])
  @@index([manager_id])
  @@index([territory])
}

// ─── Attribution (portefeuille) ──────────────────────────────────────────────

model SalesRepAttribution {
  id              String            @id @default(cuid())
  sales_rep_id    String
  entity_type     SalesEntityType
  entity_id       String
  status          AttributionStatus @default(PENDING)
  signed_at       DateTime          @default(now())
  verified_at     DateTime?
  churned_at      DateTime?
  created_at      DateTime          @default(now())
  updated_at      DateTime          @updatedAt

  sales_rep   SalesRep            @relation(fields: [sales_rep_id], references: [id])
  commissions SalesRepCommission[]

  @@unique([entity_type, entity_id])
  @@index([sales_rep_id])
  @@index([entity_type, entity_id])
  @@index([status])
}

// ─── Commission ──────────────────────────────────────────────────────────────

model SalesRepCommission {
  id               String           @id @default(cuid())
  sales_rep_id     String
  attribution_id   String
  type             CommissionType
  amount           Int              // en FCFA
  currency         String           @default("XOF")
  description      String
  reference_period String?          // ex: "2026-06" pour les récurrentes
  status           CommissionStatus @default(PENDING)
  payout_id        String?
  admin_note       String?
  created_at       DateTime         @default(now())
  validated_at     DateTime?
  paid_at          DateTime?

  sales_rep   SalesRep             @relation(fields: [sales_rep_id], references: [id])
  attribution SalesRepAttribution  @relation(fields: [attribution_id], references: [id])
  payout      SalesRepPayout?      @relation(fields: [payout_id], references: [id])

  @@index([sales_rep_id, status])
  @@index([reference_period])
  @@index([payout_id])
}

// ─── Versement ───────────────────────────────────────────────────────────────

model SalesRepPayout {
  id           String       @id @default(cuid())
  sales_rep_id String
  period       String       // "2026-06"
  amount       Int
  currency     String       @default("XOF")
  status       PayoutStatus @default(PENDING)
  method       String?
  reference    String?
  note         String?
  paid_at      DateTime?
  created_at   DateTime     @default(now())
  updated_at   DateTime     @updatedAt

  sales_rep   SalesRep             @relation(fields: [sales_rep_id], references: [id])
  commissions SalesRepCommission[]

  @@index([sales_rep_id, period])
}

// ─── Objectifs ───────────────────────────────────────────────────────────────

model SalesRepTarget {
  id                 String   @id @default(cuid())
  sales_rep_id       String
  period             String   // "2026-06"
  target_merchants   Int      @default(0)
  target_shops       Int      @default(0)
  target_couriers    Int      @default(0)
  target_commission  Int      @default(0)  // FCFA
  achieved_merchants Int      @default(0)
  achieved_shops     Int      @default(0)
  achieved_couriers  Int      @default(0)
  achieved_commission Int     @default(0)
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt

  sales_rep SalesRep @relation(fields: [sales_rep_id], references: [id])

  @@unique([sales_rep_id, period])
  @@index([period])
}

// ─── Prospects (CRM léger) ───────────────────────────────────────────────────

model SalesRepProspect {
  id           String   @id @default(cuid())
  sales_rep_id String
  name         String
  phone        String?
  city         String?
  activity     String?  // type d'activité (restaurant, salon, etc.)
  stage        String   @default("TO_CONTACT")
              // TO_CONTACT | CONTACTED | IN_DISCUSSION | REGISTERED | SIGNED | LOST
  notes        String?
  next_action  DateTime?
  linked_entity_type String?  // MERCHANT | SHOP | ... (si compte créé)
  linked_entity_id   String?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  sales_rep SalesRep @relation(fields: [sales_rep_id], references: [id])

  @@index([sales_rep_id, stage])
}
```

---

## 8. API Endpoints

Toutes les routes sont sous `/api/sales` (rep connecté) et `/api/admin/sales` (admin).

### Routes Sales Rep (JWT requis, rôle SALES_REP)

```
GET    /sales/me                          → profil + stats du mois courant
GET    /sales/portfolio                   → liste des attributions (filtres: type, status)
GET    /sales/portfolio/:type/:entityId   → détail d'une entité du portefeuille
POST   /sales/portfolio/claim             → revendiquer une entité non attribuée
GET    /sales/commissions                 → liste des commissions (filtres: mois, type, status)
GET    /sales/commissions/summary         → agrégats par mois sur 6 mois
GET    /sales/payouts                     → historique des versements
GET    /sales/targets                     → objectifs du mois courant + historique
GET    /sales/prospects                   → pipeline CRM
POST   /sales/prospects                   → créer un prospect
PATCH  /sales/prospects/:id               → mettre à jour un prospect
DELETE /sales/prospects/:id               → supprimer un prospect
POST   /sales/prospects/:id/link          → lier à une entité (quand compte créé)
```

### Routes Admin (JWT requis, rôle ADMIN+)

```
GET    /admin/sales                            → vue d'ensemble + KPIs globaux
GET    /admin/sales/reps                       → liste des Sales Reps (paginée)
POST   /admin/sales/reps                       → créer un Sales Rep
GET    /admin/sales/reps/:id                   → détail d'un rep
PATCH  /admin/sales/reps/:id                   → modifier (territoire, niveau, statut, manager)
PATCH  /admin/sales/reps/:id/target            → définir les objectifs mensuels

GET    /admin/sales/attributions               → toutes les attributions (+ pool non attribué)
POST   /admin/sales/attributions               → attribuer manuellement une entité à un rep
PATCH  /admin/sales/attributions/:id/reassign  → réattribuer à un autre rep

GET    /admin/sales/commissions                → toutes les commissions (filtres: rep, mois, type)
POST   /admin/sales/commissions/generate       → générer les récurrentes du mois
PATCH  /admin/sales/commissions/:id/validate   → valider une commission
PATCH  /admin/sales/commissions/:id/cancel     → annuler une commission
POST   /admin/sales/commissions/bulk-validate  → validation en masse

GET    /admin/sales/payouts                    → tous les versements
POST   /admin/sales/payouts/generate           → générer les versements du mois (1 par rep)
PATCH  /admin/sales/payouts/:id/mark-paid      → marquer comme payé
GET    /admin/sales/rankings                   → classement mensuel
```

### Hooks automatiques (NestJS Events)

Ces actions se déclenchent automatiquement via des **event listeners** :

| Événement | Action déclenchée |
|-----------|-------------------|
| `merchant.verified` | Créer commission ACQUISITION pour le rep attribué |
| `merchant.subscription.upgraded` | Créer commission UPGRADE (statut PENDING, délai 60j) |
| `shop.activated` | Créer commission ACQUISITION Shop |
| `logistics_partner.verified` | Créer commission ACQUISITION Partner |
| `courier.approved` | Créer commission ACQUISITION Courier |
| `merchant.churned` | Marquer attribution CHURNED, arrêter les récurrentes |
| `cron: 1er du mois 00:01` | Générer toutes les commissions RECURRING |
| `cron: 1er du mois 00:30` | Mettre à jour les niveaux (JUNIOR/SENIOR/EXPERT/MANAGER) |
| `cron: 1er du mois 06:00` | Calculer les bonus de performance du mois précédent |

---

## 9. Flux de Paiement des Commissions

### Cycle mensuel

```
J1 du mois M
  ↓
[CRON] Génération des commissions RECURRING
  → Pour chaque attribution ACTIVE avec abonnement payant
  → Montant selon grille 3.2
  → Statut : PENDING

J1–J5 du mois M
  ↓
[ADMIN] Validation batch des commissions PENDING
  → Vérification des attributions
  → Validation ou annulation (ex: client churned en cours de mois)
  → Statut → VALIDATED

J5 du mois M
  ↓
[CRON] Calcul des bonus de performance (basé sur mois M-1)
  → Application des multiplicateurs
  → Commissions BONUS_PERFORMANCE créées + VALIDATED directement

J5–J10 du mois M
  ↓
[ADMIN] Génération des versements
  → Regroupement par rep de toutes les commissions VALIDATED
  → Création SalesRepPayout (1 par rep)
  → Statut : PENDING

J10–J15 du mois M
  ↓
[ADMIN / Comptabilité] Paiement physique
  → Wave, Orange Money, ou virement bancaire
  → Marquage PAID avec référence transaction
  → Commissions liées → PAID
  → Email de notification au rep

J15 : Deadline maximum de paiement des récurrentes
```

### Cas spéciaux

| Cas | Traitement |
|-----|-----------|
| Nouveau rep en milieu de mois | Commission proratisée (j restants / 30) |
| Client upgrade vérifié à J+60 | Déblocage automatique de la commission UPGRADE |
| Client churn en cours de mois | Récurrente calculée pro-rata si > 15j actif |
| Commission contestée | Admin peut annuler et recréer avec montant ajusté |
| Rep qui quitte LaPlasse | Commissions VALIDATED sont payées, récurrentes stoppées |

---

## 10. Roadmap d'Implémentation

### Phase 1 — Socle (Sprint 1-2, ~2 semaines)

**Backend :**
- [ ] Migration Prisma : ajout `SALES_REP` au rôle, nouveaux modèles
- [ ] Module NestJS `SalesModule` (controller + service + events)
- [ ] Endpoints CRUD SalesRep (admin)
- [ ] Système d'attribution (créer, revendiquer, réattribuer)
- [ ] Event listeners sur merchant.verified, courier.approved, etc.
- [ ] Génération des commissions d'acquisition

**Frontend Admin :**
- [ ] Page `/admin/sales` — vue d'ensemble
- [ ] Page `/admin/sales/reps` — liste + création
- [ ] Page `/admin/sales/reps/[id]` — détail + attributions
- [ ] Mise à jour nav admin

### Phase 2 — Rémunération (Sprint 3-4, ~2 semaines)

**Backend :**
- [ ] CRON : génération commissions récurrentes (1er du mois)
- [ ] CRON : calcul bonus de performance
- [ ] CRON : mise à jour des niveaux
- [ ] Validation batch des commissions (admin)
- [ ] Génération et paiement des versements

**Frontend Admin :**
- [ ] Page `/admin/sales/commissions`
- [ ] Page `/admin/sales/payouts`
- [ ] Page `/admin/sales/rankings`

### Phase 3 — Portail Sales Rep (Sprint 5-6, ~2 semaines)

**Frontend :**
- [ ] Layout `/sales` avec navigation dédiée
- [ ] Page `/sales` — dashboard
- [ ] Page `/sales/portfolio`
- [ ] Page `/sales/commissions`
- [ ] Page `/sales/payouts`
- [ ] Page `/sales/targets`

### Phase 4 — CRM & Optimisations (Sprint 7, ~1 semaine)

**Frontend :**
- [ ] Page `/sales/prospects` — pipeline Kanban
- [ ] Notifications push/email pour événements importants
- [ ] Export CSV commissions et versements
- [ ] PWA (accès hors ligne pour le pipeline)

### Phase 5 — Analytics & Rapports (Sprint 8+)

- [ ] Rapport mensuel automatique par email pour chaque rep
- [ ] Tableaux de bord Recharts dans l'admin
- [ ] Prévisions de commissions basées sur le pipeline
- [ ] API webhook pour synchronisation comptable externe

---

## Annexe A — Grille de Commissions (Résumé)

| Type | Entité / Plan | Montant |
|------|---------------|---------|
| Acquisition | Merchant FREE | 0 |
| Acquisition | Merchant STARTER | 5 000 FCFA |
| Acquisition | Merchant GROWTH | 15 000 FCFA |
| Acquisition | Merchant PREMIUM | 30 000 FCFA |
| Acquisition | Shop standalone | 2 500 FCFA |
| Acquisition | Logistics Partner | 20 000 FCFA |
| Acquisition | Courier | 1 000 FCFA |
| Récurrente | STARTER / mois | 1 500 FCFA |
| Récurrente | GROWTH / mois | 3 500 FCFA |
| Récurrente | PREMIUM / mois | 7 500 FCFA |
| Récurrente | STARTER / an | 12 000 FCFA |
| Récurrente | GROWTH / an | 28 000 FCFA |
| Récurrente | PREMIUM / an | 60 000 FCFA |
| Upgrade | FREE → STARTER | 3 000 FCFA |
| Upgrade | FREE → GROWTH | 8 000 FCFA |
| Upgrade | FREE → PREMIUM | 18 000 FCFA |
| Upgrade | STARTER → GROWTH | 5 000 FCFA |
| Upgrade | STARTER → PREMIUM | 15 000 FCFA |
| Upgrade | GROWTH → PREMIUM | 10 000 FCFA |
| Bonus perf | +3 acquis/mois | +10 % acquisitions |
| Bonus perf | +5 acquis/mois | +25 % acquisitions |
| Bonus perf | +10 acquis/mois | +50 % acquisitions |
| Bonus objectif | Objectif 100 % | +10 000 FCFA |
| Bonus objectif | Objectif 150 % | +25 000 FCFA |
| Bonus objectif | Objectif 200 %+ | +50 000 FCFA |

---

## Annexe B — Code de conduite & Règles Anti-fraude

1. **Attribution exclusive** : une entité = un seul rep. Toute tentative de contournement (faire créer un compte par un tiers) est sanctionnée par la suppression du compte et la perte des commissions en cours.

2. **Délai de grâce** : un client doit rester actif **30 jours** avant que l'acquisition soit validée, et **60 jours** après un upgrade.

3. **Churn inversé** : si un client churne avant 3 mois, la prime d'acquisition est remboursée (déduite du versement suivant).

4. **Transparence** : chaque rep peut voir en temps réel le détail de toutes ses commissions et leur statut. Aucune commission ne peut être annulée sans notification et motif explicite.

5. **Contestation** : un rep dispose de **10 jours** après publication du versement pour contester une commission via l'interface. L'admin répond sous 5 jours ouvrés.

---

*Ce document est la référence officielle du programme commercial LaPlasse. Il sera mis à jour trimestriellement en fonction des retours terrain et des objectifs de croissance.*
