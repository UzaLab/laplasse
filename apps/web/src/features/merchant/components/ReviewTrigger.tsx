'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { ReviewModal } from './ReviewModal'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface ReviewTriggerProps {
  merchantId: string
  merchantName: string
}

export function ReviewTrigger({ merchantId, merchantName }: ReviewTriggerProps) {
  const [open, setOpen] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()

  const handleClick = () => {
    if (!isAuthenticated) { router.push('/login'); return }
    setOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-full transition-colors text-sm shadow-lg shadow-brand-500/20"
      >
        <Star size={15} className="fill-white" />
        Laisser un avis
      </button>
      {open && (
        <ReviewModal merchantId={merchantId} merchantName={merchantName} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
