'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, MapPin, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { invalidateAuthSession } from '@/lib/authSession'

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setAuth = useAuthStore(s => s.setAuth)
  const refCode = searchParams.get('ref') ?? ''

  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const passwordStrength = form.password.length >= 8
    ? form.password.match(/[A-Z]/) && form.password.match(/[0-9]/) ? 'strong' : 'medium'
    : form.password.length > 0 ? 'weak' : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          ...(form.phone ? { phone: form.phone } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        const msg = typeof data.message === 'string' ? data.message : null
        setError(
          data.statusCode === 409
            ? (msg ?? 'Cet email est déjà utilisé. Connectez-vous à la place.')
            : (msg ?? 'Erreur lors de l\'inscription'),
        )
        return
      }

      invalidateAuthSession()
      setAuth(data.user)

      if (refCode) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/referral/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code: refCode }),
        }).catch(() => {})
      }

      router.push('/')
    } catch {
      setError('Erreur de connexion. Vérifiez votre réseau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-10 h-10 bg-slate-900 text-brand-500 rounded-xl flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">LaPlasse</span>
          </Link>
          <p className="text-slate-500 mt-2 text-sm">Votre guide des meilleures adresses à Abidjan</p>
        </div>

        <div className="bg-white rounded-[28px] shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Créer un compte</h1>
          <p className="text-slate-500 text-sm mb-7">
            Déjà inscrit ?{' '}
            <Link href="/login" className="font-bold text-brand-600 hover:text-brand-700">
              Se connecter
            </Link>
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                placeholder="Kouakou Aya"
                required
                className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 text-slate-900 outline-none transition-all text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="vous@exemple.ci"
                required
                className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 text-slate-900 outline-none transition-all text-sm"
              />
            </div>

            {/* Phone (optionnel) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Téléphone <span className="font-normal text-slate-400">(optionnel)</span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+225 07 00 00 00 00"
                className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 text-slate-900 outline-none transition-all text-sm"
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
                  placeholder="Min. 8 caractères"
                  required
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 text-slate-900 outline-none transition-all text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {['weak', 'medium', 'strong'].map((level, i) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          ['weak', 'medium', 'strong'].indexOf(passwordStrength) >= i
                            ? passwordStrength === 'strong' ? 'bg-emerald-500'
                              : passwordStrength === 'medium' ? 'bg-brand-500' : 'bg-red-400'
                            : 'bg-slate-100'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs font-semibold ${
                    passwordStrength === 'strong' ? 'text-emerald-600' :
                    passwordStrength === 'medium' ? 'text-brand-600' : 'text-red-500'
                  }`}>
                    {passwordStrength === 'strong' ? 'Fort' : passwordStrength === 'medium' ? 'Moyen' : 'Faible'}
                  </span>
                </div>
              )}
            </div>

            {/* Avantages */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-4 space-y-2">
              {['Accès aux adresses vérifiées', 'Sauvegardez vos favoris', 'Déposez des avis'].map(txt => (
                <div key={txt} className="flex items-center gap-2 text-sm text-brand-800 font-medium">
                  <CheckCircle2 size={15} className="text-brand-500 shrink-0" />
                  {txt}
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-lg shadow-slate-900/15 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading
                ? <><Loader2 size={18} className="animate-spin" /> Création du compte…</>
                : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          En créant un compte, vous acceptez nos{' '}
          <Link href="/terms" className="underline hover:text-slate-600">CGU</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterContent />
    </Suspense>
  )
}
