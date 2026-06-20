import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { authUrl } from '@/lib/authClient'
import { BoutiquePageClient } from '@/features/marketplace/components/BoutiquePageClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

async function fetchPublicShop(slug: string) {
  try {
    const res = await fetch(authUrl(`/shops/${slug}`), { next: { revalidate: 60 } })
    if (!res.ok) return null
    return res.json() as Promise<{
      id: string
      name: string
      slug: string
      description?: string | null
      logo?: string | null
      cover_image?: string | null
      phone?: string | null
      whatsapp?: string | null
      city?: string
      district?: string | null
      merchant?: {
        id: string
        business_name: string
        slug: string
        logo?: string | null
      } | null
    }>
  } catch {
    return null
  }
}

export default async function BoutiquePage({ params }: Props) {
  const { slug } = await params
  const shop = await fetchPublicShop(slug)
  if (!shop) notFound()

  const merchant = {
    business_name: shop.name,
    slug: shop.slug,
    logo: shop.logo ?? shop.merchant?.logo ?? null,
    cover_image: shop.cover_image,
    phone: shop.phone ?? null,
    whatsapp: shop.whatsapp ?? null,
    location: shop.district || shop.city
      ? { city: shop.city ?? 'Abidjan', district: shop.district ?? null }
      : null,
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <BoutiquePageClient merchant={merchant} />
      <Footer />
    </div>
  )
}
