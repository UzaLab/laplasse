'use client'

import Link from 'next/link'
import { Clock, ShoppingBag, UtensilsCrossed } from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'
import { formatFoodEta } from '@/lib/foodHub'

interface Props {
  merchant: ApiMerchantDetail
}

export function MerchantFoodMenuTab({ merchant }: Props) {
  const prep = merchant.food_prep_minutes ?? 25

  return (
    <div className="bg-white rounded-3xl border border-amber-100 p-6 sm:p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center">
        <UtensilsCrossed size={32} className="text-amber-700" />
      </div>
      <h3 className="text-xl font-extrabold text-slate-900 mb-2">Menu & commande</h3>
      <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
        Parcourez la carte, personnalisez vos plats et commandez en livraison ou à emporter.
      </p>
      <p className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-amber-800 mb-6">
        <Clock size={14} />
        {formatFoodEta(prep)}
      </p>
      <Link
        href={`/restauration/${merchant.slug}`}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-w-[220px] h-12 px-8 rounded-2xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
        style={{ textDecoration: 'none' }}
      >
        <ShoppingBag size={18} />
        Voir le menu
      </Link>
    </div>
  )
}
