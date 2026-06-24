/** Boutiques accessibles : propriétaire direct ou propriétaire de l'établissement lié. */
export const SHOP_MINI_SELECT = {
  id: true,
  name: true,
  slug: true,
  status: true,
  merchant_id: true,
} as const

export function shopAccessibleWhere(userId: string, shopId?: string) {
  return {
    ...(shopId ? { id: shopId } : {}),
    OR: [
      { owner_id: userId },
      { merchant: { owner_id: userId } },
    ],
  }
}
