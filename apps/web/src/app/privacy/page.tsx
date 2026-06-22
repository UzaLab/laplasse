import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LegalDocumentView } from '@/components/legal/LegalDocumentView'
import { getPrivacyContent } from '@/lib/legalContent'
import {
  COUNTRY_COOKIE,
  resolveCountryCode,
  buildHreflangLanguages,
  countrySiteUrl,
} from '@/lib/seoCountry'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const country = resolveCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value)
  const doc = getPrivacyContent(country)
  const url = countrySiteUrl(country, '/privacy')

  return {
    title: `${doc.title} — LaPlasse`,
    description: `Politique de confidentialité LaPlasse en ${doc.jurisdiction}.`,
    alternates: {
      canonical: url,
      languages: buildHreflangLanguages('/privacy'),
    },
  }
}

export default async function PrivacyPage() {
  const cookieStore = await cookies()
  const country = resolveCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value)
  const doc = getPrivacyContent(country)

  return <LegalDocumentView doc={doc} country={country} headerTitle="Confidentialité" />
}
