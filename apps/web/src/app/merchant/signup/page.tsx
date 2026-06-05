'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, Store, ArrowRight, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const CATEGORIES_STATIC = [
  { slug: 'restaurants',   label: 'Gastronomie',      emoji: '🍽️' },
  { slug: 'bars-lounges',  label: 'Bar & Lounge',      emoji: '🍷' },
  { slug: 'boutiques',     label: 'Boutique & Mode',   emoji: '💎' },
  { slug: 'beaute-spa',    label: 'Beauté & Spa',      emoji: '💆' },
  { slug: 'sport-fitness', label: 'Sport & Fitness',   emoji: '💪' },
  { slug: 'services',      label: 'Services',          emoji: '🔧' },
]

const DISTRICTS = [
  'Cocody', 'Plateau', 'Zone 4 / Marcory', 'Yopougon',
  'Adjamé', 'Treichville', 'Bingerville', 'Riviera',
]

export default function MerchantSignupPage() {
  const router = useRouter()
  const { isAuthenticated, access_token, user } = useAuthStore()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    business_name: '',
    category_slug: '',
    description: '',
    phone: '',
    whatsapp: '',
    address: '',
    district: '',
    city: 'Abidjan',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/merchant/signup')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.message ?? 'Erreur lors de la création')
        setLoading(false)
        return
      }

      router.push('/merchant/verify-phone?new=true')
    } catch {
      setError('Erreur réseau. Veuillez réessayer.')
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, label: 'Infos de base' },
    { num: 2, label: 'Localisation' },
    { num: 3, label: 'Contact' },
  ]

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: 'none' }}>
            <div className="w-8 h-8 bg-slate-900 text-brand-500 rounded-lg flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <span className="text-lg font-extrabold text-slate-900">LaPlasse</span>
          </Link>
          <span className="text-sm text-slate-400 font-medium">Inscrire mon établissement</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                step > s.num ? 'bg-emerald-500 border-emerald-500 text-white' :
                step === s.num ? 'bg-slate-900 border-slate-900 text-white' :
                'border-slate-200 text-slate-400'
              }`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-sm font-semibold hidden sm:block ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-slate-200 mx-2" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-200/40 p-8">

          {/* Étape 1 — Infos */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Votre établissement</h2>
                <p className="text-slate-500 text-sm">Présentez votre lieu en quelques mots.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Nom de l&apos;établissement *
                </label>
                <input
                  type="text"
                  value={form.business_name}
                  onChange={e => set('business_name', e.target.value)}
                  placeholder="Ex : Villa Maasai, Noom Rooftop…"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Catégorie *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {CATEGORIES_STATIC.map(cat => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => set('category_slug', cat.slug)}
                      className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all text-sm font-semibold ${
                        form.category_slug === cat.slug
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-brand-300'
                      }`}
                    >
                      <span className="text-2xl">{cat.emoji}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Description <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Décrivez votre lieu, votre ambiance, vos spécialités…"
                  rows={3}
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm resize-none"
                />
              </div>

              <button
                onClick={() => {
                  if (!form.business_name || !form.category_slug) {
                    setError('Renseignez le nom et la catégorie')
                    return
                  }
                  setError('')
                  setStep(2)
                }}
                className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                Continuer <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Étape 2 — Localisation */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Localisation</h2>
                <p className="text-slate-500 text-sm">Où se trouve votre établissement ?</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Quartier *</label>
                <div className="grid grid-cols-2 gap-2">
                  {DISTRICTS.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => set('district', d)}
                      className={`py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                        form.district === d
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-brand-300'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Adresse précise <span className="font-normal text-slate-400">(optionnel)</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  placeholder="Rue des Jardins, Zone 4…"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  onClick={() => {
                    if (!form.district) { setError('Choisissez un quartier'); return }
                    setError('')
                    setStep(3)
                  }}
                  className="flex-1 bg-slate-900 text-white font-bold py-3.5 rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  Continuer <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 — Contact & Finalisation */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Contact</h2>
                <p className="text-slate-500 text-sm">Comment vos clients peuvent vous joindre ?</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                  WhatsApp Business <span className="font-normal text-slate-400">(fortement recommandé)</span>
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => set('whatsapp', e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full border-2 border-slate-200 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 rounded-2xl px-4 py-3 outline-none transition-all text-sm"
                />
                <p className="text-xs text-slate-400 mt-1.5">Le bouton WhatsApp augmente les contacts de 3×</p>
              </div>

              {/* Récapitulatif */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2">
                <h4 className="text-sm font-bold text-slate-700 mb-3">Récapitulatif</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Établissement</span>
                  <span className="font-bold text-slate-900">{form.business_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Catégorie</span>
                  <span className="font-bold text-slate-900">{CATEGORIES_STATIC.find(c => c.slug === form.category_slug)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Localisation</span>
                  <span className="font-bold text-slate-900">{form.district}, {form.city}</span>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-2xl">
                  {error}
                </div>
              )}

              {!isAuthenticated && (
                <div className="px-4 py-3 bg-brand-50 border border-brand-200 text-brand-800 text-sm font-medium rounded-2xl">
                  Vous devez être connecté pour inscrire votre établissement.{' '}
                  <Link href="/login" className="font-bold underline">Se connecter</Link>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-3.5 border-2 border-slate-200 rounded-2xl font-bold text-slate-700 hover:border-slate-400 transition-colors"
                >
                  <ArrowLeft size={16} /> Retour
                </button>
                <button
                  disabled={loading || !form.phone}
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-60"
                >
                  {loading
                    ? <><Loader2 size={18} className="animate-spin" /> Création…</>
                    : <><Store size={18} /> Inscrire mon établissement</>
                  }
                </button>
              </div>
            </div>
          )}

          {error && step < 3 && (
            <p className="text-sm text-red-600 font-medium mt-3">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
