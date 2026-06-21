'use client'

import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantMenuPanel } from '@/features/merchant/components/MerchantMenuPanel'

export default function MerchantMenuPage() {
  return (
    <MerchantShell>
      <MerchantMenuPanel />
    </MerchantShell>
  )
}
