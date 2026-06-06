'use client'

import { useState } from 'react'
import { CreditCard, Loader2, CheckCircle2, XCircle, Smartphone } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { PLAN_PRICES, type SubscriptionPlan } from '@/lib/planLimits'

interface PaymentSimulatorProps {
  planId: SubscriptionPlan
  planName: string
  activeMerchantId?: string | null
  onSuccess: (plan: string) => void
  onClose: () => void
}

export function PaymentSimulator({
  planId,
  planName,
  activeMerchantId,
  onSuccess,
  onClose,
}: PaymentSimulatorProps) {
  const [step, setStep] = useState<'method' | 'confirm' | 'processing' | 'done'>('method')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [reference, setReference] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState<'success' | 'failure' | null>(null)
  const amount = PLAN_PRICES[planId]

  const initPayment = async () => {
    setError('')
    setStep('processing')
    try {
      const res = await authApiFetch('/payments/subscribe/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, merchantId: activeMerchantId ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur'))
        setStep('method')
        return
      }
      setPaymentId(data.id)
      setReference(data.reference)
      setStep('confirm')
    } catch {
      setError('Erreur réseau')
      setStep('method')
    }
  }

  const confirm = async (simulateResult: 'success' | 'failure') => {
    if (!paymentId) return
    setError('')
    setStep('processing')
    try {
      const res = await authApiFetch('/payments/subscribe/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, simulateResult }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Erreur de confirmation')
        setStep('method')
        return
      }
      setResult(simulateResult)
      setStep('done')
      if (simulateResult === 'success' && data.merchant?.subscription_plan) {
        onSuccess(data.merchant.subscription_plan)
      }
    } catch {
      setError('Erreur réseau')
      setStep('method')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-amber-50 rounded-2xl flex items-center justify-center">
            <CreditCard size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Simulateur de paiement</p>
            <h3 className="text-lg font-extrabold text-slate-900">Plan {planName}</h3>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-500">Montant</span>
            <span className="font-extrabold text-slate-900">{amount.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Mode</span>
            <span className="font-bold text-amber-600 flex items-center gap-1">
              <Smartphone size={14} /> Simulateur V1
            </span>
          </div>
          {reference && (
            <p className="text-[10px] text-slate-400 mt-2 font-mono">Réf. {reference}</p>
          )}
        </div>

        {step === 'method' && !paymentId && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              En production, ce flux sera remplacé par Orange Money / Wave. Pour la V1, testez un paiement simulé.
            </p>
            <button
              onClick={initPayment}
              className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors"
            >
              Lancer le paiement simulé
            </button>
          </div>
        )}

        {step === 'confirm' && paymentId && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">Choisissez le résultat du paiement simulé :</p>
            <div className="flex gap-3">
              <button
                onClick={() => confirm('success')}
                className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Succès
              </button>
              <button
                onClick={() => confirm('failure')}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <XCircle size={16} /> Échec
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex items-center justify-center gap-2 py-4 text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Traitement…
          </div>
        )}

        {step === 'done' && (
          <div className={`text-center py-4 rounded-2xl ${result === 'success' ? 'bg-emerald-50' : 'bg-red-50'}`}>
            {result === 'success' ? (
              <>
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-emerald-800">Paiement réussi !</p>
                <p className="text-sm text-emerald-600 mt-1">Votre plan {planName} est maintenant actif.</p>
              </>
            ) : (
              <>
                <XCircle size={32} className="text-red-500 mx-auto mb-2" />
                <p className="font-bold text-red-800">Paiement refusé</p>
                <p className="text-sm text-red-600 mt-1">Réessayez ou choisissez un autre plan.</p>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900"
        >
          Fermer
        </button>
      </div>
    </div>
  )
}
