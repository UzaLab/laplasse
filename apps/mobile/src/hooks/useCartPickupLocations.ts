import { useEffect, useMemo, useState } from 'react'
import type { Cart, CartPickupLocation } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'

function merchantSlugsFromCart(cart: Cart | null): string[] {
  if (!cart) return []
  const slugs = new Set<string>()
  if (cart.merchant?.slug) slugs.add(cart.merchant.slug)
  for (const m of cart.merchants ?? []) {
    if (m.slug) slugs.add(m.slug)
  }
  return Array.from(slugs)
}

function locationFromMerchant(merchant: {
  id: string
  business_name: string
  location?: {
    address?: string | null
    district?: string | null
    city?: string | null
    latitude?: number | null
    longitude?: number | null
  } | null
}): CartPickupLocation {
  const loc = merchant.location
  const addressParts = [loc?.address, loc?.district, loc?.city].filter(Boolean)
  return {
    id: merchant.id,
    name: merchant.business_name,
    address: addressParts.length ? addressParts.join(', ') : null,
    latitude: loc?.latitude ?? null,
    longitude: loc?.longitude ?? null,
  }
}

export function useCartPickupLocations(cart: Cart | null) {
  const [enriched, setEnriched] = useState<CartPickupLocation[]>([])
  const slugs = useMemo(() => merchantSlugsFromCart(cart), [cart])

  useEffect(() => {
    if (!cart) {
      setEnriched([])
      return
    }

    const fromCart = cart.pickup_locations ?? []
    const needsEnrichment = fromCart.length === 0
      || fromCart.some(p => !p.address && p.latitude == null)

    if (!needsEnrichment) {
      setEnriched(fromCart)
      return
    }

    if (!slugs.length) {
      setEnriched(fromCart)
      return
    }

    let cancelled = false
    const api = getApiClient()

    void Promise.all(
      slugs.map(slug => api.getMerchant(slug).catch(() => null)),
    ).then(merchants => {
      if (cancelled) return

      const fetched = merchants
        .filter((m): m is NonNullable<typeof m> => m != null)
        .map(locationFromMerchant)

      if (fromCart.length === 0) {
        setEnriched(fetched)
        return
      }

      const byId = new Map(fetched.map(f => [f.id, f]))
      setEnriched(
        fromCart.map(p => {
          const extra = byId.get(p.id)
          if (!extra) return p
          return {
            ...p,
            address: p.address ?? extra.address,
            latitude: p.latitude ?? extra.latitude,
            longitude: p.longitude ?? extra.longitude,
          }
        }),
      )
    })

    return () => {
      cancelled = true
    }
  }, [cart, slugs])

  return enriched
}
