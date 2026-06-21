'use client'

import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { authApiFetch } from '@/lib/authFetch'
import { notify } from '@/lib/notify'

interface ProductFavoriteButtonProps {
  productId: string
  productHref?: string
  className?: string
  favoritedClassName?: string
  iconClassName?: string
  size?: number
  ariaLabel?: string
  showToast?: boolean
}

export function ProductFavoriteButton({
  productId,
  productHref,
  className,
  favoritedClassName,
  iconClassName,
  size = 20,
  ariaLabel = 'Ajouter aux favoris',
  showToast = true,
}: ProductFavoriteButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const { ready: authReady } = useAuthReady()
  const router = useRouter()
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authReady || !productId) return
    authApiFetch(`/favorites/products/${productId}/check`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (d?.is_favorited !== undefined) setIsFav(d.is_favorited)
      })
      .catch(() => {})
  }, [authReady, productId])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      const redirect = productHref ?? window.location.pathname
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    setLoading(true)
    try {
      const res = await authApiFetch(`/favorites/products/${productId}`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        const next = data.is_favorited ?? !isFav
        setIsFav(next)
        if (showToast) {
          notify.success(next ? 'Produit ajouté aux favoris' : 'Produit retiré des favoris')
        }
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
