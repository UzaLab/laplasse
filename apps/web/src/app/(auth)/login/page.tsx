'use client'

import { SearchParamsWrapper } from '@/components/SearchParamsWrapper'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, MapPin, Smartphone, Bike, Truck, Building2 } from 'lucide-react'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import { invalidateAuthSession } from '@/lib/authSession'
import { BRAND_AUTH_SUBTITLE } from '@/lib/brandCopy'
import { PUBLIC_AUTH } from '@/lib/pageLayout'
import { getPhonePlaceholder, getCountryCode } from '@/lib/country'
import {
  buildRegisterUrl,
  getAuthIntentCopy,
  resolveAuthIntent,
} from '@/lib/authIntent'

type LoginMode = 'email' | 'otp'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const intentParam = searchParams.get('intent')
  const authIntent = resolveAuthIntent(redirectTo, intentParam)
  const intentCopy = getAuthIntentCopy(authIntent)
  const safeRedirect = redirectTo && !redirectTo.startsWith('//') ? redirectTo : '/'
  const registerHref = buildRegisterUrl(safeRedirect, authIntent !== 'default' ? authIntent : undefined)
  const setAuth = useAuthStore(s => s.setAuth)

  const [mode, setMode] = useState<LoginMode>('email')
  const [form, setForm] = useState({ email: '', password: '' })
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectAfterLogin = (user: AuthUser) => {
    if (redirectTo && !redirectTo.startsWith('//')) {
      router.push(redirectTo)
      return
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      router.push('/admin')
      return
    }
    if (user.logistics_partner) {
      router.push('/logistics')
      return
    }
    if (user.role === 'COURIER' || user.courier_profile) {
      router.push('/courier/dashboard')
      return
    }
    if (user.role === 'MERCHANT') {
      router.push('/merchant/dashboard')
      return
    }
    router.push('/')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message ?? 'Identifiants invalides')
        return
      }

      invalidateAuthSession()
      setAuth(data.user)
      redirectAfterLogin(data.user)
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!phone.trim()) { setError('Entrez votre numéro'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Erreur envoi OTP'); return }
      setOtpSent(true)
      setDevCode(data.dev_code ?? null)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phone, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message ?? 'Code invalide'); return }
      invalidateAuthSession()
      setAuth(data.user)
      redirectAfterLogin(data.user)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  const phonePlaceholder = getPhonePlaceholder(getCountryCode())

  const signupHref = authIntent === 'courier'
    ? '/courier/signup'
    : authIntent === 'logistics'
      ? '/logistics/signup'
      : authIntent === 'merchant'
        ? '/merchant/signup'
        : '/merchant/signup'

  const signupLabel = authIntent === 'courier'
    ? 'Créer un compte pour devenir livreur'
    : authIntent === 'logistics'
      ? intentCopy.registerLabel
      : 'Inscrire mon établissement →'

  const IntentIcon = authIntent === 'courier' ? Bike
    : authIntent === 'logistics' ? Truck
      : authIntent === 'merchant' ? Building2
        : null

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">

      {/* Card */}
      <div className={PUBLIC_AUTH}>

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 bg-slate-900 text-brand-500 rounded-xl flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">LaPlasse</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">{BRAND_AUTH_SUBTITLE}</p>
        </div>

        <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          {authIntent !== 'default' && intentCopy.badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider mb-4">
              {IntentIcon && <IntentIcon size={14} />}
              {intentCopy.badge}
            </div>
          )}
          <h1 className="text-2xl font-extrabold text-slate-900 mb-7">{intentCopy.title}</h1>
          {authIntent !== 'default' && (
            <p className="text-slate-500 text-sm mb-7 leading-relaxed -mt-4">
              {intentCopy.subtitle}
            </p>
          )}

          {authIntent !== 'default' && authIntent !== 'courier' && (
            <div className="mb-6 p-4 rounded-2xl bg-brand-50/80 border border-brand-100 text-sm text-slate-700 leading-relaxed">
              {intentCopy.registerPrompt}{' '}
              <Link href={registerHref} className="font-bold text-brand-700 hover:text-brand-800">
                {intentCopy.registerLabel}
              </Link>
              {' '}ou connectez-vous ci-dessous si vous avez déjà un compte.
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-2xl">
            {([['email', 'Email'], ['otp', 'Téléphone']] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => { setMode(val); setError(''); setOtpSent(false) }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  mode === val ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {val === 'otp' && <Smartphone size={14} className="inline mr-1 -mt-0.5" />}
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl">
              {error}
            </div>
          )}

          {mode === 'email' ? <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="vous@exemple.ci"
                required
                className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 text-slate-900 outline-none transition-all text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  required
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 text-slate-900 outline-none transition-all text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-slate-500 hover:text-brand-600">
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full transition-colors shadow-lg shadow-slate-900/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /> Connexion…</> : 'Se connecter'}
            </button>

            {authIntent === 'default' && (
              <p className="text-center text-sm text-slate-500 pt-2">
                {intentCopy.registerPrompt}{' '}
                <Link href={registerHref} className="font-bold text-brand-600 hover:text-brand-700">
                  {intentCopy.registerLabel}
                </Link>
              </p>
            )}
          </form> : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Numéro de téléphone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={phonePlaceholder}
                  disabled={otpSent}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-full px-4 py-3 text-slate-900 outline-none transition-all text-sm disabled:bg-slate-50"
                />
              </div>

              {devCode && (
                <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-800">
                  <span className="font-bold">Mode dev :</span> code = <span className="font-mono font-bold">{devCode}</span>
                </div>
              )}

              {otpSent && (
                <form onSubmit={handleVerifyOtp}>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Code OTP (6 chiffres)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono font-extrabold tracking-[0.4em] border-2 border-slate-200 focus:border-brand-400 rounded-full px-4 py-3 outline-none mb-4"
                  />
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Vérification…</> : 'Se connecter'}
                  </button>
                </form>
              )}

              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-full transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Envoi…</> : <><Smartphone size={18} /> Recevoir le code</>}
                </button>
              )}
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400 font-medium">ou</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Merchant CTA */}
          <Link
            href={signupHref}
            className="flex items-center justify-center gap-2 w-full border-2 border-slate-200 hover:border-brand-400 text-slate-700 font-semibold py-3 rounded-full transition-colors text-sm"
            style={{ textDecoration: 'none' }}
          >
            {signupLabel}
          </Link>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          En vous connectant, vous acceptez nos{' '}
          <Link href="/terms" className="underline hover:text-slate-600">CGU</Link>{' '}
          et notre{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">politique de confidentialité</Link>
        </p>
      </div>
    </div>
  )
}

function LoginContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}

export default function LoginPage() {
  return (
    <SearchParamsWrapper>
      <LoginContent />
    </SearchParamsWrapper>
  )
}
