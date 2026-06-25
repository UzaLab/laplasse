'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { ShopShell } from '@/features/shop/components/ShopShell'
import { MerchantCrmPanel } from '@/features/crm/components/MerchantCrmPanel'
import { useRequireAuth } from '@/hooks/useRequireAuth'

export default function ShopManageCrmPage() {
  const { hydrated, isAuthenticated, ready } = useRequireAuth('/shop/manage/crm')
  const { activeShopId } = useAuthStore()

  if (!hydrated || !ready || !isAuthenticated) return null

  return (
    <ShopShell>
      <div className="mb-6">
        <Link
          href="/shop/manage"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={15} /> Vue d&apos;ensemble
        </Link>
      </div>

      <MerchantCrmPanel
        mode="shop"
        shopId={activeShopId}
        title="CRM Clients"
        subtitle="Clients et prospects de votre boutique."
      />
    </ShopShell>
  )
}
