import type { ProductCategoryNode, ProductCondition, ProductOrigin } from '@laplasse/api-client'

export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  NEW: 'Neuf',
  USED_GOOD: 'Occasion — bon état',
  USED_FAIR: 'Occasion — acceptable',
  REFURBISHED: 'Reconditionné',
}

export const PRODUCT_ORIGIN_LABELS: Record<ProductOrigin, string> = {
  LOCAL_CI: "Fabriqué en Côte d'Ivoire",
  IMPORTED: 'Importé',
  HANDMADE: 'Fait main / artisanat',
}

export function flattenProductCategories(
  nodes: ProductCategoryNode[],
  depth = 0,
): { slug: string; name: string; depth: number }[] {
  return nodes.flatMap(node => [
    { slug: node.slug, name: node.name, depth },
    ...flattenProductCategories(node.children, depth + 1),
  ])
}

export function computePriceCeiling(prices: number[], fallback = 100_000): number {
  if (prices.length === 0) return fallback
  return Math.ceil(Math.max(...prices) / 1000) * 1000 || fallback
}
