import {
  getActiveShopIdForManage,
  type ShopSummary,
} from './shopApi'

export interface MerchantOrderScope {
  shopId: string | null
  merchantId: string | null
}

export interface MerchantOrderRoutes {
  orders: string
  orderDetail: (id: string) => string
}

export const FOOD_ORDER_ROUTES: MerchantOrderRoutes = {
  orders: '/merchant/orders',
  orderDetail: id => `/merchant/orders/${id}`,
}

/** Commandes boutique (produits) — standalone ou boutique liée à un établissement. */
export function buildShopOrderScope(
  activeMerchantId: string | null | undefined,
  shops: ShopSummary[] | undefined,
  activeShopId: string | null | undefined,
): MerchantOrderScope {
  return {
    shopId: getActiveShopIdForManage(shops, activeMerchantId, activeShopId),
    merchantId: null,
  }
}

/** Commandes menu (food) — établissement uniquement. */
export function buildFoodOrderScope(
  activeMerchantId: string | null | undefined,
): MerchantOrderScope {
  return {
    shopId: null,
    merchantId: activeMerchantId ?? null,
  }
}

/** @deprecated Préférer buildShopOrderScope ou buildFoodOrderScope selon le contexte. */
export function buildMerchantOrderScope(
  activeMerchantId: string | null | undefined,
  shops: ShopSummary[] | undefined,
  activeShopId: string | null | undefined,
): MerchantOrderScope {
  return buildShopOrderScope(activeMerchantId, shops, activeShopId)
}

/** Ajoute shopId ou merchantId à un chemin API commandes marchand. */
export function withOrderScope(path: string, scope: MerchantOrderScope): string {
  const [base, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  if (scope.shopId) {
    params.set('shopId', scope.shopId)
    params.delete('merchantId')
  } else if (scope.merchantId) {
    params.set('merchantId', scope.merchantId)
    params.delete('shopId')
  }
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
