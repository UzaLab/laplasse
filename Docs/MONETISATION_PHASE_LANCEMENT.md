# Monétisation — phase lancement

> Document interne équipe. Ne pas afficher de messages « plan requis » ou limitations sur les pages publiques.

## Contexte

Avant la communication commerciale sur les abonnements, **toutes les fonctionnalités sont débloquées** pour tous les utilisateurs (établissements marchands et boutiques standalone).

## Flag central

| Couche | Fichier | Constante |
|--------|---------|-----------|
| API | `apps/api/src/common/plan-limits.ts` | `PLANS_GATING_ENABLED = false` |
| Web | `apps/web/src/lib/planLimits.ts` | `PLANS_GATING_ENABLED = false` |

Quand le flag est `false`, `getPlanLimits()` / `getEffectivePlanLimits()` renvoient les limites **Premium** (tout activé).

## Parité boutique standalone

Les boutiques sans `merchant_id` ont accès aux mêmes écrans de gestion que les boutiques liées :

- Promotions (`/shop/manage/promotions`) — API via `shopId` query param
- Statistiques (`/shop/manage/analytics`)
- CRM, collections, livraison, visibilité, etc.

Côté données, les promotions standalone sont stockées avec `merchant_id = null` et `shop_id` renseigné.

## Réactivation de la monétisation (checklist)

1. Passer `PLANS_GATING_ENABLED` à `true` dans **API** et **Web**.
2. Vérifier les écrans marchands : prestations, chambres, médias, publicité, signup multi-sites.
3. Vérifier `ShopShell` / parcours standalone si certaines features doivent rester ouvertes au lancement produit.
4. Mettre à jour la page `/merchant/plans` et les flux de paiement abonnement.
5. Tester les guards API (`PlanGuard`) et messages `planLimitMessage`.
6. Communiquer sur le modèle économique (Starter / Growth / Premium).

## Fichiers sensibles

- `apps/api/src/common/plan-limits.ts` — définition des plans et limites
- `apps/api/src/common/guards/plan.guard.ts`
- `apps/web/src/lib/planLimits.ts`
- `apps/api/src/promotions/promotions.service.ts` — promos standalone
- `apps/api/src/shops/shops.service.ts` — CRM boutique

## Notes

- La page `/merchant/plans` reste accessible pour prévisualisation ; elle n’impose rien tant que le gating est désactivé.
- Les notifications `subscription_upgraded` restent en place pour plus tard.
