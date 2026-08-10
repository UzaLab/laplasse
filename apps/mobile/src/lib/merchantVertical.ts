export const FOOD_CATEGORY_SLUGS = new Set([
  'restaurants',
  'fast-food',
  'cafes',
  'bars-lounges',
])

export function isFoodCategorySlug(slug: string): boolean {
  return FOOD_CATEGORY_SLUGS.has(slug)
}
