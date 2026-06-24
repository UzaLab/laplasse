# Admin Dashboard — Analyse & plan de mise à niveau

> Date : 2026-06-24 · Statut : **Phase 2 livrée** (Phase 3 à planifier)

---

## 1. Résumé exécutif

L'espace `/admin` est une **console d'ops partiellement aboutie** : le backend couvre significativement plus que l'UI, et le shell visuel date d'une passe design antérieure aux dashboards marchand / livreur / logistique.

| Dimension | État initial |
|-----------|--------------|
| Routes | 18 pages sous `/admin` |
| Shell | `AdminShell` — sidebar sombre, pas de `layout.tsx` partagé |
| Backend | `AdminController` + `FraudController` — rôles `ADMIN` / `SUPER_ADMIN` |
| Couverture UI | ~60 % des endpoints admin ont une interface |

**Objectif** : aligner l'UI/UX sur le design system des dashboards métier, compléter les features admin manquantes, et centraliser la navigation / auth via un layout Next.js unique.

---

## 2. Architecture actuelle

```
apps/web/src/
├── app/admin/                    # 18 pages, chacune wrap AdminShell manuellement
├── features/admin/
│   ├── components/AdminShell.tsx
│   └── hooks/useAdminSession.ts
└── lib/adminApi.ts
```

**Problèmes structurels**

- Pas de `app/admin/layout.tsx` → duplication, pages orphelines (`/admin/fraud`, `/admin/audit`)
- `AdminShell` par page → risque d'incohérence
- `adminApi.ts` = thin wrapper sans typage métier

---

## 3. Inventaire des pages

### Intégrées au shell (16)

| Zone | Pages | Fonction |
|------|-------|----------|
| Principal | Dashboard, Growth | KPIs, graphiques, recalc trust score |
| Catalogue | Merchants, Catégories, Geo, Pays, Delivery hub, Couriers KYC | Vérif, CRUD geo, ops livraison |
| Modération | Avis (3 types), Litiges, Assignations, Signalements, Users | Modération + liste users read-only |

### Orphelines / incomplètes

| Page | Problème |
|------|----------|
| `/admin/fraud` | Pas de `AdminShell`, auth manuelle |
| `/admin/audit` | Idem |
| `/admin/delivery/partners` | Absente de la sidebar |

---

## 4. Écarts UI/UX vs dashboards métier

| Critère | Admin (avant) | Merchant / Courier / Logistics |
|---------|---------------|--------------------------------|
| Sidebar | Sombre `slate-900`, `w-64` | Clair `white`, `w-72` |
| Item actif | `bg-brand-500/10 text-brand-400` | `bg-slate-900 text-white` + icône colorée |
| Header | `h-14`, blanc plat | `h-[72px]`, `backdrop-blur-md` |
| Mobile | Overlay sidebar seulement | Sidebar + bottom nav |
| Notifications | Bell statique | `NotificationBell` |
| Logout | Absent | Présent |
| Layout Next | Aucun | — |

**Accent admin proposé** : violet (`violet-500` / `violet-600`) — distinct du marchand (amber), livreur (emerald), logistique (indigo).

---

## 5. API backend sans UI

| Endpoint | Feature admin à créer |
|----------|----------------------|
| `GET/PATCH marketplace/spotlight` | Gestion spotlight marketplace |
| `PATCH shops/:id/marketplace-featured` | Boutiques à la une |
| `POST sync-search` | Reindex Meilisearch |
| `POST seed-marketplace`, `seed-multipays` | Outils ops (SUPER_ADMIN) |
| `POST users/set-password` | Reset password utilisateur |
| `POST/GET logistics/payouts/:partnerId` | Payouts partenaires |
| `POST merchants/:id/trust-score/recalculate` | Recalc unitaire |

---

## 6. Capacités manquantes (priorisées)

### P0 — Contrôle opérationnel

- File de modération unifiée
- Gestion utilisateurs (rôles, suspension, reset password)
- Marketplace control (spotlight, featured)
- Ops système (reindex, health, seeds)

### P1 — Pilotage business

- Commandes & paiements globaux
- Abonnements marchands
- Supervision campagnes ads
- Analytics export CSV

### P2 — Gouvernance

- SUPER_ADMIN vs ADMIN différenciés
- Audit avancé (filtres, export)
- Settings plateforme (frais, pays, feature flags)
- Support (impersonation lecture seule)

---

## 7. Roadmap

### Phase 1 — Fondations UI ✅

- [x] Documenter l'analyse (ce fichier)
- [x] `app/admin/layout.tsx` + `AdminShell` refondu (sidebar claire, header 72px)
- [x] `AdminMobileNav` + logout + `NotificationBell`
- [x] Nav : fraud, audit, partners, system
- [x] Retirer `AdminShell` des pages individuelles
- [x] Page `/admin/system` (ops de base)

### Phase 2 — Quick wins API ✅ en cours

- [x] Page **Marketplace** (`/admin/marketplace`) — spotlight limit + featured shops
- [x] **Users** enrichi — recherche, filtre rôle, reset password (SUPER_ADMIN)
- [x] **Audit** avec filtres action / entité / recherche
- [x] **Dashboard** — graphique recherches réel (growth API), file modération unifiée
- [ ] Inbox modération dédiée `/admin/moderation` (Phase 3)

### Phase 3 — Contrôle plateforme

- Inbox modération unifiée
- Supervision campagnes ads
- Vue commandes / paiements
- Payouts logistique
- Permissions SUPER_ADMIN

### Phase 4 — Pilotage avancé

- Settings plateforme, export analytics, impersonation

---

## 8. Structure cible

```
app/admin/
├── layout.tsx              # AdminShell + useAdminSession
├── page.tsx                # Dashboard
├── system/page.tsx         # Ops (sync search, seeds)
├── moderation/             # Phase 2 — inbox unifiée
├── marketplace/            # Phase 2
└── ... (pages existantes)
```

---

## 9. Fichiers clés

| Fichier | Rôle |
|---------|------|
| `features/admin/components/AdminShell.tsx` | Shell principal |
| `features/admin/components/AdminMobileNav.tsx` | Nav mobile |
| `features/admin/adminNav.ts` | Config navigation partagée |
| `features/admin/hooks/useAdminSession.ts` | Guard ADMIN/SUPER_ADMIN |
| `lib/adminApi.ts` | Client API admin |
| `apps/api/src/admin/admin.controller.ts` | Endpoints backend |

---

## 10. Changelog

| Date | Changement |
|------|------------|
| 2026-06-24 | Phase 2 : marketplace, users reset MDP, audit filtres, dashboard graphiques réels |
| 2026-06-24 | Phase 1 : shell clair, layout, mobile nav, system, fraud/audit intégrés |
