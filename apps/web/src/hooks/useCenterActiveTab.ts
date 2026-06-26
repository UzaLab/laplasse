'use client'

import { useEffect, useRef } from 'react'

/** Centre l'onglet actif dans une barre d'onglets scrollable horizontalement. */
export function useCenterActiveTab(activeKey: string, enabled = true) {
  const navRef = useRef<HTMLElement>(null)
  const tabRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (!enabled) return
    const frame = requestAnimationFrame(() => {
      const nav = navRef.current
      const tab = tabRef.current
      if (!nav || !tab) return

      const targetLeft = tab.offsetLeft - nav.clientWidth / 2 + tab.clientWidth / 2
      nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [activeKey, enabled])

  return { navRef, tabRef }
}
