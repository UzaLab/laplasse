/**
 * E2E panier invité marketplace — vérifie catalogue, featured et preview API.
 * Usage: pnpm --filter api test:e2e:guest-cart
 */
import assert from 'node:assert/strict'

const API = process.env.API_URL ?? 'http://localhost:3001/api'
const MENU_MIRROR_PREFIX = 'menu-item-'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (body as { message?: string | string[] }).message
    throw new Error(`${init?.method ?? 'GET'} ${path} → ${res.status}: ${Array.isArray(msg) ? msg.join(', ') : msg}`)
  }
  return body as T
}

type CatalogProduct = {
  id: string
  name: string
  slug: string
  has_variants?: boolean
  can_quick_add?: boolean
  default_variant_id?: string | null
}

type GuestCart = { item_count: number; items: unknown[] }

async function previewGuest(items: Array<{ productId: string; quantity: number; variantId?: string }>) {
  return api<GuestCart>('/cart/guest/preview', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })
}

async function main() {
  console.log('── E2E panier invité ──\n')

  const health = await api<{ status: string }>('/health')
  assert.equal(health.status, 'ok')
  console.log('✓ API health')

  const catalog = await api<CatalogProduct[]>('/marketplace/products')
  assert.ok(catalog.length > 0, 'catalogue marketplace vide')
  console.log(`✓ Catalogue: ${catalog.length} produit(s)`)

  for (const p of catalog) {
    assert.ok(!p.slug.startsWith(MENU_MIRROR_PREFIX), `miroir menu dans catalogue: ${p.name}`)
    if (p.has_variants && !p.can_quick_add) {
      assert.equal(p.default_variant_id, null, `variante par défaut attendue absente: ${p.name}`)
    }
  }
  console.log('✓ Aucun miroir menu dans le catalogue')

  const featured = await api<CatalogProduct[]>('/marketplace/featured')
  for (const p of featured) {
    assert.ok(!p.slug.startsWith(MENU_MIRROR_PREFIX), `miroir menu dans featured: ${p.name}`)
  }
  console.log(`✓ Featured (${featured.length}) sans miroirs menu`)

  for (const p of catalog.filter(p => p.can_quick_add !== false)) {
    const cart = await previewGuest([{
      productId: p.id,
      quantity: 1,
      ...(p.default_variant_id ? { variantId: p.default_variant_id } : {}),
    }])
    assert.ok(cart.item_count >= 1, `preview vide pour ${p.name}`)
  }
  console.log(`✓ Preview OK pour ${catalog.filter(p => p.can_quick_add !== false).length} produit(s) quick-add`)

  const sample = catalog[0]
  const badId = 'cmqmxs8gx0002u1gz4tprqxup'
  let poisonFailed = false
  try {
    await previewGuest([
      { productId: badId, quantity: 2 },
      { productId: sample.id, quantity: 1 },
    ])
  } catch {
    poisonFailed = true
  }
  assert.ok(poisonFailed, 'preview groupé avec ligne invalide aurait dû échouer')
  console.log('✓ Ligne invalide bloque le preview groupé (comportement API)')

  const solo = await previewGuest([{ productId: sample.id, quantity: 1 }])
  assert.ok(solo.item_count >= 1)
  console.log(`✓ Preview solo OK après échec groupé (${sample.name})`)

  console.log('\n✅ Tous les tests panier invité passés')
}

main().catch(err => {
  console.error('\n❌', err instanceof Error ? err.message : err)
  process.exit(1)
})
