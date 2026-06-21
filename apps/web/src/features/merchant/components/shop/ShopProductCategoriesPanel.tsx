'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save, Search, Tags } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchShopProductCategories,
  saveShopProductCategories,
  type ShopProductCategoryOption,
} from '@/lib/shopApi'
import { notify } from '@/lib/notify'

function buildTree(categories: ShopProductCategoryOption[]) {
  const roots = categories.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId)
  return roots.flatMap(root => [root, ...childrenOf(root.id)])
}

export function ShopProductCategoriesPanel() {
  const { activeShopId } = useAuthStore()
  const [categories, setCategories] = useState<ShopProductCategoryOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!activeShopId) return
    setLoading(true)
    const data = await fetchShopProductCategories(activeShopId)
    setCategories(data)
    setSelected(new Set(data.filter(c => c.enabled).map(c => c.id)))
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const tree = buildTree(categories)
    if (!q) return tree
    return tree.filter(c => c.name.toLowerCase().includes(q))
  }, [categories, search])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(prev => {
      const next = new Set(prev)
      filtered.forEach(c => next.add(c.id))
      return next
    })
  }

  const clearAll = () => setSelected(new Set())

  const save = async () => {
    if (!activeShopId) return
    setSaving(true)
    const { ok, error } = await saveShopProductCategories(activeShopId, Array.from(selected))
    setSaving(false)
    if (!ok) {
      notify.error(error ?? 'Enregistrement impossible')
      return
    }
    notify.success('Catégories enregistrées')
    void load()
  }

  return (
    <div className="space-y-6">
      <Link
        href="/merchant/shop/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-amber-600"
        style={{ textDecoration: 'none' }}
      >
        <ArrowLeft size={16} /> Retour au catalogue
      </Link>

      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Tags size={22} className="text-amber-500" /> Gestion des catégories
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Sélectionnez les catégories et sous-catégories proposées par LaPlasse qui correspondent à
          votre boutique. Elles seront disponibles lors de la création de produits.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={selectAllVisible}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Tout sélectionner
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Tout désélectionner
          </button>
          <span className="text-xs text-slate-400 self-center ml-auto">
            {selected.size} sélectionnée{selected.size > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Aucune catégorie trouvée.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {filtered.map(cat => (
              <label
                key={cat.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${
                  selected.has(cat.id)
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                } ${cat.parent_id ? 'ml-4' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(cat.id)}
                  onChange={() => toggle(cat.id)}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                />
                <span className={`text-sm ${cat.parent_id ? 'text-slate-700' : 'font-bold text-slate-900'}`}>
                  {cat.parent_id ? `↳ ${cat.name}` : cat.name}
                </span>
              </label>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer les catégories
        </button>
      </div>
    </div>
  )
}
