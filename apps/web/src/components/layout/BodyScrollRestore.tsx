'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/** Réinitialise le scroll body après navigation (drawers / modales mobile). */
export function BodyScrollRestore() {
  const pathname = usePathname()

  useEffect(() => {
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.documentElement.style.overflow = ''
  }, [pathname])

  return null
}
