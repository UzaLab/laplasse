'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { parseApiError } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

interface Promotion {
  id: string
  title: string
  description: string | null
  type: string
  value: number
  code: string | null
  min_order_amount: number | null
  category_id: string | null
  category?: { id: string; name: string; slug: string } | null
  is_active: boolean
  starts_at: string
  ends_at: string
}

interface CategoryOption {
  id: string
  name: string
}

export function ShopPromotionsPanel() {
  const { activeMerchantId } = useAuthStore()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    type: 'PERCENTAGE',
    value: '10',
    min_order_amount: '',
    category_id: '',
    starts_at: '',
    ends_at: '',
  })

  const load = async () => {
    setLoading(true)
    const res = await merchantApiFetch('/promotions/mine', activeMerchantId)
    if (res.ok) setPromos(await res.json())
    setLoading(false)
  }

  const loadCategories = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/marketplace/product-categories?country=CI`,
    )
    if (res.ok) {
      const tree = await res.json() as Array<{ id: string; name: string; children?: typeof tree }>
      const flat: CategoryOption[] = []
      const walk = (nodes: typeof tree) => {
        for (const n of nodes) {
          flat.push({ id: n.id, name: n.name })
          if (n.children?.length) walk(n.children)
        }
      }
      walk(tree)
      setCategories(flat)
    }
  }

  useEffect(() => {
    void load()
    void loadCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMerchantId])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await merchantApiFetch('/promotions', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        code: form.code.trim() || undefined,
        type: form.type,
        value: Number(form.value),
        min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : undefined,
        category_id: form.category_id || undefined,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }),
    })
    if (!res.ok) {
      notify.error(await parseApiError(res))
      return
    }
    notify.success('Promotion créée')
    setForm({
      title: '',
      description: '',
      code: '',
      type: 'PERCENTAGE',
      value: '10',
      min_order_amount: '',
      category_id: '',
      starts_at: '',
      ends_at: '',
    })
    void load()
  }

  const toggle = async (id: string) => {
    const res = await merchantApiFetch(`/promotions/${id}/toggle`, activeMerchantId, { method: 'PATCH' })
    if (res.ok) void load()
    else notify.error(await parseApiError(res))
  }

  const remove = async (id: string) => {
    const res = await merchantApiFetch(`/promotions/${id}`, activeMerchantId, { method: 'DELETE' })
    if (res.ok) {
      notify.success('Promotion supprimée')
      void load()
    } else {
      notify.error(await parseApiError(res))
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <Tag size={18} className="text-amber-500" /> Promotions & codes promo
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">
          Créez des offres et codes promo utilisables au panier et au checkout.
        </p>
      </div>

      <form onSubmit={create} className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 space-y-3">
        <p className="text-sm font-bold text-slate-700">Nouvelle offre</p>
        <input
          required
          placeholder="Titre *"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400"
        />
        <input
          placeholder="Code promo (ex. BIENVENUE15)"
          value={form.code}
          onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400 font-mono uppercase"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm"
          >
            <option value="PERCENTAGE">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
            <option value="FREE_DELIVERY">Livraison offerte</option>
          </select>
          <input
            required
            type="number"
            placeholder="Valeur"
            value={form.value}
            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <input
          type="number"
          min={0}
          placeholder="Commande minimum (FCFA, optionnel)"
          value={form.min_order_amount}
          onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400"
        />
        <select
          value={form.category_id}
          onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400"
        >
          <option value="">Toute la boutique (pas de restriction catégorie)</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="datetime-local"
            value={form.starts_at}
            onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            required
            type="datetime-local"
            value={form.ends_at}
            onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl"
        >
          <Plus size={14} /> Créer
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-400" />
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-[28px] border border-slate-100">
          <Tag size={28} className="text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Aucune promotion pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-400">
                  {p.type} · {p.value}{p.type === 'PERCENTAGE' ? '%' : ' F'}
                  {p.code && <> · Code <span className="font-mono font-bold text-amber-700">{p.code}</span></>}
                  {p.min_order_amount != null && <> · Min. {p.min_order_amount.toLocaleString('fr-FR')} F</>}
                  {p.category && <> · Cat. {p.category.name}</>}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toggle(p.id)} className="text-slate-500">
                  {p.is_active
                    ? <ToggleRight size={22} className="text-emerald-500" />
                    : <ToggleLeft size={22} />}
                </button>
                <button type="button" onClick={() => remove(p.id)} className="text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
