'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RESTAURATION_DESKTOP_MIN_WIDTH_PX } from '@/lib/restaurationViewport'

interface Props {
  href: string
}

/** Redirige vers le parcours desktop si la fenêtre ≥ lg. */
export function RestaurationDesktopRedirect({ href }: Props) {
  const router = useRouter()

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${RESTAURATION_DESKTOP_MIN_WIDTH_PX}px)`)
    const sync = () => {
      if (mq.matches) router.replace(href)
    }
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [href, router])

  return null
}
