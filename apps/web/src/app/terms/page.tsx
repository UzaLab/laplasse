import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { LegalDocumentView } from '@/components/legal/LegalDocumentView'
import { getTermsContent } from '@/lib/legalContent'
import { COUNTRY_COOKIE, resolveCountryCode } from '@/lib/seoCountry'
import { buildHreflangLanguages, countrySiteUrl } from '@/lib/seoCountry'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const country = resolveCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value)
  const doc = getTermsContent(country)
  const url = countrySiteUrl(country, '/terms')

  return {
    title: `${doc.title} — LaPlasse`,
    description: `Conditions d'utilisation LaPlasse en ${doc.jurisdiction}.`,
    alternates: {
      canonical: url,
      languages: buildHreflangLanguages('/terms'),
    },
  }
}

export default async function TermsPage() {
  const cookieStore = await cookies()
  const country = resolveCountryCode(cookieStore.get(COUNTRY_COOKIE)?.value)
  const doc = getTermsContent(country)

  return <LegalDocumentView doc={doc} country={country} headerTitle="CGU" />
}
