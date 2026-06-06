'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Smartphone, Loader2, CheckCircle2, ChevronLeft, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'

export default function VerifyPhonePage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [step, setStep] = useState<'send' | 'verify' | 'done'>('send')
  const [code, setCode] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hydrated && !isAuthenticated) { router.push('/login?redirect=/merchant/verify-phone'); return }
    checkStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const checkStatus = async () => {
    const res = await merchantApiFetch('/merchants/me/verify-phone/status', activeMerchantId)
    if (res.ok) {
      const data = await res.json()
      if (data.phone_verified) {
        setStep('done')
      }
    }
  }

  const sendOtp = async () => {
    setLoading(true)
    setError('')
    const res = await merchantApiFetch('/merchants/me/verify-phone/send', activeMerchantId, { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setPhoneMasked(data.phone_masked ?? '')
      setDevCode(data.dev_code ?? null)
      setStep('verify')
    } else {
      setError(data.message ?? 'Impossible d\'envoyer le code')
    }
    setLoading(false)
  }

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Entrez les 6 chiffres'); return }
    setLoading(true)
    setError('')

    const res = await merchantApiFetch('/merchants/me/verify-phone/confirm', activeMerchantId, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    if (res.ok) {
      setStep('done')
      setTimeout(() => router.push('/merchant/dashboard'), 2000)
    } else {
      setError(data.message ?? 'Code invalide')
    }
    setLoading(false)
  }

  if (hydrated && !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/merchant/dashboard" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 mb-6" style={{ textDecoration: 'none' }}>
          <ChevronLeft size={16} /> Retour
        </Link>

        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-xl shadow-slate-200/50">
          {step === 'done' ? (
            <div className="text-center py-4">
              <CheckCircle2 size={56} className="text-emerald-500 mx-auto mb-4" />
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Téléphone vérifié !</h1>
              <p className="text-slate-500 text-sm">Redirection vers votre tableau de bord…</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
                <Smartphone size={28} className="text-brand-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Vérifier votre téléphone</h1>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Étape obligatoire pour activer votre fiche. Un code à 6 chiffres sera envoyé sur votre numéro WhatsApp/téléphone.
              </p>

              {step === 'send' && (
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Smartphone size={18} />}
                  Envoyer le code OTP
                </button>
              )}

              {step === 'verify' && (
                <form onSubmit={confirmOtp} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Code envoyé au <span className="font-bold">{phoneMasked}</span>
                  </p>

                  {devCode && (
                    <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                      <span className="font-bold">Mode dev :</span> code = <span className="font-mono font-bold">{devCode}</span>
                    </div>
                  )}

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-3xl font-mono font-extrabold tracking-[0.5em] border-2 border-slate-200 focus:border-brand-400 rounded-2xl px-4 py-4 outline-none transition-all"
                    autoFocus
                  />

                  {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirmer'}
                  </button>

                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={loading}
                    className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={14} /> Renvoyer le code
                  </button>
                </form>
              )}

              {error && step === 'send' && (
                <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
