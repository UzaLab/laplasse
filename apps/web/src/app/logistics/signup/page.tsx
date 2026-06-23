'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Loader2 } from 'lucide-react'
import { registerLogisticsPartner } from '@/lib/deliveryStakeholdersApi'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { notify } from '@/lib/notify'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore, type AuthUser } from '@/stores/authStore'
import { invalidateAuthSession } from '@/lib/authSession'

export default function LogisticsSignupPage() {
  const { ready, isAuthenticated } = useRequireAuth('/logistics/signup')
  const router = useRouter()
  const setAuth = useAuthStore(s => s.setAuth)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    city: 'Abidjan',
    phone: '',
    email: '',
  })

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const { partner, error } = await registerLogisticsPartner({
      legal_name: form.legal_name,
      trade_name: form.trade_name || undefined,
      city: form.city,
      phone: form.phone,
      email: form.email || undefined,
      country: 'CI',
    })
    setSubmitting(false)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Structure enregistrée — validation admin requise')
    invalidateAuthSession()
    const meRes = await authApiFetch('/auth/me')
    if (meRes.ok) {
      const me = await meRes.json() as AuthUser
      setAuth(me)
    }
    router.push('/logistics')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 p-8 space-y-4 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Building2 className="text-indigo-600" size={24} />
          Inscription logistique
        </h1>
        <p className="text-sm text-slate-500">
          Créez votre structure pour recevoir des contrats de livraison des commerces LaPlasse.
        </p>
        <input
          required
          value={form.legal_name}
          onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))}
          placeholder="Raison sociale *"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <input
          value={form.trade_name}
          onChange={e => setForm(f => ({ ...f, trade_name: e.target.value }))}
          placeholder="Nom commercial"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <input
          required
          value={form.city}
          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
          placeholder="Ville"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <input
          required
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
          placeholder="Téléphone *"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <input
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="Email contact"
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Enregistrement…' : 'Créer ma structure'}
        </button>
      </form>
    </div>
  )
}
