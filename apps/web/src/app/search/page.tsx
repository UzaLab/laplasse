import { SearchPageClient } from './SearchPageClient'
import { fetchSearchMobileData } from '@/features/discovery/search-mobile-v2/fetchSearchMobileData'
import { getRequestCountryAndCity } from '@/lib/serverCountry'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
  const { country, city: defaultCity } = await getRequestCountryAndCity()
  const mapData = await fetchSearchMobileData(defaultCity, country)

  return (
    <SearchPageClient
      mapData={mapData}
      defaultCity={defaultCity}
    />
  )
}
