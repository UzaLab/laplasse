import { getActiveMerchantShopId, type ShopSummary } from './shopApi'

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

export function buildMerchantOrderScope(
  activeMerchantId: string | null | undefined,
  shops: ShopSummary[] | undefined,
  activeShopId: string | null | undefined,
): MerchantOrderScope {
  const shopId = getActiveMerchantShopId(shops, activeMerchantId, activeShopId)
  return {
    shopId,
    merchantId: activeMerchantId ?? null,
  }
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
