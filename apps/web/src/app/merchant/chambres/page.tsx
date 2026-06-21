'use client'

import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantRoomsPanel } from '@/features/merchant/components/MerchantRoomsPanel'

export default function MerchantChambresPage() {
  return (
    <MerchantShell>
      <MerchantRoomsPanel />
    </MerchantShell>
  )
}
