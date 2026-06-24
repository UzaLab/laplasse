'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Tags } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'

interface AdminCategory {
  id: string
  name: string
  slug: string
  icon: string | null
  is_active: boolean
  parent_id: string | null
  sort_order: number
  _count: { products: number }
}

export default function AdminProductCategoriesPage() {
  const { ready } = useAdminSession()
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', parent_id: '' })

  const load = async () => {
    const data = await adminFetch<AdminCategory[]>('/admin/product-categories')
    if (data) setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void load()
  }, [ready])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    await adminFetch('/admin/product-categories', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        parent_id: form.parent_id || undefined,
        country_codes: ['CI'],
      }),
    })
    setForm({ name: '', parent_id: '' })
    notify.success('Catégorie créée')
    void load()
  }

  const toggle = async (id: string, is_active: boolean) => {
    await adminFetch(`/admin/product-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !is_active }),
    })
    void load()
  }

  const roots = categories.filter(c => !c.parent_id)
  const childrenOf = (parentId: string) => categories.filter(c => c.parent_id === parentId)

  return (
    <AdminPageContainer className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Tags className="text-brand-500" /> Catégories marketplace
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Les marchands choisissent parmi ces catégories lors de la création de produits.
          </p>
        </div>

        <form onSubmit={create} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <p className="text-sm font-bold text-slate-700">Nouvelle catégorie</p>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Nom"
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
          />
          <select
            value={form.parent_id}
            onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
            className="w-full border border-slate-200 rounded-xl px-4 py-2 text-sm"
          >
            <option value="">— Catégorie racine —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl">
            <Plus size={14} /> Créer
          </button>
        </form>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <ul className="space-y-2">
            {roots.map(root => (
              <li key={root.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="font-bold text-slate-900">{root.name}</p>
                    <p className="text-xs text-slate-400">{root._count.products} produits · {root.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(root.id, root.is_active)}
                    className="text-xs font-bold text-slate-500"
                  >
                    {root.is_active ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {childrenOf(root.id).map(child => (
                  <div key={child.id} className="flex items-center justify-between px-4 py-2 pl-8 border-t border-slate-50 bg-slate-50/50">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{child.name}</p>
                      <p className="text-xs text-slate-400">{child._count.products} produits</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggle(child.id, child.is_active)}
                      className="text-xs text-slate-500"
                    >
                      {child.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
    </AdminPageContainer>
  )
}
