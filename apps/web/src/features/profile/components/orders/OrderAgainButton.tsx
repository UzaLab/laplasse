'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw } from 'lucide-react'
import type { Order, OrderStatus } from '@/lib/marketplaceApi'
import { reorderFromOrder } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

const REORDERABLE: OrderStatus[] = [
  'COMPLETED',
  'DELIVERED',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
]

interface OrderAgainButtonProps {
  order: Order
  variant?: 'card' | 'detail'
}

export function OrderAgainButton({ order, variant = 'card' }: OrderAgainButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  if (!REORDERABLE.includes(order.status)) return null
  if (order.status === 'PENDING') return null

  const handleReorder = async () => {
    setLoading(true)
    const { result, error } = await reorderFromOrder(order.id)
    setLoading(false)

    if (!result) {
      notify.error(error ?? 'Impossible de recommander')
      return
    }

    if (result.skipped.length) {
      notify.warning(
        `${result.added_count} article${result.added_count > 1 ? 's' : ''} ajouté${result.added_count > 1 ? 's' : ''}. ${result.skipped.length} indisponible${result.skipped.length > 1 ? 's' : ''}.`,
      )
    } else {
      notify.success('Articles ajoutés au panier')
    }

    const isFood = result.cart.kind === 'food'
    router.push(isFood ? '/commande' : '/cart')
  }

  if (variant === 'detail') {
    return (
      <button
        type="button"
        onClick={handleReorder}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors text-sm font-semibold text-slate-700 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
        Commander à nouveau
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      disabled={loading}
      className="px-4 py-2 rounded-full text-xs font-bold border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin inline" />
      ) : (
        'Recommander'
      )}
    </button>
  )
}
