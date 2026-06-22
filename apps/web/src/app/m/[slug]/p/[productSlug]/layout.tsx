import type { Metadata } from 'next'
import { stripHtml } from '@/lib/htmlUtils'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'
const APP_BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

type ProductSeo = {
  name: string
  description?: string | null
  image_url?: string | null
  price: number
  currency: string
  slug: string
  merchant?: { business_name?: string; slug?: string } | null
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
  const title = `${product.name} — ${shopName} | LaPlasse`
  const rawDesc = product.description ? stripHtml(product.description) : ''
  const description = rawDesc.slice(0, 160) || `${product.name} disponible sur LaPlasse Marketplace.`
  const url = `${APP_BASE}/m/${slug}/p/${productSlug}`
  const image = product.image_url ?? `${APP_BASE}/og-default.jpg`

  return {
    title,
    description,
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

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description ? stripHtml(product.description).slice(0, 500) : undefined,
        image: product.image_url ?? undefined,
        sku: product.slug,
        offers: {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.currency,
          availability: 'https://schema.org/InStock',
          url: `${APP_BASE}/m/${slug}/p/${productSlug}`,
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
