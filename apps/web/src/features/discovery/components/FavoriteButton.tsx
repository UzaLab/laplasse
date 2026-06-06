'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { authApiFetch } from '@/lib/authFetch'

interface FavoriteButtonProps {
  merchantId: string
  merchantSlug?: string
  className?: string
  favoritedClassName?: string
  iconClassName?: string
  size?: number
  ariaLabel?: string
}

export function FavoriteButton({
  merchantId,
  merchantSlug,
  className,
  favoritedClassName,
  iconClassName,
  size = 15,
  ariaLabel = 'Ajouter aux favoris',
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const { ready: authReady } = useAuthReady()
  const router = useRouter()
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authReady) return
    authApiFetch(`/favorites/${merchantId}/check`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.is_favorited !== undefined) setIsFav(d.is_favorited) })
      .catch(() => {})
  }, [authReady, merchantId])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      const redirect = merchantSlug ? `/m/${merchantSlug}` : window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    setLoading(true)
    try {
      const res = await authApiFetch(`/favorites/${merchantId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setIsFav(data.is_favorited ?? !isFav)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={isFav ? 'Retirer des favoris' : ariaLabel}
      aria-pressed={isFav}
      className={cn(
        'transition-colors disabled:opacity-60',
        isFav
          ? (favoritedClassName ?? 'text-red-500')
          : 'text-slate-400 hover:text-red-500',
        className,
      )}
    >
      <Heart
        size={size}
        className={cn(isFav ? 'fill-red-500' : '', iconClassName)}
      />
    </button>
  )
}
