import { PrismaService } from '../prisma/prisma.service'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&q=80&w=200'

export interface ShopFeaturedProduct {
  name: string
  price: string
  image: string
  slug: string
  shop_slug: string
}

export type MerchantWithShopPreview<T extends { id: string }> = T & {
  has_marketplace: boolean
  featured_product?: ShopFeaturedProduct
}

function formatPrice(amount: number, currency = 'XOF') {
  const label = currency === 'XOF' ? 'FCFA' : currency
  return `${amount.toLocaleString('fr-FR')} ${label}`
}

/** Attache un produit vitrine aux établissements liés à une boutique active. */
export async function attachShopPreviewsToMerchants<T extends Record<string, unknown>>(
  prisma: PrismaService,
  merchants: Array<T & { id: string }>,
): Promise<MerchantWithShopPreview<T & { id: string }>[]> {
  if (!merchants.length) return []

  const merchantIds = merchants.map(m => m.id)
  const shops = await prisma.shop.findMany({
    where: {
      merchant_id: { in: merchantIds },
      is_active: true,
      status: 'ACTIVE',
      products: {
        some: {
          status: 'ACTIVE',
          OR: [
            { stock_quantity: { gt: 0 } },
            { variants: { some: { stock_quantity: { gt: 0 } } } },
          ],
        },
      },
    },
    select: {
      merchant_id: true,
      slug: true,
      products: {
        where: {
          status: 'ACTIVE',
          OR: [
            { stock_quantity: { gt: 0 } },
            { variants: { some: { stock_quantity: { gt: 0 } } } },
          ],
        },
        orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }],
        take: 1,
        select: {
          name: true,
          slug: true,
          price: true,
          currency: true,
          image_url: true,
        },
      },
    },
  })

  const previewByMerchant = new Map<string, ShopFeaturedProduct>()
  for (const shop of shops) {
    const product = shop.products[0]
    if (!product || !shop.merchant_id) continue
    previewByMerchant.set(shop.merchant_id, {
      name: product.name,
      price: formatPrice(product.price, product.currency),
      image: product.image_url ?? PLACEHOLDER_IMAGE,
      slug: product.slug,
      shop_slug: shop.slug,
    })
  }

  return merchants.map(m => {
    const featured = previewByMerchant.get(m.id)
    return {
      ...m,
      has_marketplace: Boolean(featured),
      ...(featured ? { featured_product: featured } : {}),
    }
  })
}
