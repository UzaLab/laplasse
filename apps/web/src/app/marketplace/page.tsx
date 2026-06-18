import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MarketplacePageClient } from '@/features/marketplace/components/MarketplacePageClient'

export const metadata = {
  title: 'Marketplace | LaPlasse',
  description: 'Achetez en direct auprès des meilleures boutiques d\'Abidjan.',
}

export default function MarketplacePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <MarketplacePageClient />
      <Footer />
    </div>
  )
}
