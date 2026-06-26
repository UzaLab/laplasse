import type { Order } from '@/lib/marketplaceApi'

export function getOrderSellerName(order: Order): string {
  return order.merchant?.business_name ?? order.shop?.name ?? 'Boutique'
}

export function getOrderSellerSlug(order: Order): string | undefined {
  return order.merchant?.slug ?? order.shop?.slug
}

export function getOrderSellerHref(order: Order): string | null {
  const slug = getOrderSellerSlug(order)
  if (!slug) return null
  if (order.merchant?.slug) return `/m/${slug}`
  return `/m/${slug}/boutique`
}

export function getOrderSellerPhone(order: Order): string | undefined {
  return order.merchant?.whatsapp ?? order.merchant?.phone ?? order.shop?.whatsapp ?? order.shop?.phone ?? undefined
}

export function orderDisplayThumbnail(order: Order, placeholder: string): string {
  return order.merchant?.logo ?? order.shop?.logo ?? placeholder
}
