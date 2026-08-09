'use client'

import { useState } from 'react'
import { Loader2, Smartphone } from 'lucide-react'
import { notify } from '@/lib/notify'
import { useAuthStore } from '@/stores/authStore'
import { invalidateAuthSession } from '@/lib/authSession'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface GuestCheckoutAuthProps {
  /** Appelé après connexion invité réussie (ex. vider la file panier). */
  onAuthenticated?: () => void | Promise<void>
  compact?: boolean
}

export function GuestCheckoutAuth({ onAuthenticated, compact = false }: GuestCheckoutAuthProps) {
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    if (!phone.trim()) {
      notify.error('Entrez votre numéro de téléphone')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/guest/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Envoi OTP impossible')
      }
      const data = await res.json()
      if (data.dev_code) notify.info(`Code dev : ${data.dev_code}`)
      notify.success('Code envoyé par SMS')
      setStep('code')
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Erreur OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!code.trim()) {
      notify.error('Entrez le code reçu')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/guest/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message ?? 'Code invalide')
      }
      const data = await res.json()
      invalidateAuthSession()
      setAuth(data.user)
      notify.success('Connecté — vous pouvez finaliser votre commande')
      await onAuthenticated?.()
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Vérification impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact
      ? 'p-4 bg-brand-50/80 border border-brand-100 rounded-2xl'
      : 'mb-8 p-6 bg-brand-50/80 border border-brand-100 rounded-3xl'}>
      <div className="flex items-center gap-2 mb-3">
        <Smartphone size={18} className="text-brand-600" />
        <h2 className={`font-extrabold text-slate-900 ${compact ? 'text-sm' : ''}`}>
          Continuer sans compte
        </h2>
      </div>
      <p className={`text-slate-600 mb-4 ${compact ? 'text-xs leading-relaxed' : 'text-sm'}`}>
        Recevez un code par SMS pour commander — aucun mot de passe requis.
      </p>
      {step === 'phone' ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="+225 07 XX XX XX XX"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => void sendOtp()}
            disabled={loading}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Recevoir le code
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => void verifyOtp()}
            disabled={loading}
            className="px-6 py-3 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            Valider
          </button>
        </div>
      )}
    </div>
  )
}
