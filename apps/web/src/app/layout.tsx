import type { Metadata, Viewport } from 'next'
import { cookies, headers } from 'next/headers'
import { Outfit } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { LocaleProvider } from '@/providers/LocaleProvider'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import { AppToaster } from '@/components/ui/AppToaster'
import { PwaProvider } from '@/components/PwaProvider'
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt'
import { CountrySuggestionBanner } from '@/components/layout/CountrySuggestionBanner'
import './globals.css'
import {
  BRAND_DESCRIPTION,
  BRAND_KEYWORDS,
  BRAND_NAME,
  BRAND_OG_LOCALE,
  BRAND_TAGLINE,
  BRAND_TITLE,
} from '@/lib/brandCopy'
import {
  COUNTRY_COOKIE,
  resolveCountryCode,
  buildHreflangLanguages,
  countrySiteUrl,
  countryMetadataDescription,
} from '@/lib/seoCountry'
import { LOCALE_COOKIE, type Locale } from '@/i18n'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const hdrs = await headers()
  const country = resolveCountryCode(
    cookieStore.get(COUNTRY_COOKIE)?.value,
    hdrs.get('host'),
  )
  const canonical = countrySiteUrl(country, '/')
  const description = countryMetadataDescription(country)

  return {
    metadataBase: new URL(BASE_URL),
    title: {
      default: BRAND_TITLE,
      template: `%s — ${BRAND_NAME}`,
    },
    description,
    keywords: BRAND_KEYWORDS,
    authors: [{ name: BRAND_NAME, url: BASE_URL }],
    creator: BRAND_NAME,
    alternates: {
      canonical,
      languages: buildHreflangLanguages('/'),
    },
    openGraph: {
      title: BRAND_TITLE,
      description,
      url: canonical,
      siteName: BRAND_NAME,
      locale: country === 'SN' ? 'fr_SN' : country === 'BF' ? 'fr_BF' : BRAND_OG_LOCALE,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: BRAND_TITLE,
      description,
      creator: '@laplasse',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      title: BRAND_NAME,
      statusBarStyle: 'black-translucent',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const initialLocale: Locale =
    cookieStore.get(LOCALE_COOKIE)?.value === 'en' ? 'en' : 'fr'

  return (
    <html lang={initialLocale} className={outfit.variable} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" sizes="180x180" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <PostHogProvider>
          <QueryProvider>
            <LocaleProvider initialLocale={initialLocale}>
              <PwaProvider />
              <AuthBootstrap />
              <AppToaster />
              {children}
              <CountrySuggestionBanner />
              <PwaInstallPrompt />
            </LocaleProvider>
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
