'use client'

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle, Check, ChevronDown, ChevronLeft, ChevronRight, Database,
  Edit2, Loader2, Plus, Save, Search, Trash2, X,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { authApiFetch } from '@/lib/authFetch'
import { CategoryIcon } from '@/lib/icons'
import { notify } from '@/lib/notify'

const PAGE_SIZE = 10

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
        className="group flex items-center gap-1.5 text-left font-semibold text-slate-900 hover:text-violet-700 transition-colors"
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
        className="px-2 py-1 border border-violet-300 rounded-full text-sm font-bold outline-none focus:ring-2 focus:ring-violet-200 w-full max-w-[200px]"
      />
      <button type="button" disabled={saving} onClick={() => void save()} className="p-1 rounded text-emerald-600 hover:bg-emerald-50">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="p-1 rounded text-slate-400 hover:bg-slate-100">
        <X size={12} />
      </button>
    </div>
  )
}

function ProductCategoryEditModal({
  category,
  roots,
  onClose,
  onSave,
}: {
  category: ProductCategory
  roots: ProductCategory[]
  onClose: () => void
  onSave: (id: string, data: {
    name: string
    slug: string
    icon: string | null
    parent_id: string | null
    sort_order: number
  }) => Promise<boolean>
}) {
  const [form, setForm] = useState({
    name: category.name,
    slug: category.slug,
    icon: category.icon ?? '',
    parent_id: category.parent_id ?? '',
    sort_order: String(category.sort_order),
  })
  const [saving, setSaving] = useState(false)
  const parentOptions = roots.filter(c => c.id !== category.id)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const ok = await onSave(category.id, {
      name: form.name.trim(),
      slug: form.slug.trim(),
      icon: form.icon.trim() || null,
      parent_id: form.parent_id || null,
      sort_order: Number(form.sort_order) || 0,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Modifier la catégorie</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom" className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm" />
        <input required value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="Slug" className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm font-mono" />
        <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Icône Lucide (ex. Laptop, Shirt)" className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm" />
        <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm">
          <option value="">— Catégorie racine —</option>
          {parentOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} placeholder="Ordre" className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm" />
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-full bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Enregistrer
          </button>
        </div>
      </form>
    </div>
  )
}

function ProductCategoryDeleteModal({
  category,
  allCategories,
  onClose,
  onConfirm,
}: {
  category: ProductCategory
  allCategories: ProductCategory[]
  onClose: () => void
  onConfirm: (transferToId?: string) => Promise<boolean>
}) {
  const productCount = category._count.products
  const childCount = allCategories.filter(c => c.parent_id === category.id).length
  const [transferToId, setTransferToId] = useState('')
  const [deleting, setDeleting] = useState(false)
  const transferOptions = allCategories.filter(c => c.id !== category.id && c.is_active)

  const submit = async () => {
    if (productCount > 0 && !transferToId) {
      notify.error('Choisissez une catégorie de destination pour les produits')
      return
    }
    setDeleting(true)
    const ok = await onConfirm(productCount > 0 ? transferToId : undefined)
    setDeleting(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-50 text-red-600 shrink-0"><AlertTriangle size={20} /></div>
          <div>
            <h3 className="font-bold text-slate-900">Supprimer « {category.name} » ?</h3>
            <p className="text-sm text-slate-500 mt-1">
              Cette action est irréversible.
              {childCount > 0 && ` ${childCount} sous-catégorie(s) deviendront des racines.`}
            </p>
          </div>
        </div>
        {productCount > 0 && (
          <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">{productCount} produit(s) associé(s)</p>
            <select value={transferToId} onChange={e => setTransferToId(e.target.value)} className="w-full px-3 py-2 border border-amber-200 rounded-xl text-sm bg-white">
              <option value="">— Choisir une catégorie —</option>
              {transferOptions.map(c => (
                <option key={c.id} value={c.id}>{c.parent_id ? `↳ ${c.name}` : c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">Annuler</button>
          <button type="button" disabled={deleting} onClick={() => void submit()} className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

export function ProductCategoriesAdminTab() {
  const { ready } = useAdminSession()
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', parent_id: '', icon: '' })
  const [creating, setCreating] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ProductCategory | null>(null)
  const [deleting, setDeleting] = useState<ProductCategory | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    const data = await adminFetch<ProductCategory[]>('/admin/product-categories')
    if (data) setCategories(data)
    setLoading(false)
  }, [])

  useEffect(() => { if (ready) void load() }, [ready, load])

  const ids = useMemo(() => new Set(categories.map(c => c.id)), [categories])
  const roots = useMemo(
    () => categories.filter(c => !c.parent_id || !ids.has(c.parent_id)),
    [categories, ids],
  )
  const childrenOf = useCallback(
    (pid: string) => categories.filter(c => c.parent_id === pid).sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  )

  const filteredRoots = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roots
    return roots.filter(root => {
      if (root.name.toLowerCase().includes(q) || root.slug.toLowerCase().includes(q)) return true
      return childrenOf(root.id).some(
        c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q),
      )
    })
  }, [roots, search, childrenOf])

  const totalPages = Math.max(1, Math.ceil(filteredRoots.length / PAGE_SIZE))
  const pageRoots = filteredRoots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search])
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [page, totalPages])

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    await adminFetch('/admin/product-categories', {
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

  const seedCatalog = async () => {
    if (!confirm('Importer / mettre à jour le catalogue e-commerce standard ?')) return
    setSeeding(true)
    const res = await authApiFetch('/admin/seed-product-categories', { method: 'POST' })
    setSeeding(false)
    if (!res.ok) {
      notify.error('Import du catalogue impossible')
      return
    }
    const data = await res.json() as { roots: number; children: number; total: number }
    notify.success(`Catalogue importé (${data.total} catégories)`)
    void load()
  }

  const update = async (id: string, data: {
    name?: string
    slug?: string
    icon?: string | null
    parent_id?: string | null
    sort_order?: number
    is_active?: boolean
  }) => {
    const res = await authApiFetch(`/admin/product-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      notify.error('Mise à jour impossible')
      return false
    }
    notify.success('Catégorie mise à jour')
    void load()
    return true
  }

  const remove = async (transferToId?: string) => {
    if (!deleting) return false
    const res = await authApiFetch(`/admin/product-categories/${deleting.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ transfer_to_id: transferToId }),
    })
    if (!res.ok) {
      try {
        const data = await res.json()
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message
        notify.error(msg ?? 'Suppression impossible')
      } catch {
        notify.error('Suppression impossible')
      }
      return false
    }
    notify.success('Catégorie supprimée')
    void load()
    return true
  }

  const renderActions = (cat: ProductCategory) => (
    <div className="flex items-center justify-end gap-1">
      <button type="button" onClick={() => setEditing(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50" title="Modifier">
        <Edit2 size={14} />
      </button>
      <button type="button" onClick={() => setDeleting(cat)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50" title="Supprimer">
        <Trash2 size={14} />
      </button>
      <button
        type="button"
        onClick={() => void update(cat.id, { is_active: !cat.is_active })}
        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
          cat.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}
      >
        {cat.is_active ? 'Active' : 'Inactive'}
      </button>
    </div>
  )

  return (
    <div className="space-y-5">
      {editing && (
        <ProductCategoryEditModal category={editing} roots={roots} onClose={() => setEditing(null)} onSave={update} />
      )}
      {deleting && (
        <ProductCategoryDeleteModal category={deleting} allCategories={categories} onClose={() => setDeleting(null)} onConfirm={remove} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une catégorie…"
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-full text-sm bg-white outline-none focus:border-violet-400"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={seeding}
            onClick={() => void seedCatalog()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
          >
            {seeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
            Importer catalogue
          </button>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
          >
            <Plus size={14} /> Nouvelle
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        {filteredRoots.length} catégorie{filteredRoots.length > 1 ? 's' : ''} principale{filteredRoots.length > 1 ? 's' : ''}
        {' · '}{categories.length} au total
      </p>

      {showForm && (
        <form onSubmit={create} className="bg-violet-50 border border-violet-100 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-bold text-violet-700 uppercase">Nouvelle catégorie</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nom" className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-full text-sm bg-white" />
            <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))} placeholder="Icône Lucide" className="px-3 py-2 border border-slate-200 rounded-full text-sm bg-white" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))} className="px-3 py-2 border border-slate-200 rounded-full text-sm bg-white">
              <option value="">— Catégorie racine —</option>
              {roots.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={creating} className="flex-1 py-2 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Créer
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-sm hover:bg-slate-50"><X size={14} /></button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-300" size={24} /></div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 w-10" />
                  <th className="px-4 py-3 w-12">Icône</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3 hidden md:table-cell">Slug</th>
                  <th className="px-4 py-3 text-center">Produits</th>
                  <th className="px-4 py-3 text-center hidden sm:table-cell">Sous-cat.</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRoots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-500">Aucune catégorie trouvée.</td>
                  </tr>
                ) : pageRoots.map(root => {
                  const kids = childrenOf(root.id)
                  const isOpen = expanded.has(root.id)
                  const q = search.trim().toLowerCase()
                  const visibleKids = q
                    ? kids.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || root.name.toLowerCase().includes(q))
                    : kids

                  return (
                    <Fragment key={root.id}>
                      <tr
                        key={root.id}
                        className="border-b border-slate-50 hover:bg-violet-50/30 cursor-pointer transition-colors"
                        onClick={() => kids.length > 0 && toggleExpand(root.id)}
                      >
                        <td className="px-4 py-3 text-slate-400">
                          {kids.length > 0 && (
                            <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                            <CategoryIcon name={root.icon} slug={root.slug} size={18} className="text-violet-600" />
                          </div>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <InlineEdit value={root.name} onSave={async name => { await update(root.id, { name }) }} />
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-slate-400">{root.slug}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{root._count.products}</td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell text-slate-600">{kids.length}</td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>{renderActions(root)}</td>
                      </tr>
                      {isOpen && visibleKids.map(child => (
                        <tr key={child.id} className="border-b border-slate-50 bg-slate-50/60">
                          <td className="px-4 py-2.5" />
                          <td className="px-4 py-2.5 pl-8">
                            <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                              <CategoryIcon name={child.icon} slug={child.slug} size={15} className="text-slate-500" />
                            </div>
                          </td>
                          <td className="px-4 py-2.5" colSpan={1}>
                            <div className="flex items-center gap-2 pl-2 border-l-2 border-violet-200">
                              <InlineEdit value={child.name} onSave={async name => { await update(child.id, { name }) }} />
                            </div>
                          </td>
                          <td className="px-4 py-2.5 hidden md:table-cell font-mono text-xs text-slate-400">{child.slug}</td>
                          <td className="px-4 py-2.5 text-center text-slate-600">{child._count.products}</td>
                          <td className="px-4 py-2.5 hidden sm:table-cell" />
                          <td className="px-4 py-2.5">{renderActions(child)}</td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">Page {page} / {totalPages}</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
