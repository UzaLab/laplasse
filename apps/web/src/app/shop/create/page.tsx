'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Loader2,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { useAuthStore } from '@/stores/authStore'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PUBLIC_NARROW } from '@/lib/pageLayout'
import { createShop } from '@/lib/shopApi'
import { notify } from '@/lib/notify'
import { getCountryCode, getDefaultCity } from '@/lib/country'

export default function CreateShopPage() {
  const router = useRouter()
  const { user, setActiveShop, updateUser } = useAuthStore()
  const { ready, hydrated, isAuthenticated } = useRequireAuth('/shop/create')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(() => ({
    name: '',
    description: '',
    phone: '',
    whatsapp: '',
    city: getDefaultCity(getCountryCode()),
    district: '',
    merchant_id: '',
  }))

  const merchants = user?.merchants ?? []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      notify.error('Le nom de la boutique est requis')
      return
    }

    setLoading(true)
    const { shop, error } = await createShop({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      merchant_id: form.merchant_id || undefined,
    })

    if (error || !shop) {
      notify.error(error ?? 'Impossible de créer la boutique')
      setLoading(false)
      return
    }

    updateUser({ shops: [...(user?.shops ?? []), shop] })
    setActiveShop(shop.id)
    notify.success('Boutique créée !')
    // If linked to a merchant → go to merchant shop flow; otherwise → standalone shop manage
    if (form.merchant_id) {
      router.push('/merchant/shop/products/new')
    } else {
      router.push('/shop/manage/products/new')
    }
  }

  if (!hydrated || !isAuthenticated) return null
  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className={`${PUBLIC_NARROW} pt-28 pb-16`}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8"
          style={{ textDecoration: 'none' }}
        >
          <ArrowLeft size={16} /> Retour
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center">
            <ShoppingBag size={24} className="text-brand-600" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">Créer ma boutique</h1>
        </div>
        <p className="text-slate-500 mb-8">
          Vendez en ligne sans établissement physique — vous aurez votre propre espace boutique pour gérer produits et commandes.
          Vous pouvez aussi lier la boutique à un établissement déjà inscrit sur LaPlasse.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nom de la boutique *
            </label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ex : Atelier Wax Yao"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Présentez votre univers, vos produits…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/10 focus:border-brand-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Téléphone</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quartier</label>
            <input
              value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              placeholder="Cocody, Plateau…"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {merchants.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Store size={14} /> Lier à un établissement (optionnel)
              </label>
              <select
                value={form.merchant_id}
                onChange={e => setForm(f => ({ ...f, merchant_id: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white"
              >
                <option value="">Boutique indépendante</option>
                {merchants.map(m => (
                  <option key={m.id} value={m.id}>{m.business_name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-2">
                Utile pour le retrait sur place chez vous et l&apos;upload de médias via votre fiche établissement.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Créer la boutique
          </button>
        </form>
      </main>
      <AppFooter />
    </div>
  )
}
