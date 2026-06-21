import { PrismaService } from '../prisma/prisma.service'
import { attachShopPreviewsToMerchants, MerchantWithShopPreview } from './shop-preview'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&q=80&w=200'

const FOOD_SLUGS = new Set(['restaurants', 'fast-food', 'cafes', 'bars-lounges'])
const LODGING_SLUGS = new Set(['hotels', 'residences'])
const APPOINTMENT_SLUGS = new Set(['beaute', 'fitness'])
const PHARMACY_SLUGS = new Set(['pharmacies'])

export type VerticalPreviewKind = 'menu' | 'room' | 'service' | 'consultation'

export interface VerticalFeaturedItem {
  kind: VerticalPreviewKind
  badge: string
  name: string
  price: string | null
  image: string
  tab: string
  meta: string | null
}

export type MerchantWithCardPreview<T extends { id: string }> = MerchantWithShopPreview<T> & {
  featured_vertical?: VerticalFeaturedItem
}

function formatPrice(amount: number, currency = 'XOF') {
  const label = currency === 'XOF' ? 'FCFA' : currency
  return `${amount.toLocaleString('fr-FR')} ${label}`
}

function categorySlugOf(m: Record<string, unknown>): string | undefined {
  const cat = m.category as { slug?: string } | undefined
  if (cat?.slug) return cat.slug
  if (typeof m.category_slug === 'string' && m.category_slug) return m.category_slug
  return undefined
}

function previewKindForCategory(slug: string | undefined): VerticalPreviewKind | null {
  if (!slug) return null
  if (FOOD_SLUGS.has(slug)) return 'menu'
  if (LODGING_SLUGS.has(slug)) return 'room'
  if (PHARMACY_SLUGS.has(slug)) return 'consultation'
  if (APPOINTMENT_SLUGS.has(slug)) return 'service'
  return null
}

function badgeForKind(kind: VerticalPreviewKind): string {
  switch (kind) {
    case 'menu': return 'À la carte'
    case 'room': return 'Hébergement'
    case 'service': return 'Prestation'
    case 'consultation': return 'Consultation'
  }
}

function tabForKind(kind: VerticalPreviewKind): string {
  if (kind === 'menu') return 'menu'
  if (kind === 'room') return 'chambres'
  return 'prestations'
}

function serviceKindForPreview(kind: VerticalPreviewKind): 'ROOM_TYPE' | 'APPOINTMENT' | 'CONSULTATION' | null {
  if (kind === 'room') return 'ROOM_TYPE'
  if (kind === 'service') return 'APPOINTMENT'
  if (kind === 'consultation') return 'CONSULTATION'
  return null
}

function imageFromUrls(urls: unknown, fallback?: string | null): string {
  if (Array.isArray(urls)) {
    const first = urls.find((u): u is string => typeof u === 'string' && u.trim().length > 0)
    if (first) return first
  }
  if (fallback?.trim()) return fallback
  return PLACEHOLDER_IMAGE
}

/** Produit vitrine boutique, sinon highlight vertical (menu, chambre, prestation…). */
export async function attachCardPreviewsToMerchants<T extends Record<string, unknown>>(
  prisma: PrismaService,
  merchants: Array<T & { id: string }>,
): Promise<MerchantWithCardPreview<T & { id: string }>[]> {
  const withShop = await attachShopPreviewsToMerchants(prisma, merchants)
  return attachVerticalPreviewsToMerchants(prisma, withShop)
}

async function attachVerticalPreviewsToMerchants<T extends Record<string, unknown>>(
  prisma: PrismaService,
  merchants: MerchantWithShopPreview<T & { id: string }>[],
): Promise<MerchantWithCardPreview<T & { id: string }>[]> {
  const withoutShop = merchants.filter(m => !m.featured_product)
  if (!withoutShop.length) return merchants

  const byKind = new Map<VerticalPreviewKind, string[]>()
  for (const m of withoutShop) {
    const kind = previewKindForCategory(categorySlugOf(m))
    if (!kind) continue
    const ids = byKind.get(kind) ?? []
    ids.push(m.id)
    byKind.set(kind, ids)
  }

  const previewByMerchant = new Map<string, VerticalFeaturedItem>()

  const menuIds = byKind.get('menu') ?? []
  if (menuIds.length) {
    const items = await prisma.menuItem.findMany({
      where: {
        merchant_id: { in: menuIds },
        is_available: true,
        OR: [{ section_id: null }, { section: { is_active: true } }],
      },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
      select: {
        merchant_id: true,
        name: true,
        price: true,
        currency: true,
        image_url: true,
      },
    })
    for (const item of items) {
      if (previewByMerchant.has(item.merchant_id)) continue
      previewByMerchant.set(item.merchant_id, {
        kind: 'menu',
        badge: badgeForKind('menu'),
        name: item.name,
        price: formatPrice(item.price, item.currency),
        image: imageFromUrls(null, item.image_url),
        tab: tabForKind('menu'),
        meta: null,
      })
    }
  }

  for (const kind of ['room', 'service', 'consultation'] as VerticalPreviewKind[]) {
    const ids = byKind.get(kind) ?? []
    const serviceKind = serviceKindForPreview(kind)
    if (!ids.length || !serviceKind) continue

    const services = await prisma.merchantService.findMany({
      where: {
        merchant_id: { in: ids },
        is_active: true,
        service_kind: serviceKind,
      },
      orderBy: [{ created_at: 'desc' }, { name: 'asc' }],
      select: {
        merchant_id: true,
        name: true,
        price: true,
        nightly_rate: true,
        capacity: true,
        bedrooms: true,
        duration_min: true,
        image_urls: true,
        description: true,
      },
    })

    for (const svc of services) {
      if (previewByMerchant.has(svc.merchant_id)) continue
      const rate = svc.nightly_rate ?? svc.price
      let meta: string | null = null
      if (kind === 'room') {
        if (svc.bedrooms != null && svc.bedrooms > 0) meta = `${svc.bedrooms} ch.`
        else if (svc.capacity != null) meta = `${svc.capacity} pers.`
      } else if (kind !== 'consultation' && svc.duration_min > 0) {
        meta = `${svc.duration_min} min`
      }
      previewByMerchant.set(svc.merchant_id, {
        kind,
        badge: badgeForKind(kind),
        name: svc.name,
        price: rate != null ? `${formatPrice(rate)}${kind === 'room' ? ' / nuit' : ''}` : null,
        image: imageFromUrls(svc.image_urls),
        tab: tabForKind(kind),
        meta,
      })
    }
  }

  return merchants.map(m => {
    const featured_vertical = previewByMerchant.get(m.id)
    return featured_vertical ? { ...m, featured_vertical } : m
  })
}
