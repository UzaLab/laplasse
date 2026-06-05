'use client'

import { useState, useEffect } from 'react'
import { Heart, Share2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface MerchantActionsProps {
  merchantId: string
  merchantName: string
  merchantSlug: string
}

export function MerchantActions({ merchantId, merchantName, merchantSlug }: MerchantActionsProps) {
  const { isAuthenticated, access_token } = useAuthStore()
  const router = useRouter()
  const [isFav, setIsFav] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !access_token) return
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/${merchantId}/check`, {
      headers: { Authorization: `Bearer ${access_token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.is_favorited !== undefined) setIsFav(d.is_favorited) })
      .catch(() => {})
  }, [isAuthenticated, access_token, merchantId])

  const handleShare = async () => {
    const url = `${window.location.origin}/m/${merchantSlug}`
    if (navigator.share) {
      await navigator.share({ title: merchantName, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  const handleFav = async () => {
    if (!isAuthenticated) { router.push('/login'); return }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/favorites/${merchantId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (res.ok) {
      const data = await res.json()
      setIsFav(data.is_favorited ?? !isFav)
    }
  }

  return (
    <>
      <button
        onClick={handleShare}
        className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all"
        aria-label="Partager"
      >
        <Share2 size={18} />
      </button>
      <button
        onClick={handleFav}
        className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
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
