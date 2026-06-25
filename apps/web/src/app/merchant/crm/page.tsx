'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantCrmPanel } from '@/features/crm/components/MerchantCrmPanel'

export default function MerchantCRMPage() {
  const { activeMerchantId } = useAuthStore()

  return (
    <MerchantShell>
      <div className="mb-6">
        <Link
          href="/merchant/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={15} /> Tableau de bord
        </Link>
      </div>

      <MerchantCrmPanel mode="merchant" merchantId={activeMerchantId} />
    </MerchantShell>
  )
}
