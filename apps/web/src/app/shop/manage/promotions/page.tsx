'use client'

import Link from 'next/link'
import { Building2, Lock } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { ShopManageSectionLayout } from '@/features/shop/components/ShopManageSectionLayout'

export default function ShopManagePromotionsPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/promotions')
  if (!hydrated || !isAuthenticated || !ready) return null

  return (
    <ShopManageSectionLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <Lock size={28} className="text-amber-400" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
          Promotions — fonctionnalité avancée
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          La gestion des promotions est disponible pour les boutiques liées à un établissement marchand
          avec un plan Starter ou supérieur.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/merchant/signup"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-3 rounded-2xl hover:bg-slate-800 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <Building2 size={16} /> Créer un établissement
          </Link>
          <Link
            href="/shop/manage"
            className="inline-flex items-center gap-2 text-slate-500 font-semibold px-5 py-3 rounded-2xl hover:bg-slate-100 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    </ShopManageSectionLayout>
  )
}
