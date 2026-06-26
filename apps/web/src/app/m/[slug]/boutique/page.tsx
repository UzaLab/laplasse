import { notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { BoutiquePageClient } from '@/features/marketplace/components/BoutiquePageClient'
import { resolveBoutiqueDisplay } from '@/lib/boutiquePublic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function MerchantBoutiquePage({ params }: Props) {
  const { slug } = await params
  const boutique = await resolveBoutiqueDisplay(slug)

  if (!boutique) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <BoutiquePageClient merchant={boutique} />
      <AppFooter />
    </div>
  )
}
