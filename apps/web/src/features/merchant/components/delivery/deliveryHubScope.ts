/** Scope hub livraison : boutique standalone ou établissement marchand. */
export type DeliveryHubScope =
  | { merchantId: string; shopId?: undefined }
  | { shopId: string; merchantId?: undefined }

export function resolveDeliveryHubScope(
  merchantId?: string,
  shopId?: string,
): DeliveryHubScope | null {
  if (shopId) return { shopId }
  if (merchantId) return { merchantId }
  return null
}

export function hasDeliveryHubScope(
  merchantId?: string,
  shopId?: string,
): boolean {
  return !!(shopId || merchantId)
}
