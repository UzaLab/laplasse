export const FOOD_CATEGORY_SLUGS = new Set([
  'restaurants',
  'fast-food',
  'cafes',
  'bars-lounges',
])

export const APPOINTMENT_CATEGORY_SLUGS = new Set(['beaute', 'fitness', 'pharmacies'])

export function isFoodCategorySlug(slug: string): boolean {
  return FOOD_CATEGORY_SLUGS.has(slug)
}

export function getMerchantVertical(categorySlug: string) {
  if (FOOD_CATEGORY_SLUGS.has(categorySlug)) return 'food' as const
  if (categorySlug === 'hotels' || categorySlug === 'residences') return 'hotel' as const
  if (categorySlug === 'boutiques') return 'retail' as const
  if (APPOINTMENT_CATEGORY_SLUGS.has(categorySlug)) return 'appointment' as const
  return 'default' as const
}
