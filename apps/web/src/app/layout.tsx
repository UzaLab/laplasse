import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import { QueryProvider } from '@/providers/QueryProvider'
import { PostHogProvider } from '@/providers/PostHogProvider'
import { AuthBootstrap } from '@/components/AuthBootstrap'
import { AppToaster } from '@/components/ui/AppToaster'
import './globals.css'

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
    default: "LaPlasse — L'élégance ivoirienne à portée de clic",
    template: '%s — LaPlasse',
  },
  description:
    "Découvrez, réservez et achetez dans les meilleurs restaurants, salons, boutiques et lieux d'Abidjan. LaPlasse, la plateforme de référence pour les commerces locaux en Côte d'Ivoire.",
  keywords: ['restaurant', 'salon', 'boutique', 'Abidjan', 'Cocody', "Côte d'Ivoire", 'découverte locale', 'commerces locaux', 'LaPlasse'],
  authors: [{ name: 'LaPlasse', url: BASE_URL }],
  creator: 'LaPlasse',
  openGraph: {
    title: "LaPlasse — L'élégance ivoirienne à portée de clic",
    description: "Découvrez les meilleurs restaurants, salons et boutiques d'Abidjan sur LaPlasse.",
    url: BASE_URL,
    siteName: 'LaPlasse',
    locale: 'fr_CI',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "LaPlasse — L'élégance ivoirienne à portée de clic",
    description: "Découvrez les meilleurs lieux d'Abidjan",
    creator: '@laplasse_ci',
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
