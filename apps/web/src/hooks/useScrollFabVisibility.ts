'use client'

import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Masque le FAB après ce décalment vertical (px). */
  minScroll?: number
  /** Seuil bas de page (px) pour considérer qu'on est en bas. */
  bottomOffset?: number
  /** Delta minimal pour détecter un scroll vers le haut/bas. */
  delta?: number
}

/**
 * Affiche un FAB en haut de page et au scroll vers le haut ;
 * le masque en bas de page ou lors d'un scroll vers le bas.
 */
export function useScrollFabVisibility({
  minScroll = 96,
  bottomOffset = 100,
  delta = 8,
}: Options = {}) {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)

  useEffect(() => {
    lastY.current = window.scrollY

    const onScroll = () => {
      const y = window.scrollY
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      )
      const atBottom = y >= maxScroll - bottomOffset
      const scrollingUp = y < lastY.current - delta
      const scrollingDown = y > lastY.current + delta

      if (y <= minScroll) {
        setVisible(true)
      } else if (scrollingUp) {
        setVisible(true)
      } else if (atBottom || scrollingDown) {
        setVisible(false)
      }

      lastY.current = y
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [minScroll, bottomOffset, delta])

  return visible
}
