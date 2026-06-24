'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { SearchResultsPage } from '@/features/discovery/components/SearchResultsPage'
import { SearchResultsMobilePage } from '@/features/discovery/search-results-mobile-v2/SearchResultsMobilePage'
import { SearchMobilePage } from '@/features/discovery/search-mobile-v2/SearchMobilePage'
import type { SearchMobileData } from '@/features/discovery/search-mobile-v2/fetchSearchMobileData'

function useShowMobileResults(): boolean {
  const searchParams = useSearchParams()
  if (searchParams.get('q')?.trim()) return true
  if (searchParams.get('filters') === '1') return true
  if (searchParams.get('category')) return true
  if (searchParams.get('type') === 'products' || searchParams.get('type') === 'merchants') {
    return true
  }
  return false
}

function SearchPageRouter({
  mapData,
  defaultCity,
}: {
  mapData: SearchMobileData
  defaultCity: string
}) {
  const showMobileResults = useShowMobileResults()

  return (
    <>
      <div className="md:hidden">
        {showMobileResults ? (
          <SearchResultsMobilePage defaultCity={defaultCity} />
        ) : (
          <SearchMobilePage
            {...mapData}
            defaultCity={defaultCity}
          />
        )}
      </div>

      <div className="hidden md:block">
        <SearchResultsPage />
      </div>
    </>
  )
}

export function SearchPageClient({
  mapData,
  defaultCity,
}: {
  mapData: SearchMobileData
  defaultCity: string
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <div className="text-slate-400 animate-pulse">Chargement…</div>
        </div>
      }
    >
      <SearchPageRouter mapData={mapData} defaultCity={defaultCity} />
    </Suspense>
  )
}
