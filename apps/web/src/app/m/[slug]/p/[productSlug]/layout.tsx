import type { Metadata } from 'next'
import { stripHtml } from '@/lib/htmlUtils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

type ProductSeo = {
  id: string
  name: string
  slug: string
  sku?: string | null
  short_description?: string | null
  description?: string | null
  image_url?: string | null
  images?: string[]
  price: number
  currency: string
  status?: string
  condition?: string | null
  origin?: string | null
  weight_grams?: number | null
  stock_quantity?: number
  tags?: string[]
  seo_title?: string | null
  seo_description?: string | null
  merchant?: { business_name?: string; slug?: string } | null
  category?: { name?: string; legal_notice?: string | null } | null
}

async function fetchProductForSeo(shopSlug: string, productSlug: string): Promise<ProductSeo | null> {
  try {
    const res = await fetch(`${API_BASE}/shops/${shopSlug}/products/${productSlug}`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json() as Promise<ProductSeo>
  } catch {
    return null
  }
}

type LayoutProps = {
  children: React.ReactNode
  params: Promise<{ slug: string; productSlug: string }>
}

export async function generateMetadata({ params }: Pick<LayoutProps, 'params'>): Promise<Metadata> {
  const { slug, productSlug } = await params
  const product = await fetchProductForSeo(slug, productSlug)
  if (!product) {
    return { title: 'Produit — LaPlasse' }
  }

  const shopName = product.merchant?.business_name ?? 'Boutique'
  const title = product.seo_title?.trim()
    || `${product.name} — ${shopName} | LaPlasse`
  const rawDesc = product.description ? stripHtml(product.description) : ''
  const description = product.seo_description?.trim()
    || product.short_description?.trim()
    || rawDesc.slice(0, 160)
    || `${product.name} disponible sur LaPlasse Marketplace.`
  const url = `${APP_BASE}/m/${slug}/p/${productSlug}`
  const image = product.image_url ?? `${APP_BASE}/og-default.jpg`
  const keywords = [
    product.name,
    shopName,
    product.category?.name,
    ...(product.tags ?? []),
  ].filter(Boolean).join(', ')

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
      siteName: 'LaPlasse',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function ProductDetailLayout({ children, params }: LayoutProps) {
  const { slug, productSlug } = await params
  const product = await fetchProductForSeo(slug, productSlug)

  const conditionSchemaMap: Record<string, string> = {
    NEW: 'https://schema.org/NewCondition',
    USED_GOOD: 'https://schema.org/UsedCondition',
    USED_FAIR: 'https://schema.org/UsedCondition',
    REFURBISHED: 'https://schema.org/RefurbishedCondition',
  }
  const availability = product?.status === 'OUT_OF_STOCK' || (product?.stock_quantity ?? 1) <= 0
    ? 'https://schema.org/OutOfStock'
    : 'https://schema.org/InStock'
  const imageList = product?.images?.length
    ? product.images
    : product?.image_url
      ? [product.image_url]
      : undefined

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.short_description?.trim()
          || (product.description ? stripHtml(product.description).slice(0, 500) : undefined),
        image: imageList ?? product.image_url ?? undefined,
        sku: `LP-${product.id?.slice(0, 8).toUpperCase()}`,
        mpn: product.slug,
        ...(product.condition && conditionSchemaMap[product.condition]
          ? { itemCondition: conditionSchemaMap[product.condition] }
          : {}),
        ...(product.weight_grams
          ? { weight: { '@type': 'QuantitativeValue', value: product.weight_grams / 1000, unitCode: 'KGM' } }
          : {}),
        ...(product.tags?.length ? { keywords: product.tags.join(', ') } : {}),
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency,
          availability,
          url: `${APP_BASE}/m/${slug}/p/${productSlug}`,
          seller: product.merchant?.business_name
            ? { '@type': 'Organization', name: product.merchant.business_name }
            : undefined,
        },
        brand: product.merchant?.business_name
          ? { '@type': 'Brand', name: product.merchant.business_name }
          : undefined,
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
