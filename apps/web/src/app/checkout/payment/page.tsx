'use client'

import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Loader2, Smartphone, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MOBILE_BOTTOM_NAV_PAD } from '@/lib/mobilePublicChrome'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import { FoodCheckoutSteps } from '@/features/marketplace/components/FoodCheckoutSteps'
import { CheckoutOrderSummary } from '@/features/marketplace/components/CheckoutOrderSummary'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  buildCheckoutConfirmation,
  clearCheckoutDraft,
  clearCheckoutSession,
  draftFromCheckoutSession,
  getCheckoutSession,
  saveCheckoutConfirmation,
  saveCheckoutDraft,
  type CheckoutSession,
} from '@/lib/checkoutSession'
import {
  confirmBatchOrderPayments,
  confirmOrderPayment,
  fetchResumePayment,
  formatPrice,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import { isFoodOrderCart } from '@/lib/orderFlow'
import { captureCheckoutStep } from '@/lib/analytics'

function CheckoutPaymentContent() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      }
    >
      <CheckoutPaymentPageContent />
    </Suspense>
  )
}

function CheckoutPaymentPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const isFoodRoute = pathname.startsWith('/commande')
  const searchParams = useSearchParams()
  const resumeOrderIds = searchParams.get('orderIds')?.split(',').map(s => s.trim()).filter(Boolean) ?? []
  const authPath = isFoodRoute ? '/commande/paiement' : '/checkout/payment'
  const { hydrated, isAuthenticated } = useRequireAuth(authPath)
  const [session, setSession] = useState<CheckoutSession | null>(null)
  const [ready, setReady] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [resumeMode, setResumeMode] = useState(false)

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return

    const load = async () => {
      const stored = getCheckoutSession()
      if (stored) {
        saveCheckoutDraft(draftFromCheckoutSession(stored))
        setSession(stored)
        setResumeMode(false)
        setReady(true)
        return
      }

      if (resumeOrderIds.length) {
        const { session: resumed, error } = await fetchResumePayment(resumeOrderIds)
        if (!resumed) {
          notify.error(error ?? 'Impossible de reprendre le paiement')
          router.replace('/profile/orders')
          return
        }
        setSession(resumed as CheckoutSession)
        setResumeMode(true)
        setReady(true)
        return
      }

      router.replace(isFoodRoute ? '/commande/livraison' : '/checkout')
    }

    void load()
  }, [hydrated, isAuthenticated, router, resumeOrderIds.join(','), isFoodRoute])

  useEffect(() => {
    if (!ready || !session || isFoodRoute) return
    captureCheckoutStep('payment_started', {
      order_count: session.checkoutResult.orders.length,
      total: session.checkoutResult.total,
    })
  }, [ready, session, isFoodRoute])

  const isFoodFlow =
    isFoodRoute
    || (session?.cartSnapshot?.items
      ? isFoodOrderCart(session.cartSnapshot.items)
      : false)
  const Steps = isFoodFlow ? FoodCheckoutSteps : CheckoutSteps

  const handleConfirm = async (simulateResult: 'success' | 'failure') => {
    if (!session) return
    setProcessing(true)

    const paymentIds = session.checkoutResult.orders.map(o => o.paymentId)
    const { result, error: err } =
      paymentIds.length > 1
        ? await confirmBatchOrderPayments(paymentIds, simulateResult)
        : await confirmOrderPayment(paymentIds[0], simulateResult)

    if (!result) {
      notify.error(err ?? 'Erreur de paiement')
      setProcessing(false)
      return
    }

    const status = simulateResult === 'success' ? 'success' : 'failure'
    if (status === 'success') {
      notify.success('Paiement confirmé')
    } else {
      notify.warning('Paiement échoué')
    }

    saveCheckoutConfirmation(buildCheckoutConfirmation(session, status))
    if (status === 'success') {
      clearCheckoutSession()
      clearCheckoutDraft()
    }
    const orderIds = session.checkoutResult.orders.map(o => o.orderId).join(',')
    router.push(`/checkout/confirmation?status=${status}&orderIds=${orderIds}`)
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (!ready || !session) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  const { checkoutResult, cartSnapshot } = session

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <Steps current={3} />

      <main className={`${PAGE_CONTAINER} py-12 ${MOBILE_BOTTOM_NAV_PAD}`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Paiement
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            {resumeMode
              ? 'Reprise du paiement en attente — simulateur Mobile Money'
              : `Simulateur Mobile Money — ${checkoutResult.provider}`}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:w-[400px] shrink-0 lg:order-2">
            <CheckoutOrderSummary
              cart={cartSnapshot}
              total={checkoutResult.total}
              deliveryType={session.deliveryType}
              deliveryAddress={session.deliveryAddress}
              customerPhone={session.customerPhone}
              customerNote={session.customerNote}
              discountAmount={session.discountAmount}
              deliveryFee={session.deliveryFee}
              deliveryQuotes={session.deliveryQuotes}
              references={checkoutResult.orders.map(o => o.reference)}
              className="lg:sticky lg:top-28"
            />
          </div>

          <div className="w-full lg:flex-1 min-w-0 lg:order-1">
            {processing ? (
              <div className="flex flex-col items-center py-16 bg-white rounded-3xl border border-slate-100">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="text-slate-500 font-medium">Traitement du paiement…</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
                  <CreditCard size={32} className="text-brand-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-1">Montant à régler</p>
                  <p className="text-3xl font-extrabold text-slate-900 mb-4">
                    {formatPrice(checkoutResult.total, checkoutResult.currency)}
                  </p>
                  {checkoutResult.orders.length > 1 && (
                    <p className="text-xs text-slate-500 mb-3">
                      {checkoutResult.orders.length} paiements (un par boutique)
                    </p>
                  )}
                  <div className="space-y-2 text-left">
                    {checkoutResult.orders.map(order => (
                      <div
                        key={order.paymentId}
                        className="flex justify-between items-center text-xs bg-slate-50 rounded-xl px-3 py-2"
                      >
                        <span className="font-medium text-slate-600 truncate pr-2">
                          {order.merchant.business_name}
                        </span>
                        <span className="font-bold text-slate-900 shrink-0">
                          {formatPrice(order.amount, checkoutResult.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-slate-500 text-center">
                  Choisissez le résultat du simulateur :
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirm('success')}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <Smartphone size={24} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Paiement OK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm('failure')}
                    className="flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={24} className="text-red-500" />
                    <span className="text-sm font-bold text-red-600">Échec</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 text-center leading-relaxed">
                  {checkoutResult.instructions}
                </p>

                <div className="text-center">
                  {resumeMode ? (
                    <Link
                      href="/profile/orders"
                      className="text-sm font-bold text-slate-500 hover:text-slate-800"
                      style={{ textDecoration: 'none' }}
                    >
                      ← Retour à mes commandes
                    </Link>
                  ) : (
                    <Link
                      href="/checkout"
                      className="text-sm font-bold text-slate-500 hover:text-slate-800"
                      style={{ textDecoration: 'none' }}
                    >
                      ← Modifier la livraison
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  )
}

export default function CheckoutPaymentPage() {
  return (
    <SearchParamsWrapper>
      <CheckoutPaymentContent />
    </SearchParamsWrapper>
  )
}
