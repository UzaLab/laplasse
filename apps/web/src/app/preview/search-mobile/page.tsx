import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { SearchMobilePage } from '@/features/discovery/search-mobile-v2/SearchMobilePage'
import { fetchSearchMobileData } from '@/features/discovery/search-mobile-v2/fetchSearchMobileData'
import {
  COUNTRY_COOKIE,
  getCountryFromCookieStore,
  getDefaultCity,
  isRootDomainHost,
} from '@/lib/country'

export const dynamic = 'force-dynamic'

function isPreviewEnabled() {
  return (
    process.env.NODE_ENV === 'development'
    || process.env.NEXT_PUBLIC_HOME_MOBILE_V2_PREVIEW === 'true'
  )
}

export default async function SearchMobilePreviewPage() {
  if (!isPreviewEnabled()) {
    notFound()
  }

  const headerStore = await headers()
  if (isRootDomainHost(headerStore.get('host') ?? '')) {
    notFound()
  }

  const cookieStore = await cookies()
  const country = getCountryFromCookieStore(cookieStore.get(COUNTRY_COOKIE)?.value)
  const defaultCity = getDefaultCity(country)
  const data = await fetchSearchMobileData(defaultCity, country)

  return (
    <SearchMobilePage
      {...data}
      defaultCity={defaultCity}
      preview
    />
  )
}
