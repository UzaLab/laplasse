'use client'

import Link from 'next/link'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantVerticalServicesPanel } from '@/features/merchant/components/MerchantVerticalServicesPanel'
import { useAuthStore } from '@/stores/authStore'
import { getVerticalModuleCopy } from '@/lib/merchantVertical'

interface Props {
  expectedHref: string
}

function MerchantVerticalServicesPage({ expectedHref }: Props) {
  const { activeMerchantId, user } = useAuthStore()
  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const moduleCopy = getVerticalModuleCopy(activeMerchant?.category_slug)

  if (moduleCopy && moduleCopy.href !== expectedHref) {
    return (
      <MerchantShell>
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center max-w-lg mx-auto">
          <h1 className="text-xl font-extrabold text-slate-900 mb-2">Page non disponible</h1>
          <p className="text-sm text-slate-500 mb-4">
            Ce module ne correspond pas à la catégorie de votre établissement.
          </p>
          <Link
            href={moduleCopy.href}
            className="inline-flex px-4 py-2 bg-slate-900 text-white rounded-full text-sm font-bold"
            style={{ textDecoration: 'none' }}
          >
            Ouvrir {moduleCopy.sidebarLabel}
          </Link>
        </div>
      </MerchantShell>
    )
  }

  return (
    <MerchantShell>
      <MerchantVerticalServicesPanel />
    </MerchantShell>
  )
}

export default MerchantVerticalServicesPage
