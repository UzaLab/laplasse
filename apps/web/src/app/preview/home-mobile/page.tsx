import { cookies, headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { HomeMobilePage } from '@/features/discovery/home-mobile-v2/HomeMobileV2Page'
import { fetchHomeMobileData } from '@/features/discovery/home-mobile-v2/fetchHomeMobileData'
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

export default async function HomeMobilePreviewPage() {
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
  const data = await fetchHomeMobileData(defaultCity, country)

  return (
    <HomeMobilePage
      {...data}
      defaultCity={defaultCity}
      preview
    />
  )
}
