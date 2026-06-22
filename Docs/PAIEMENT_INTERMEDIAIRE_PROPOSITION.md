# Logique intermédiaire de paiement — proposition

> Document de référence produit — LaPlasse en tant que marketplace intermédiaire (réservations spa, hôtel, etc.).  
> **Statut :** proposition (juin 2026) — à implémenter avec le branchement Mobile Money réel.

---

## 1. Contexte

Aujourd'hui LaPlasse encaisse les réservations via un **simulateur** : le flux crée une `PaymentTransaction` (`purpose: BOOKING`), confirme la réservation, mais **aucun fonds n'est réellement détenu ni reversé** au marchand. L'annulation client ne déclenche pas de remboursement automatique.

Ce document décrit le modèle cible lorsque LaPlasse deviendra **intermédiaire de paiement** (collecte client → séquestre → release marchand / remboursement).

---

## 2. Flux cible (vue d'ensemble)

```
Client paie (MM)
    → LaPlasse encaisse (compte plateforme)
    → Statut settlement: HELD (séquestre)
    → Réservation CONFIRMED

Prestation réalisée (COMPLETED)
    → RELEASE vers marchand (− commission LaPlasse)

Annulation dans les délais
    → REFUND client (total ou partiel selon policy)

No-show
    → RELEASE pénalité au marchand (selon no_show_policy)
```

---

## 3. États métier proposés

### Booking (existant, enrichi)

| Statut | Signification |
|--------|---------------|
| `PENDING` | Demande créée, paiement en attente |
| `CONFIRMED` | Payée et/ou confirmée par le marchand |
| `COMPLETED` | Prestation consommée / séjour terminé |
| `CANCELLED` | Annulée |
| `NO_SHOW` | Client absent |

### Paiement — nouveau `settlement_status`

| Statut | Signification |
|--------|---------------|
| `NONE` | Pas encore payé |
| `HELD` | Encaissé, retenu par LaPlasse |
| `RELEASED` | Versé au marchand (net commission) |
| `REFUNDED` | Remboursé intégralement au client |
| `PARTIAL` | Remboursement partiel (annulation tardive) |

### Matrice événements

| Événement | Booking | Payment status | Settlement |
|-----------|---------|----------------|------------|
| Paiement OK à la résa | CONFIRMED | SUCCESS | HELD |
| Marchand marque terminé | COMPLETED | SUCCESS | RELEASED |
| Annulation client (délai OK) | CANCELLED | SUCCESS | REFUNDED |
| Annulation tardive | CANCELLED | SUCCESS | PARTIAL |
| No-show | NO_SHOW | SUCCESS | RELEASED (pénalité) |
| Litige ouvert | — | SUCCESS | HELD (gel) |

---

## 4. Quand libérer les fonds ?

| Vertical | Moment du release | Justification |
|----------|-------------------|---------------|
| **Spa / RDV / beauté** | `COMPLETED` (bouton marchand) ou **auto J+1** après le créneau | Service consommé sur place |
| **Hôtel / résidence** | **Check-out** + délai litige 24–48 h | Risque annulation avant séjour |
| **Restaurant (table)** | Après le créneau ou no-show | Similaire spa |
| **Pharmacie / consultation** | `COMPLETED` | RDV honoré |

**Recommandation MVP :** release manuel marchand (`COMPLETED`) + cron **auto-release J+1** si oubli.

---

## 5. Commission LaPlasse

Exemple prestation spa 25 000 F, acompte 30 % :

```
Montant prestation     = 25 000 F
Acompte collecté (30%) =  7 500 F
Commission LP (10%)    =    750 F (sur montant libéré)
Net marchand           =  6 750 F au release
Solde 70 %             = 17 500 F → sur place OU second prélèvement post-prestation
```

**Deux modèles produit :**

1. **Acompte en ligne** (Planity-like) — solde au spa ; commission LP sur l'acompte uniquement.
2. **Paiement intégral en ligne** (Airbnb-like) — LP reverse tout le net après prestation.

Paramètre marchand suggéré : `deposit_percent` (déjà en place) + futur `online_payment_mode: DEPOSIT | FULL`.

---

## 6. Policies structurées (complément texte libre)

Les champs texte `cancellation_policy` / `no_show_policy` restent pour l'affichage client.  
Pour l'automatisation des remboursements, ajouter :

```prisma
// MerchantBookingSettings (futur)
cancellation_hours_before  Int?   // ex. 24 = annul gratuite si > 24 h avant
cancellation_fee_percent   Int?   // ex. 50 % si annul tardive
no_show_fee_percent        Int?   // ex. 100 % de l'acompte conservé
refund_policy_mode         String // MANUAL | AUTO (auto quand MM branché)
```

Le moteur lit ces valeurs à l'annulation et calcule REFUNDED vs PARTIAL vs RELEASED.

---

## 7. Schéma Prisma suggéré (phase MM)

```prisma
enum PaymentSettlementStatus {
  NONE
  HELD
  RELEASED
  REFUNDED
  PARTIAL
}

model PaymentTransaction {
  // ... champs existants
  settlement_status   PaymentSettlementStatus @default(NONE)
  released_at         DateTime?
  refunded_at         DateTime?
  refund_amount       Int?
  merchant_payout_id  String?
}

model MerchantPayout {
  id           String   @id @default(cuid())
  merchant_id  String
  amount       Int
  currency     String   @default("XOF")
  status       String   // PENDING | SENT | FAILED
  reference    String   @unique
  created_at   DateTime @default(now())
  sent_at      DateTime?
}
```

Ledger interne (journal des mouvements HELD → RELEASED / REFUNDED) recommandé pour audit et rapprochement comptable.

---

## 8. Prérequis avant Mobile Money réel

1. **Compte marchand** — Wave Business, Orange Money Merchant, ou virement bancaire.
2. **KYC marchand** — obligation réglementaire intermédiaire UEMOA.
3. **Webhooks MM** — confirmation paiement + statut remboursement.
4. **Moteur policy** — `cancellation_hours_before`, `no_show_fee_percent`.
5. **Dashboard admin** — suivi des HELD, litiges, payouts en attente.
6. **CGU / mandat** — LaPlasse agit en mandataire de paiement ; commission et délais de reversement explicites.

---

## 9. Phases d'implémentation recommandées

| Phase | Scope | Dépendances |
|-------|-------|-------------|
| **1** | Encaissement MM réel, fonds sur compte LaPlasse, pas de reversement auto | Partenaire MM |
| **2** | `settlement_status` + release à COMPLETED + remboursement annulation manuel admin | Phase 1 |
| **3** | Policies structurées + remboursement auto + auto-release J+1 | Phase 2 |
| **4** | Litiges, commission dynamique par vertical, payout batch marchands | Phase 3 |

---

## 10. État actuel du code (juin 2026)

| Capacité | Statut |
|----------|--------|
| `require_payment` + `deposit_percent` sur settings | ✅ |
| `PaymentPurpose.BOOKING` + lien `booking_id` | ✅ |
| Paiement simulateur → CONFIRMED | ✅ |
| Annulation sans remboursement | ✅ (gap volontaire) |
| Séquestre / release / payout | ❌ |
| Remboursement MM | ❌ |

---

*Maintenir ce document à jour lors du branchement Mobile Money et de la mise en place du ledger de règlement.*
