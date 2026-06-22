'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantPrestationsPanel } from '@/features/merchant/components/MerchantPrestationsPanel'

export default function MerchantPrestationsPage() {
  return (
    <MerchantShell>
      <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" /></div>}>
        <MerchantPrestationsPanel expectedServiceKind="APPOINTMENT" />
      </Suspense>
    </MerchantShell>
  )
}
