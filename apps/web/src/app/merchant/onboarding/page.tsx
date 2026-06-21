'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { MerchantVerticalOnboarding } from '@/features/merchant/components/MerchantVerticalOnboarding'

export default function MerchantOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      }
    >
      <MerchantVerticalOnboarding />
    </Suspense>
  )
}
