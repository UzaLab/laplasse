'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2, CreditCard, Loader2, Smartphone, XCircle,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useAuthStore } from '@/stores/authStore'
import {
  checkout,
  confirmOrderPayment,
  fetchCart,
  formatPrice,
  type Cart,
  type CheckoutResult,
} from '@/lib/marketplaceApi'

type Step = 'form' | 'payment' | 'processing' | 'done'

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/checkout')
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState('')
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

  const handleCheckout = async () => {
    setError('')
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      setError('Adresse de livraison requise')
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
      setError(err ?? 'Erreur lors de la commande')
      setStep('form')
      return
    }

    setCheckoutResult(result)
    setStep('payment')
  }

  const handleConfirm = async (simulateResult: 'success' | 'failure') => {
    if (!checkoutResult) return
    setError('')
    setStep('processing')

    const { result, error: err } = await confirmOrderPayment(
      checkoutResult.paymentId,
      simulateResult,
    )

    if (!result) {
      setError(err ?? 'Erreur de paiement')
      setStep('payment')
      return
    }

    setPaymentResult(simulateResult)
    setStep('done')
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!cart?.items.length) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="max-w-lg mx-auto px-6 pt-28 pb-16 text-center">
          <p className="text-slate-500 mb-4">Votre panier est vide.</p>
          <Link href="/cart" className="text-amber-600 font-bold" style={{ textDecoration: 'none' }}>
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

      <main className="max-w-lg mx-auto px-6 pt-28 pb-16">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Finaliser la commande</h1>
        {cart.merchant && (
          <p className="text-sm text-slate-400 mb-8">{cart.merchant.business_name}</p>
        )}

        {step === 'form' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <p className="text-sm font-bold text-slate-900 mb-3">Mode de retrait</p>
              <div className="flex gap-2">
                {(['PICKUP', 'DELIVERY'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDeliveryType(type)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      deliveryType === type
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {type === 'PICKUP' ? 'Retrait sur place' : 'Livraison'}
                  </button>
                ))}
              </div>
            </div>

            {deliveryType === 'DELIVERY' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Adresse de livraison
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={e => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                  placeholder="Quartier, rue, repères…"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                placeholder="+225…"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Note pour le commerce (optionnel)
              </label>
              <textarea
                value={customerNote}
                onChange={e => setCustomerNote(e.target.value)}
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                placeholder="Instructions spéciales…"
              />
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex justify-between items-center">
              <span className="font-medium text-slate-600">Total à payer</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatPrice(cart.subtotal, cart.currency)}
              </span>
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Continuer vers le paiement
            </button>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center py-16">
            <Loader2 size={32} className="animate-spin text-amber-500 mb-4" />
            <p className="text-slate-500 font-medium">Traitement en cours…</p>
          </div>
        )}

        {step === 'payment' && checkoutResult && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
              <CreditCard size={32} className="text-amber-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-1">Montant</p>
              <p className="text-2xl font-extrabold text-slate-900 mb-4">
                {formatPrice(checkoutResult.amount, checkoutResult.currency)}
              </p>
              <p className="text-xs text-slate-400">
                Réf. {checkoutResult.reference}
              </p>
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

            {error && (
              <p className="text-sm text-red-600 font-medium text-center">{error}</p>
            )}
          </div>
        )}

        {step === 'done' && (
          <div className="text-center py-8">
            {paymentResult === 'success' ? (
              <>
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-xl font-extrabold text-slate-900 mb-2">Commande confirmée !</h2>
                <p className="text-slate-500 mb-6">
                  Merci {user?.full_name?.split(' ')[0] ?? ''}, votre commande a été enregistrée.
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
      </main>

      <Footer />
    </div>
  )
}
