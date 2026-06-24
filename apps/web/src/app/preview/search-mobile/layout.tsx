import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aperçu recherche mobile v2 — LaPlasse',
  robots: { index: false, follow: false },
}

export default function SearchMobilePreviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
