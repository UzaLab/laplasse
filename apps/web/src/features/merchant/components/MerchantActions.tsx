'use client'

import { useState, useEffect } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useRouter } from 'next/navigation'
import { authApiFetch } from '@/lib/authFetch'

interface MerchantActionsProps {
  merchantId: string
  merchantName: string
  merchantSlug: string
  variant?: 'hero' | 'sidebar'
}

export function MerchantActions({ merchantId, merchantName, merchantSlug, variant = 'hero' }: MerchantActionsProps) {
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

  const handleShare = async () => {
    const url = `${window.location.origin}/m/${merchantSlug}`
    if (navigator.share) {
      await navigator.share({ title: merchantName, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  const handleFav = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/m/${merchantSlug}`)
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

  if (variant === 'sidebar') {
    return (
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-full font-semibold text-slate-700 hover:border-slate-400 transition-colors text-sm shadow-sm"
        >
          <Share2 size={16} /> Partager
        </button>
        <button
          type="button"
          onClick={handleFav}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-3 bg-white border rounded-full font-semibold transition-colors text-sm shadow-sm disabled:opacity-60 ${
            isFav
              ? 'border-red-300 text-red-500 bg-red-50'
              : 'border-slate-200 text-slate-700 hover:border-red-300 hover:text-red-500'
          }`}
        >
          <Heart size={16} className={isFav ? 'fill-red-500' : ''} />
          {isFav ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"
        aria-label="Partager"
      >
        <Share2 size={18} />
      </button>
      <button
        type="button"
        onClick={handleFav}
        disabled={loading}
        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all disabled:opacity-60 ${
          isFav
            ? 'bg-red-500 border-red-400 text-white'
            : 'bg-white/20 border-white/30 text-white hover:bg-white hover:text-red-500'
        }`}
        aria-label="Sauvegarder"
      >
        <Heart size={18} className={isFav ? 'fill-white' : ''} />
      </button>
    </>
  )
}
