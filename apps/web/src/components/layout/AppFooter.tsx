'use client'

import { usePathname } from 'next/navigation'
import { shouldHideFooterOnMobile } from '@/lib/mobilePublicChrome'
import { Footer } from './Footer'

/** Footer avec masquage automatique sur mobile pour les pages « app ». */
export function AppFooter() {
  const pathname = usePathname()
  return <Footer mobileHidden={shouldHideFooterOnMobile(pathname)} />
}
