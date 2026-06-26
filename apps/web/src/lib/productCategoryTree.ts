export interface ProductCategoryTreeNode {
  id: string
  name: string
  slug: string
  parent_id?: string | null
  children: ProductCategoryTreeNode[]
}

export interface FlatProductCategory {
  id: string
  slug: string
  name: string
  depth: number
}

export function buildProductCategoryTree<
  T extends { id: string; name: string; slug: string; parent_id?: string | null },
>(rows: T[]): ProductCategoryTreeNode[] {
  const nodes = new Map<string, ProductCategoryTreeNode>(
    rows.map(row => [row.id, { ...row, children: [] }]),
  )
  const roots: ProductCategoryTreeNode[] = []

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

export function flattenProductCategories(
  nodes: ProductCategoryTreeNode[],
  depth = 0,
): FlatProductCategory[] {
  return nodes.flatMap(node => [
    { id: node.id, slug: node.slug, name: node.name, depth },
    ...flattenProductCategories(node.children, depth + 1),
  ])
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
