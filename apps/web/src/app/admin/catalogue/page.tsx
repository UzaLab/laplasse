'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Plus, Search, Tags, ShoppingBag, Star,
  Save, X, ExternalLink, ChevronRight, Edit2, Check, Layers,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { authApiFetch } from '@/lib/authFetch'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  parent_id: string | null
  sort_order: number
  _count: { products: number }
}

interface MerchantCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  sort_order: number
  _count: { merchants: number }
  children: Array<MerchantCategory>
}

interface SpotlightData {
  marketplace_spotlight_limit: number
  featured_shops: Array<{ id: string; name: string; slug: string; marketplace_featured: boolean }>
}

interface ShopRow {
  id: string
  name: string
  slug: string
  status: string
  marketplace_featured: boolean
}

type Tab = 'product-categories' | 'merchant-categories' | 'spotlight'

// ─── Inline Edit ──────────────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
}: {
  value: string
  onSave: (v: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  const save = async () => {
    if (!draft.trim() || draft === value) { setEditing(false); return }
    setSaving(true)
    await onSave(draft.trim())
    setSaving(false)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true) }}
        className="group flex items-center gap-1.5 text-left hover:text-violet-700 transition-colors"
      >
        {value}
        <Edit2 size={12} className="opacity-0 group-hover:opacity-100 text-slate-400 shrink-0" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') void save(); if (e.key === 'Escape') setEditing(false) }}
        className="px-2 py-1 border border-violet-300 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200"
      />
      <button type="button" disabled={saving} onClick={save} className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
        <X size={12} />
      </button>
    </div>
  )
}

// ─── Tab: Product Categories ───────────────────────────────────────────────────

function ProductCategoriesTab() {
  const { ready } = useAdminSession()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', parent_id: '', icon: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    const data = await adminFetch<ProductCategory[]>('/admin/product-categories')
    if (data) setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { if (ready) void load() }, [ready, load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await adminFetch('/admin/product-categories', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        parent_id: form.parent_id || undefined,
        icon: form.icon || undefined,
        country_codes: ['CI'],
      }),
    })
    setForm({ name: '', parent_id: '', icon: '' })
    setShowForm(false)
    setCreating(false)
    notify.success('Catégorie créée')
    void load()
  }

  const update = async (id: string, data: { name?: string; is_active?: boolean; icon?: string | null }) => {
    await adminFetch(`/admin/product-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    void load()
  }

  const roots = categories.filter(c => !c.parent_id)
  const childrenOf = (pid: string) => categories.filter(c => c.parent_id === pid)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{categories.length} catégories</p>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
        >
          <Plus size={14} /> Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase">Nouvelle catégorie</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom de la catégorie"
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            />
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="Icône (emoji ou code)"
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.parent_id}
              onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="">— Catégorie racine —</option>
              {roots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={creating}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Créer
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">
                <X size={14} />
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
      ) : (
        <div className="space-y-2">
          {roots.map(root => (
            <div key={root.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {root.icon && <span className="text-lg shrink-0">{root.icon}</span>}
                  <div className="min-w-0">
                    <InlineEdit value={root.name} onSave={name => update(root.id, { name })} />
                    <p className="text-xs text-slate-400">{root.slug} · {root._count.products} produits · {childrenOf(root.id).length} sous-cat.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => void update(root.id, { is_active: !root.is_active })}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                      root.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {root.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              </div>
              {childrenOf(root.id).map(child => (
                <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10 border-t border-slate-50 bg-slate-50/40 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight size={12} className="text-slate-300 shrink-0" />
                    {child.icon && <span>{child.icon}</span>}
                    <div className="min-w-0">
                      <InlineEdit value={child.name} onSave={name => update(child.id, { name })} />
                      <p className="text-xs text-slate-400">{child._count.products} produits</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void update(child.id, { is_active: !child.is_active })}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      child.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {child.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Merchant Categories ─────────────────────────────────────────────────

function MerchantCategoriesTab() {
  const { ready } = useAdminSession()
  const [categories, setCategories] = useState<MerchantCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', parent_id: '', icon: '' })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    const data = await adminFetch<MerchantCategory[]>('/admin/categories')
    if (data) setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { if (ready) void load() }, [ready, load])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await adminFetch('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        parent_id: form.parent_id || undefined,
        icon: form.icon || undefined,
      }),
    })
    setForm({ name: '', parent_id: '', icon: '' })
    setShowForm(false)
    setCreating(false)
    notify.success('Catégorie créée')
    void load()
  }

  const update = async (id: string, data: { name?: string; is_active?: boolean; icon?: string | null }) => {
    await adminFetch(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    void load()
  }

  const allFlat = categories.flatMap(c => [c, ...c.children])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{allFlat.length} catégories</p>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
        >
          <Plus size={14} /> Nouvelle catégorie
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase">Nouvelle catégorie établissement</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Nom (ex. Restaurant, Beauté…)"
              className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            />
            <input
              value={form.icon}
              onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              placeholder="🍽️"
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={form.parent_id}
              onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
            >
              <option value="">— Catégorie racine —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={creating}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Créer
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50">
                <X size={12} />
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Layers size={36} className="mx-auto mb-3 opacity-30" />
          <p>Aucune catégorie définie</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map(root => (
            <div key={root.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {root.icon && <span className="text-xl shrink-0">{root.icon}</span>}
                  <div className="min-w-0">
                    <InlineEdit value={root.name} onSave={name => update(root.id, { name })} />
                    <p className="text-xs text-slate-400">
                      {root._count.merchants} établissements
                      {root.children.length > 0 && ` · ${root.children.length} sous-catégories`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void update(root.id, { is_active: !root.is_active })}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                    root.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  {root.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>
              {root.children.map(child => (
                <div key={child.id} className="flex items-center justify-between px-4 py-2.5 pl-10 border-t border-slate-50 bg-slate-50/40 gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <ChevronRight size={12} className="text-slate-300 shrink-0" />
                    {child.icon && <span>{child.icon}</span>}
                    <div className="min-w-0">
                      <InlineEdit value={child.name} onSave={name => update(child.id, { name })} />
                      <p className="text-xs text-slate-400">{child._count.merchants} établissements</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void update(child.id, { is_active: !child.is_active })}
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 transition-colors ${
                      child.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {child.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Spotlight Marketplace ───────────────────────────────────────────────

function SpotlightTab() {
  const { ready } = useAdminSession()
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null)
  const [limitDraft, setLimitDraft] = useState(6)
  const [savingLimit, setSavingLimit] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<ShopRow[]>([])
  const [searching, setSearching] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSpotlight = useCallback(async () => {
    const data = await adminFetch<SpotlightData>('/admin/marketplace/spotlight')
    if (data) { setSpotlight(data); setLimitDraft(data.marketplace_spotlight_limit) }
  }, [])

  useEffect(() => {
    if (!ready) return
    loadSpotlight().finally(() => setLoading(false))
  }, [ready, loadSpotlight])

  const searchShops = useCallback(async (q: string) => {
    setSearching(true)
    const path = q.trim() ? `/admin/shops?q=${encodeURIComponent(q.trim())}&limit=20` : '/admin/shops?limit=20'
    const data = await adminFetch<ShopRow[]>(path)
    setSearchResults(data ?? [])
    setSearching(false)
  }, [])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => void searchShops(searchQ), 300)
    return () => clearTimeout(t)
  }, [searchQ, ready, searchShops])

  const saveLimit = async () => {
    setSavingLimit(true)
    const res = await authApiFetch('/admin/marketplace/spotlight/limit', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: limitDraft }),
    })
    setSavingLimit(false)
    if (!res.ok) { notify.error('Impossible de mettre à jour la limite'); return }
    notify.success('Limite mise à jour')
    await loadSpotlight()
  }

  const toggleFeatured = async (shop: { id: string; name: string; slug: string }, featured: boolean) => {
    setToggling(shop.id)
    const res = await authApiFetch(`/admin/shops/${shop.id}/marketplace-featured`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured }),
    })
    setToggling(null)
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { message?: string }
      notify.error(err.message ?? 'Action impossible')
      return
    }
    notify.success(featured ? 'Boutique mise en avant' : 'Boutique retirée')
    await loadSpotlight()
    void searchShops(searchQ)
  }

  const featuredCount = spotlight?.featured_shops.length ?? 0
  const limit = spotlight?.marketplace_spotlight_limit ?? limitDraft

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>

  return (
    <div className="space-y-6">
      {/* Spotlight limit */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <p className="font-bold text-slate-900">Limite spotlight</p>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className={featuredCount >= limit ? 'text-amber-600 font-bold' : ''}>{featuredCount}</span>
              {' / '}{limit} places utilisées
            </p>
            {/* Progress bar */}
            <div className="mt-2 w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${featuredCount >= limit ? 'bg-amber-500' : 'bg-violet-500'}`}
                style={{ width: `${Math.min(100, (featuredCount / Math.max(limit, 1)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={24} value={limitDraft}
              onChange={e => setLimitDraft(Number(e.target.value))}
              className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center"
            />
            <button
              type="button" disabled={savingLimit} onClick={() => void saveLimit()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {savingLimit ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Enregistrer
            </button>
          </div>
        </div>
      </div>

      {/* Featured shops */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Star size={15} className="text-amber-500" />
          Boutiques en avant ({featuredCount})
        </h3>
        {featuredCount === 0 ? (
          <p className="text-sm text-slate-400">Aucune boutique sélectionnée</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {spotlight?.featured_shops.map(shop => (
              <div key={shop.id} className="flex items-center justify-between gap-3 bg-white border border-violet-100 rounded-2xl p-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{shop.name}</p>
                  <p className="text-xs text-slate-400">/{shop.slug}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link href={`/shop/${shop.slug}`} target="_blank"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={14} />
                  </Link>
                  <button type="button" disabled={toggling === shop.id} onClick={() => void toggleFeatured(shop, false)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 disabled:opacity-50">
                    {toggling === shop.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search & add */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Ajouter une boutique</h3>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Rechercher par nom ou slug…"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm"
          />
        </div>
        {searching ? (
          <Loader2 size={18} className="animate-spin text-slate-300" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {searchResults.map(shop => (
              <div key={shop.id} className="flex items-center justify-between gap-3 bg-white border border-slate-100 rounded-2xl p-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{shop.name}</p>
                  <p className="text-xs text-slate-400">
                    /{shop.slug} · {shop.status}
                    {shop.marketplace_featured && <span className="ml-1 text-violet-600 font-bold">· En avant</span>}
                  </p>
                </div>
                {!shop.marketplace_featured ? (
                  <button type="button" disabled={toggling === shop.id}
                    onClick={() => void toggleFeatured(shop, true)}
                    className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50 shrink-0">
                    {toggling === shop.id ? '…' : 'Mettre en avant'}
                  </button>
                ) : (
                  <span className="text-xs font-bold text-violet-600 shrink-0">Déjà ajoutée</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'product-categories', label: 'Catégories produits', icon: <Tags size={15} /> },
  { id: 'merchant-categories', label: 'Catégories établissements', icon: <Layers size={15} /> },
  { id: 'spotlight', label: 'Spotlight marketplace', icon: <ShoppingBag size={15} /> },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminCataloguePage() {
  const [tab, setTab] = useState<Tab>('product-categories')

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Catalogue"
        description="Catégories, référentiels produits et mise en avant marketplace."
        icon={<Tags size={22} className="text-violet-600" />}
      />

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              tab === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden">{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'product-categories' && <ProductCategoriesTab />}
      {tab === 'merchant-categories' && <MerchantCategoriesTab />}
      {tab === 'spotlight' && <SpotlightTab />}
    </AdminPageContainer>
  )
}
