import { shopApiFetch } from './shopApi'
import { parseApiError } from './marketplaceApi'
import type { ShopCollectionMine, ShopCollectionProduct } from './marketplaceApi'

export async function fetchMyShopCollections(shopId: string) {
  const res = await shopApiFetch('/shop-collections/mine', shopId)
  if (!res.ok) return []
  return res.json() as Promise<ShopCollectionMine[]>
}

export async function fetchShopCollection(shopId: string, collectionId: string) {
  const res = await shopApiFetch(`/shop-collections/${collectionId}`, shopId)
  if (!res.ok) return null
  return res.json() as Promise<ShopCollectionMine & { products: ShopCollectionProduct[] }>
}

export async function createShopCollection(
  shopId: string,
  data: { name: string; description?: string },
) {
  const res = await shopApiFetch('/shop-collections', shopId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) return { error: await parseApiError(res) }
  return { collection: (await res.json()) as ShopCollectionMine }
}

export async function updateShopCollection(
  shopId: string,
  id: string,
  data: { name?: string; description?: string; is_active?: boolean },
) {
  const res = await shopApiFetch(`/shop-collections/${id}`, shopId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) return { error: await parseApiError(res) }
  return { collection: (await res.json()) as ShopCollectionMine }
}

export async function deleteShopCollection(shopId: string, id: string) {
  const res = await shopApiFetch(`/shop-collections/${id}`, shopId, { method: 'DELETE' })
  if (!res.ok) return { error: await parseApiError(res) }
  return { ok: true as const }
}

export async function setShopCollectionProducts(
  shopId: string,
  collectionId: string,
  productIds: string[],
) {
  const res = await shopApiFetch(`/shop-collections/${collectionId}/products`, shopId, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_ids: productIds }),
  })
  if (!res.ok) return { error: await parseApiError(res) }
  return {
    data: (await res.json()) as ShopCollectionMine & { products: ShopCollectionProduct[] },
  }
}

export async function reorderShopCollections(shopId: string, ids: string[]) {
  const res = await shopApiFetch('/shop-collections/reorder', shopId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) return { error: await parseApiError(res) }
  return { collections: (await res.json()) as ShopCollectionMine[] }
}
