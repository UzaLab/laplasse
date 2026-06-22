import { countryRequestHeaders } from '@/lib/country'
import { getGuestKey } from '@/lib/guestKey'
import { ensureAuthSession, waitForAuthHydration } from '@/lib/authSession'
import type { MarketplaceProduct } from '@/lib/marketplaceApi'

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
}

export async function recordProductView(productId: string, isAuthenticated: boolean): Promise<void> {
  try {
    if (isAuthenticated) {
      await waitForAuthHydration()
      await ensureAuthSession()
      await fetch(`${apiBase()}/marketplace/products/${productId}/view/mine`, {
        method: 'POST',
        credentials: 'include',
        headers: countryRequestHeaders(),
      })
      return
    }
    await fetch(`${apiBase()}/marketplace/products/${productId}/view`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...countryRequestHeaders(),
      },
      body: JSON.stringify({ guestKey: getGuestKey() }),
    })
  } catch {
    // non bloquant
  }
}

export async function fetchRecommendations(productId?: string, limit = 8): Promise<MarketplaceProduct[]> {
  const params = new URLSearchParams()
  if (productId) params.set('productId', productId)
  params.set('limit', String(limit))
  const res = await fetch(`${apiBase()}/marketplace/recommendations?${params}`, {
    headers: countryRequestHeaders(),
  })
  if (!res.ok) return []
  return res.json()
}

export async function fetchRecentlyViewed(
  isAuthenticated: boolean,
  excludeProductId?: string,
  limit = 8,
): Promise<MarketplaceProduct[]> {
  const params = new URLSearchParams()
  params.set('limit', String(limit))
  if (excludeProductId) params.set('excludeProductId', excludeProductId)

  if (isAuthenticated) {
    await waitForAuthHydration()
    await ensureAuthSession()
    const res = await fetch(`${apiBase()}/marketplace/recently-viewed/mine?${params}`, {
      credentials: 'include',
      headers: countryRequestHeaders(),
    })
    if (!res.ok) return []
    return res.json()
  }

  params.set('guestKey', getGuestKey())
  const res = await fetch(`${apiBase()}/marketplace/recently-viewed?${params}`, {
    headers: countryRequestHeaders(),
  })
  if (!res.ok) return []
  return res.json()
}
