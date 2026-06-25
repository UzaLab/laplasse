'use client'

import { useState } from 'react'
import { Loader2, Navigation } from 'lucide-react'
import { openDirectionsTo } from '@/lib/mapsUtils'

interface Props {
  latitude: number
  longitude: number
  className?: string
}

export function DirectionsLinkButton({ latitude, longitude, className }: Props) {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    openDirectionsTo(latitude, longitude)
    setTimeout(() => setLoading(false), 1500)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className
        ?? 'inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800 disabled:opacity-60 transition-colors'
      }
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
      Voir le trajet
    </button>
  )
}
