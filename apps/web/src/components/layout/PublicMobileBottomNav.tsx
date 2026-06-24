'use client'

import { usePathname } from 'next/navigation'
import { shouldShowPublicMobileBottomNav } from '@/lib/mobilePublicChrome'
import { MobileBottomNav } from './MobileBottomNav'

/** Barre basse publique injectée globalement selon la route courante. */
export function PublicMobileBottomNav() {
  const pathname = usePathname()

  if (!shouldShowPublicMobileBottomNav(pathname)) {
    return null
  }

  return <MobileBottomNav />
}
