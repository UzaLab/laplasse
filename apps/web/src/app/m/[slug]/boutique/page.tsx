import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { api } from '@/lib/api'
import { BoutiquePageClient } from '@/features/marketplace/components/BoutiquePageClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MerchantBoutiquePage({ params }: Props) {
  const { slug } = await params

  let merchant
  try {
    merchant = await api.merchants.bySlug(slug).catch(() => null)
  } catch {
    merchant = null
  }

  if (!merchant) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <BoutiquePageClient merchant={merchant} />
      <AppFooter />
    </div>
  )
}
