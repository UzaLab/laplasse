'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  XCircle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CheckoutSteps } from '@/features/marketplace/components/CheckoutSteps'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import {
  checkout,
  confirmBatchOrderPayments,
  confirmOrderPayment,
  fetchCart,
  formatPrice,
  PLACEHOLDER_PRODUCT_IMAGE,
  type Cart,
  type CheckoutResult,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

type Step = 'form' | 'payment' | 'processing' | 'done'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/checkout')
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null)
  const [paymentResult, setPaymentResult] = useState<'success' | 'failure' | null>(null)

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
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      notify.error('Adresse de livraison requise')
      return
    }

    setStep('processing')
    const { result, error: err } = await checkout({
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'DELIVERY' ? deliveryAddress : undefined,
      customer_note: customerNote || undefined,
      customer_phone: customerPhone || undefined,
    })

    if (!result) {
      notify.error(err ?? 'Erreur lors de la commande')
      setStep('form')
      return
    }

    setCheckoutResult(result)
    setStep('payment')
  }

  const handleConfirm = async (simulateResult: 'success' | 'failure') => {
    if (!checkoutResult) return
    setStep('processing')

    const paymentIds = checkoutResult.orders.map(o => o.paymentId)
    const { result, error: err } =
      paymentIds.length > 1
        ? await confirmBatchOrderPayments(paymentIds, simulateResult)
        : await confirmOrderPayment(paymentIds[0], simulateResult)

    if (!result) {
      notify.error(err ?? 'Erreur de paiement')
      setStep('payment')
      return
    }

    if (simulateResult === 'success') {
      notify.success('Paiement confirmé')
    } else {
      notify.warning('Paiement échoué')
    }

    setPaymentResult(simulateResult)
    setStep('done')
  }

  const itemLabel =
    (cart?.item_count ?? 0) <= 1
      ? `${cart?.item_count ?? 0} article`
      : `${cart?.item_count ?? 0} articles`

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
      <CheckoutSteps current={step === 'payment' || step === 'processing' ? 3 : 2} />

      <main className={`${PAGE_CONTAINER} py-12`}>
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Finaliser la commande
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
            {step === 'form' && (
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
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 group lg:hidden"
                >
                  Continuer vers le paiement
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}

            {step === 'processing' && (
              <div className="flex flex-col items-center py-16 bg-white rounded-3xl border border-slate-100">
                <Loader2 size={32} className="animate-spin text-brand-500 mb-4" />
                <p className="text-slate-500 font-medium">Traitement en cours…</p>
              </div>
            )}

            {step === 'payment' && checkoutResult && (
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-center">
                  <CreditCard size={32} className="text-brand-500 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-1">Montant total</p>
                  <p className="text-2xl font-extrabold text-slate-900 mb-4">
                    {formatPrice(checkoutResult.total, checkoutResult.currency)}
                  </p>
                  {checkoutResult.orders.length > 1 && (
                    <p className="text-xs text-slate-500 mb-3">
                      {checkoutResult.orders.length} paiements simulateurs (un par boutique)
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
                  Simulateur Mobile Money — choisissez le résultat :
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleConfirm('success')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <Smartphone size={24} className="text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-700">Paiement OK</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConfirm('failure')}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={24} className="text-red-500" />
                    <span className="text-sm font-bold text-red-600">Échec</span>
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center py-8 bg-white rounded-3xl border border-slate-100 shadow-sm px-6">
                {paymentResult === 'success' ? (
                  <>
                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                    <h2 className="text-xl font-extrabold text-slate-900 mb-2">
                      {checkoutResult && checkoutResult.orders.length > 1
                        ? 'Commandes confirmées !'
                        : 'Commande confirmée !'}
                    </h2>
                    <p className="text-slate-500 mb-6">
                      Merci {user?.full_name?.split(' ')[0] ?? ''}, votre
                      {checkoutResult && checkoutResult.orders.length > 1 ? 's commandes ont' : ' commande a'} été enregistrée
                      {checkoutResult && checkoutResult.orders.length > 1 ? 's' : ''}.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/profile/orders')}
                      className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Voir mes commandes
                    </button>
                  </>
                ) : (
                  <>
                    <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-extrabold text-slate-900 mb-2">Paiement échoué</h2>
                    <p className="text-slate-500 mb-6">Veuillez réessayer ou contacter le commerce.</p>
                    <button
                      type="button"
                      onClick={() => setStep('form')}
                      className="bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                      Réessayer
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {(step === 'form' || step === 'payment') && (
            <div className="w-full lg:w-[400px] shrink-0">
              <div className="bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/40 lg:sticky lg:top-28">
                <h3 className="text-xl font-extrabold text-slate-900 mb-6">Résumé de la commande</h3>

                <ul className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {cart.items.map(item => (
                    <li key={item.id} className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-50 shrink-0 border border-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.product.image_url || PLACEHOLDER_PRODUCT_IMAGE}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-slate-400">{item.variant.name}</p>
                        )}
                        <p className="text-xs text-slate-500">× {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-900 shrink-0">
                        {formatPrice(item.line_total, cart.currency)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 mb-6 pt-4 border-t border-slate-100">
                  <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>Sous-total ({itemLabel})</span>
                    <span className="font-bold text-slate-900">
                      {formatPrice(cart.subtotal, cart.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600 font-medium">
                    <span>Livraison</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-bold">
                      {deliveryType === 'PICKUP' ? 'Retrait gratuit' : 'À confirmer'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-end mb-6 pt-4 border-t border-slate-100">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-extrabold text-brand-600">
                    {formatPrice(
                      step === 'payment' && checkoutResult
                        ? checkoutResult.total
                        : cart.subtotal,
                      cart.currency,
                    )}
                  </span>
                </div>

                {step === 'form' && (
                  <button
                    type="button"
                    onClick={handleCheckout}
                    className="hidden lg:flex w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 items-center justify-center gap-2 group"
                  >
                    Continuer vers le paiement
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <div className="text-center mt-6 pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                    <Lock size={12} /> Paiement 100% sécurisé
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
