'use client'

import { useEffect, useRef } from 'react'
import { recordAdEvent } from '@/lib/adsApi'

export function useAdImpressionRef(campaignId?: string | null) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!campaignId || !ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          recordAdEvent(campaignId, 'impression')
          observer.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [campaignId])

  return ref
}

interface AdImpressionTrackerProps {
  campaignId?: string | null
  children: React.ReactNode
  className?: string
}

export function AdImpressionTracker({ campaignId, children, className }: AdImpressionTrackerProps) {
  const ref = useAdImpressionRef(campaignId)
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
