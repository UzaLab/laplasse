'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, ExternalLink, Loader2, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MOBILE_BOTTOM_NAV_PAD } from '@/lib/mobilePublicChrome'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import { CheckoutOrderSummary } from '@/features/marketplace/components/CheckoutOrderSummary'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  clearCheckoutConfirmation,
  getCheckoutConfirmation,
  type CheckoutConfirmation,
} from '@/lib/checkoutSession'
import { formatOrderRef } from '@/features/profile/components/orders/orderUtils'
import { captureCheckoutStep } from '@/lib/analytics'

export default function CheckoutConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      }
    >
      <CheckoutConfirmationContent />
    </Suspense>
  )
}

function CheckoutConfirmationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const { hydrated, isAuthenticated } = useRequireAuth('/checkout/confirmation')
  const [confirmation, setConfirmation] = useState<CheckoutConfirmation | null>(null)
  const [ready, setReady] = useState(false)

  const statusParam = searchParams.get('status')
  const status = statusParam === 'failure' ? 'failure' : statusParam === 'success' ? 'success' : null
  const orderIdsParam = searchParams.get('orderIds') ?? ''

  useEffect(() => {
    if (!status) {
      router.replace('/cart')
      return
    }

    const stored = getCheckoutConfirmation()
    if (!stored || stored.status !== status) {
      router.replace('/cart')
      return
    }

    if (orderIdsParam) {
      const ids = orderIdsParam.split(',').filter(Boolean)
      const match = ids.every(id => stored.orderIds.includes(id))
      if (!match) {
        router.replace('/cart')
        return
      }
    }

    setConfirmation(stored)
    setReady(true)
  }, [router, status, orderIdsParam])

  useEffect(() => {
    if (!ready || !confirmation || !status) return
    captureCheckoutStep(status === 'success' ? 'payment_success' : 'payment_failure', {
      order_count: confirmation.orderIds.length,
      total: confirmation.total,
      source: 'confirmation_page',
    })
  }, [ready, confirmation, status])

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (!ready || !confirmation || !status) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  const isSuccess = status === 'success'
  const firstName = user?.full_name?.split(' ')[0] ?? ''
  const multiOrders = confirmation.checkoutOrders.length > 1
  const primaryOrderId = confirmation.orderIds[0]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <CheckoutSteps current={4} />

      <main className={`${PAGE_CONTAINER} py-12 ${MOBILE_BOTTOM_NAV_PAD}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 bg-white rounded-3xl border border-slate-100 shadow-sm px-6 py-8">
            {isSuccess ? (
              <>
                <CheckCircle2 size={52} className="text-emerald-500 mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
                  {multiOrders ? 'Commandes confirmées !' : 'Commande confirmée !'}
                </h1>
                <p className="text-slate-500 max-w-md mx-auto">
                  Merci{firstName ? ` ${firstName}` : ''}, votre
                  {multiOrders ? 's commandes ont' : ' commande a'} été enregistrée
                  {multiOrders ? 's' : ''} avec succès.
                </p>
                {primaryOrderId && (
                  <p className="text-xs text-slate-400 mt-3 font-mono">
                    Réf. {formatOrderRef(primaryOrderId)}
                    {multiOrders && ` (+${confirmation.orderIds.length - 1} autre${confirmation.orderIds.length > 2 ? 's' : ''})`}
                  </p>
                )}
              </>
            ) : (
              <>
                <XCircle size={52} className="text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">
                  Paiement échoué
                </h1>
                <p className="text-slate-500 max-w-md mx-auto">
                  Le paiement n&apos;a pas pu être finalisé. Vous pouvez réessayer ou contacter le
                  commerce.
                </p>
              </>
            )}
          </div>

          <CheckoutOrderSummary
            cart={confirmation.cartSnapshot}
            total={confirmation.total}
            deliveryType={confirmation.deliveryType}
            deliveryAddress={confirmation.deliveryAddress}
            customerPhone={confirmation.customerPhone}
            customerNote={confirmation.customerNote}
            discountAmount={confirmation.discountAmount}
            deliveryFee={confirmation.deliveryFee}
            deliveryQuotes={confirmation.deliveryQuotes}
            references={confirmation.references}
            className="mb-8"
          />

          {multiOrders && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 mb-8">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
                Détail par boutique
              </h2>
              <ul className="space-y-3">
                {confirmation.checkoutOrders.map(order => (
                  <li
                    key={order.orderId}
                    className="flex justify-between items-center gap-3 text-sm bg-slate-50 rounded-xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-700 truncate">{order.merchant.business_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{order.reference}</p>
                    </div>
                    {isSuccess && (
                      <Link
                        href={`/profile/orders/${order.orderId}`}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 shrink-0 inline-flex items-center gap-1"
                        style={{ textDecoration: 'none' }}
                      >
                        Voir <ExternalLink size={12} />
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isSuccess ? (
              <>
                {primaryOrderId && !multiOrders && (
                  <Link
                    href={`/profile/orders/${primaryOrderId}`}
                    onClick={() => clearCheckoutConfirmation()}
                    className="h-12 px-8 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors flex items-center justify-center"
                    style={{ textDecoration: 'none' }}
                  >
                    Voir ma commande
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    clearCheckoutConfirmation()
                    router.push('/profile/orders')
                  }}
                  className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  {multiOrders ? 'Toutes mes commandes' : 'Mes commandes'}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  clearCheckoutConfirmation()
                  router.push('/checkout')
                }}
                className="h-12 px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Passer une nouvelle commande
              </button>
            )}
            <Link
              href="/marketplace"
              onClick={() => clearCheckoutConfirmation()}
              className="h-12 px-8 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors flex items-center justify-center"
              style={{ textDecoration: 'none' }}
            >
              Continuer mes achats
            </Link>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}
