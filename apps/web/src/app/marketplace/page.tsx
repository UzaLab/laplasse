import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MarketplacePageClient } from '@/features/marketplace/components/MarketplacePageClient'
import { BRAND_MARKETPLACE_INTRO } from '@/lib/brandCopy'

export const metadata = {
  title: 'Marketplace | LaPlasse',
  description: BRAND_MARKETPLACE_INTRO,
}

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <MarketplacePageClient />
      <AppFooter />
    </div>
  )
}
