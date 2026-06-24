'use client'

import type { ApiMerchant } from '@/lib/api'
import type { SearchHit } from '@/features/discovery/components/SearchResultCard'
import { CategoryMerchantCard } from '@/features/discovery/components/CategoryMerchantCard'
import { SearchResultsMobileMerchantCard } from '@/features/discovery/search-results-mobile-v2/SearchResultsMobileMerchantCard'

interface CategoryMerchantsGridProps {
  merchants: ApiMerchant[]
}

export function CategoryMerchantsGrid({ merchants }: CategoryMerchantsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      {merchants.map(merchant => (
        <div key={merchant.id}>
          <div className="md:hidden">
            <SearchResultsMobileMerchantCard
              merchant={merchant as SearchHit}
              compact
            />
          </div>
          <div className="hidden md:block">
            <CategoryMerchantCard merchant={merchant} />
          </div>
        </div>
      ))}
    </div>
  )
}
