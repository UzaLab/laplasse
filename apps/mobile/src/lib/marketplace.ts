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

export function buildProductCategoryTree<
  T extends { id: string; name: string; slug: string; parent_id?: string | null },
>(rows: T[]): ProductCategoryNode[] {
  const nodes = new Map<string, ProductCategoryNode>(
    rows.map(row => [
      row.id,
      {
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: 'icon' in row && row.icon != null ? String(row.icon) : null,
        sort_order: 'sort_order' in row && typeof row.sort_order === 'number' ? row.sort_order : 0,
        children: [],
      },
    ]),
  )
  const roots: ProductCategoryNode[] = []

  for (const row of rows) {
    const node = nodes.get(row.id)!
    if (row.parent_id && nodes.has(row.parent_id)) {
      nodes.get(row.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

export function computePriceCeiling(prices: number[], fallback = 100_000): number {
  if (prices.length === 0) return fallback
  return Math.ceil(Math.max(...prices) / 1000) * 1000 || fallback
}

/** Prix max catalogue (article le plus cher) — pour le slider de filtre boutique. */
export function computeMaxProductPrice(prices: number[], fallback = 100_000): number {
  if (prices.length === 0) return fallback
  return Math.max(...prices)
}

export function deriveCategoriesFromProducts(
  products: Array<{ category?: { id: string; name: string; slug: string } | null }>,
): Array<{ id: string; name: string; slug: string; icon: string | null; parent_id?: null }> {
  const map = new Map<string, { id: string; name: string; slug: string; icon: string | null; parent_id?: null }>()
  for (const product of products) {
    const cat = product.category
    if (!cat?.slug) continue
    map.set(cat.slug, { id: cat.id, name: cat.name, slug: cat.slug, icon: null, parent_id: null })
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}
