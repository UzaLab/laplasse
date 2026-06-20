'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import { CheckoutOrderSummary } from '@/features/marketplace/components/CheckoutOrderSummary'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  buildCheckoutSession,
  saveCheckoutSession,
} from '@/lib/checkoutSession'
import {
  checkout,
  fetchCart,
  type Cart,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

export default function CheckoutPage() {
  const router = useRouter()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/checkout')
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  useEffect(() => {
    if (!ready) return
    fetchCart().then(data => {
      setCart(data)
      setLoading(false)
    })
  }, [ready])

  const allowPickup = cart?.delivery_options?.allow_pickup ?? true
  const allowDelivery = cart?.delivery_options?.allow_delivery ?? true

  useEffect(() => {
    if (!cart) return
    if (allowPickup && !allowDelivery) setDeliveryType('PICKUP')
    else if (!allowPickup && allowDelivery) setDeliveryType('DELIVERY')
  }, [cart, allowPickup, allowDelivery])

  const handleCheckout = async () => {
    if (!cart) return
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      notify.error('Adresse de livraison requise')
      return
    }

    setSubmitting(true)
    const { result, error: err } = await checkout({
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
      customer_note: customerNote || undefined,
      customer_phone: customerPhone || undefined,
    })

    if (!result) {
      notify.error(err ?? 'Erreur lors de la commande')
      setSubmitting(false)
      return
    }

    saveCheckoutSession(
      buildCheckoutSession(cart, result, {
        deliveryType,
        deliveryAddress: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
        customerPhone: customerPhone || undefined,
        customerNote: customerNote || undefined,
      }),
    )

    router.push('/checkout/payment')
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className={`${PAGE_CONTAINER} pt-28 pb-16 text-center`}>
          <p className="text-slate-500 mb-4">Votre panier est vide.</p>
          <Link href="/cart" className="text-brand-600 font-bold" style={{ textDecoration: 'none' }}>
            Retour au panier
          </Link>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <CheckoutSteps current={2} />

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Livraison & retrait
          </h1>
          {cart.merchant_count > 1 ? (
            <p className="text-slate-500 mt-2 font-medium">
              {cart.merchant_count} boutiques — {cart.merchants.map(m => m.business_name).join(', ')}
            </p>
          ) : cart.merchant ? (
            <p className="text-slate-500 mt-2 font-medium">{cart.merchant.business_name}</p>
          ) : null}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          <div className="w-full lg:flex-1 min-w-0">
            {submitting ? (
              <div className="flex flex-col items-center py-16 bg-white rounded-3xl border border-slate-100">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="text-slate-500 font-medium">Préparation de votre commande…</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <p className="text-sm font-bold text-slate-900 mb-3">Mode de retrait</p>
                  {!allowPickup && !allowDelivery ? (
                    <p className="text-sm text-red-600">
                      Aucun mode de livraison disponible pour les articles du panier.
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      {allowPickup && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType('PICKUP')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            deliveryType === 'PICKUP'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Retrait sur place
                        </button>
                      )}
                      {allowDelivery && (
                        <button
                          type="button"
                          onClick={() => setDeliveryType('DELIVERY')}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            deliveryType === 'DELIVERY'
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          Livraison
                        </button>
                      )}
                    </div>
                  )}
                  {allowPickup && allowDelivery && (
                    <p className="text-xs text-slate-500 mt-3">
                      Options communes à tous les articles de votre panier.
                    </p>
                  )}
                </div>

                {deliveryType === 'DELIVERY' && (
                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                    <label className="block text-sm font-bold text-slate-900 mb-2">
                      Adresse de livraison
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                      placeholder="Quartier, rue, repères…"
                    />
                  </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full h-10 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                    placeholder="+225…"
                  />
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Note pour le commerce (optionnel)
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    rows={2}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
                    placeholder="Instructions spéciales…"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group lg:hidden disabled:opacity-50"
                >
                  Continuer vers le paiement
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[400px] shrink-0">
            <CheckoutOrderSummary
              cart={cart}
              total={cart.subtotal}
              deliveryType={deliveryType}
              deliveryAddress={deliveryType === 'DELIVERY' ? deliveryAddress : undefined}
              customerPhone={customerPhone || undefined}
              customerNote={customerNote || undefined}
              className="lg:sticky lg:top-28"
            />
            {!submitting && (
              <button
                type="button"
                onClick={handleCheckout}
                className="hidden lg:flex w-full h-14 mt-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 items-center justify-center gap-2 group"
              >
                Continuer vers le paiement
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
