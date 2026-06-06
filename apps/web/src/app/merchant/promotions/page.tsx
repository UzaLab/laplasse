'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tag, Loader2, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

interface Promotion {
  id: string
  title: string
  description: string | null
  type: string
  value: number
  code: string | null
  is_active: boolean
  starts_at: string
  ends_at: string
}

export default function MerchantPromotionsPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [promos, setPromos] = useState<Promotion[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', description: '', type: 'PERCENTAGE', value: '10', starts_at: '', ends_at: '' })

  const load = async () => {
    setLoading(true)
    const res = await merchantApiFetch('/promotions/mine', activeMerchantId)
    if (res.ok) setPromos(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (hydrated && !isAuthenticated) { router.push('/login?redirect=/merchant/promotions'); return }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    await merchantApiFetch('/promotions', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        value: Number(form.value),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      }),
    })
    setForm({ title: '', description: '', type: 'PERCENTAGE', value: '10', starts_at: '', ends_at: '' })
    load()
  }

  const toggle = async (id: string) => {
    await merchantApiFetch(`/promotions/${id}/toggle`, activeMerchantId, { method: 'PATCH' })
    load()
  }

  const remove = async (id: string) => {
    await merchantApiFetch(`/promotions/${id}`, activeMerchantId, { method: 'DELETE' })
    load()
  }

  return (
    <MerchantShell>
      <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-6">
        <Tag size={22} className="text-amber-500" /> Promotions
      </h1>

      <form onSubmit={create} className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 space-y-3">
        <p className="text-sm font-bold text-slate-700">Nouvelle offre</p>
        <input required placeholder="Titre *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-amber-400" />
        <div className="grid grid-cols-2 gap-3">
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm">
            <option value="PERCENTAGE">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
            <option value="FREE_ITEM">Article offert</option>
          </select>
          <input required type="number" placeholder="Valeur" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input required type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <input required type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
            className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl">
          <Plus size={14} /> Créer
        </button>
      </form>

      {loading ? (
        <Loader2 className="animate-spin text-slate-400 mx-auto" />
      ) : (
        <div className="space-y-3">
          {promos.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-400">{p.type} · {p.value}{p.type === 'PERCENTAGE' ? '%' : ' F'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggle(p.id)} className="text-slate-500">
                  {p.is_active ? <ToggleRight size={22} className="text-emerald-500" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => remove(p.id)} className="text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MerchantShell>
  )
}
