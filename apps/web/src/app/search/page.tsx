import { cookies } from 'next/headers'

import { SearchPageClient } from './SearchPageClient'
import { fetchSearchMobileData } from '@/features/discovery/search-mobile-v2/fetchSearchMobileData'
import {
  COUNTRY_COOKIE,
  getCountryFromCookieStore,
  getDefaultCity,
} from '@/lib/country'

export const dynamic = 'force-dynamic'

export default async function SearchPage() {
  const cookieStore = await cookies()
  const country = getCountryFromCookieStore(cookieStore.get(COUNTRY_COOKIE)?.value)
  const defaultCity = getDefaultCity(country)
  const mapData = await fetchSearchMobileData(defaultCity, country)

  return (
    <SearchPageClient
      mapData={mapData}
      defaultCity={defaultCity}
    />
  )
}
