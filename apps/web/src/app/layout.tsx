import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import { AppToaster } from '@/components/ui/AppToaster'
import './globals.css'
import {
  BRAND_DESCRIPTION,
  BRAND_KEYWORDS,
  BRAND_NAME,
  BRAND_OG_LOCALE,
  BRAND_TAGLINE,
  BRAND_TITLE,
} from '@/lib/brandCopy'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
  display: 'swap',
})

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://laplasse.ci'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: BRAND_TITLE,
    template: `%s — ${BRAND_NAME}`,
  },
  description: BRAND_DESCRIPTION,
  keywords: BRAND_KEYWORDS,
  authors: [{ name: BRAND_NAME, url: BASE_URL }],
  creator: BRAND_NAME,
  openGraph: {
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    url: BASE_URL,
    siteName: BRAND_NAME,
    locale: BRAND_OG_LOCALE,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND_TITLE,
    description: BRAND_DESCRIPTION,
    creator: '@laplasse',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={outfit.variable}>
      <body>
        <PostHogProvider>
          <QueryProvider>
            <AuthBootstrap />
            <AppToaster />
            {children}
          </QueryProvider>
        </PostHogProvider>
      </body>
    </html>
  )
}
