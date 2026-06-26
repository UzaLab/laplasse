'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertCircle, ArrowLeft, ChevronDown, ChevronRight, Loader2, Save, Search, Tags,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import {
  fetchShopProductCategories,
  getActiveShopIdForManage,
  getShopRoutesFromPathname,
  saveShopProductCategories,
  type ShopProductCategoryOption,
} from '@/lib/shopApi'
import { CategoryIcon } from '@/lib/icons'
import { notify } from '@/lib/notify'

function buildRoots(categories: ShopProductCategoryOption[]) {
  const ids = new Set(categories.map(c => c.id))
  return categories
    .filter(c => !c.parent_id || !ids.has(c.parent_id))
    .sort((a, b) => a.sort_order - b.sort_order)
}

function childrenOf(categories: ShopProductCategoryOption[], parentId: string) {
  return categories
    .filter(c => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function ShopProductCategoriesPanel() {
  const pathname = usePathname()
  const routes = getShopRoutesFromPathname(pathname)
  const { user, activeMerchantId, activeShopId } = useAuthStore()
  const shopId = getActiveShopIdForManage(user?.shops, activeMerchantId, activeShopId)
  const [categories, setCategories] = useState<ShopProductCategoryOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    if (!shopId) {
      setLoading(false)
      setLoadError('Aucune boutique liée à cet établissement.')
      return
    }
    setLoading(true)
    setLoadError(null)
    const { categories: data, error } = await fetchShopProductCategories(shopId)
    if (error) {
      setLoadError(error)
      setCategories([])
      setSelected(new Set())
    } else {
      setCategories(data)
      setSelected(new Set(data.filter(c => c.enabled).map(c => c.id)))
      setExpanded(new Set(buildRoots(data).map(r => r.id)))
    }
    setLoading(false)
  }, [shopId])

  useEffect(() => { void load() }, [load])

  const roots = useMemo(() => buildRoots(categories), [categories])

  const filteredRoots = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roots
    return roots.filter(root => {
      if (root.name.toLowerCase().includes(q)) return true
      return childrenOf(categories, root.id).some(c => c.name.toLowerCase().includes(q))
    })
  }, [roots, categories, search])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRootWithChildren = (rootId: string, kids: ShopProductCategoryOption[]) => {
    setSelected(prev => {
      const next = new Set(prev)
      const ids = [rootId, ...kids.map(k => k.id)]
      const allSelected = ids.every(id => next.has(id))
      if (allSelected) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const selectAllVisible = () => {
    setSelected(prev => {
      const next = new Set(prev)
      filteredRoots.forEach(root => {
        next.add(root.id)
        childrenOf(categories, root.id).forEach(c => next.add(c.id))
      })
      return next
    })
  }

  const clearAll = () => setSelected(new Set())

  const save = async () => {
    if (!shopId) return
    setSaving(true)
    const { ok, error } = await saveShopProductCategories(shopId, Array.from(selected))
    setSaving(false)
    if (!ok) {
      notify.error(error ?? 'Enregistrement impossible')
      return
    }
    notify.success('Catégories enregistrées')
    void load()
  }

  const q = search.trim().toLowerCase()

  return (
    <div className="space-y-6">
      <Link
        href={routes.products}
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
          Activez les catégories LaPlasse adaptées à votre boutique. Dépliez chaque famille pour
          choisir les sous-catégories précises.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4">
        {loadError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{loadError}</span>
          </div>
        )}

        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie ou sous-catégorie…"
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-full text-sm outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={selectAllVisible} className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
            Tout sélectionner
          </button>
          <button type="button" onClick={clearAll} className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
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
        ) : filteredRoots.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">
            {loadError ? 'Impossible d\'afficher les catégories.' : 'Aucune catégorie disponible.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredRoots.map(root => {
              const kids = childrenOf(categories, root.id)
              const visibleKids = q
                ? kids.filter(c => c.name.toLowerCase().includes(q) || root.name.toLowerCase().includes(q))
                : kids
              const isOpen = expanded.has(root.id) || !!q
              const rootChecked = selected.has(root.id)
              const kidsChecked = kids.filter(k => selected.has(k.id)).length
              const partial = !rootChecked && kidsChecked > 0 && kidsChecked < kids.length

              return (
                <div key={root.id} className="rounded-2xl border border-slate-100 overflow-hidden bg-slate-50/40">
                  <div className="flex items-center gap-2 px-3 py-3 bg-white">
                    <button
                      type="button"
                      onClick={() => toggleExpand(root.id)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 shrink-0"
                      aria-label={isOpen ? 'Replier' : 'Déplier'}
                    >
                      {kids.length > 0 ? (
                        <ChevronDown size={18} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                      ) : (
                        <ChevronRight size={18} className="opacity-30" />
                      )}
                    </button>
                    <label className={`flex flex-1 items-center gap-3 cursor-pointer min-w-0 rounded-xl px-2 py-1.5 transition-colors ${rootChecked ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={rootChecked}
                        ref={el => { if (el) el.indeterminate = partial }}
                        onChange={() => (kids.length ? toggleRootWithChildren(root.id, kids) : toggle(root.id))}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 shrink-0"
                      />
                      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                        <CategoryIcon name={root.icon} slug={root.slug} size={20} className="text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{root.name}</p>
                        <p className="text-xs text-slate-400">
                          {kids.length} sous-catégorie{kids.length > 1 ? 's' : ''}
                          {kidsChecked > 0 && ` · ${kidsChecked} activée${kidsChecked > 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </label>
                  </div>

                  {isOpen && visibleKids.length > 0 && (
                    <div className="border-t border-slate-100 bg-slate-50/80 px-3 py-2 space-y-1">
                      {visibleKids.map(child => (
                        <label
                          key={child.id}
                          className={`flex items-center gap-3 pl-10 pr-3 py-2.5 rounded-full cursor-pointer transition-colors ${
                            selected.has(child.id) ? 'bg-amber-50 border border-amber-200' : 'hover:bg-white border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selected.has(child.id)}
                            onChange={() => toggle(child.id)}
                            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                          />
                          <CategoryIcon name={child.icon} slug={child.slug} size={16} className="text-slate-500 shrink-0" />
                          <span className="text-sm text-slate-700 font-medium">{child.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={save}
          disabled={saving || !!loadError || loading}
          className="w-full py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer les catégories
        </button>
      </div>
    </div>
  )
}
