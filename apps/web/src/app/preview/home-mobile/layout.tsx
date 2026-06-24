import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aperçu accueil mobile v2 — LaPlasse',
  robots: { index: false, follow: false },
}

export default function HomeMobilePreviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
