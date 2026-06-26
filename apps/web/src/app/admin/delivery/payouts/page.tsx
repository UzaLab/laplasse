'use client'

import { useCallback, useEffect, useState } from 'react'
import { Banknote, Loader2, Plus } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

interface LogisticsPartner {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  verification: string
}

interface LogisticsPayout {
  id: string
  period_start: string
  period_end: string
  amount: number
  status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'
  reference: string | null
  paid_at: string | null
  note: string | null
  created_at: string
}

const PAYOUT_STATUS: Record<LogisticsPayout['status'], string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  PAID: 'Payé',
  FAILED: 'Échoué',
}

export default function AdminDeliveryPayoutsPage() {
  const { ready } = useAdminSession()
  const [partners, setPartners] = useState<LogisticsPartner[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [payouts, setPayouts] = useState<LogisticsPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPayouts, setLoadingPayouts] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    period_start: '',
    period_end: '',
    amount: '',
    reference: '',
    note: '',
  })

  const loadPartners = useCallback(async () => {
    setLoading(true)
    const data = await adminFetch<LogisticsPartner[]>('/admin/delivery/partners?filter=verified')
    const list = data ?? []
    setPartners(list)
    setSelectedId(prev => prev || list[0]?.id || '')
    setLoading(false)
  }, [])

  const loadPayouts = useCallback(async (partnerId: string) => {
    if (!partnerId) return
    setLoadingPayouts(true)
    const data = await adminFetch<LogisticsPayout[]>(`/admin/logistics/payouts/${partnerId}`)
    setPayouts(data ?? [])
    setLoadingPayouts(false)
  }, [])

  useEffect(() => {
    if (!ready) return
    void loadPartners()
  }, [ready, loadPartners])

  useEffect(() => {
    if (!selectedId) return
    void loadPayouts(selectedId)
  }, [selectedId, loadPayouts])

  const createPayout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const amount = Number(form.amount)
    if (!form.period_start || !form.period_end || !amount) {
      notify.error('Période et montant requis')
      return
    }
    setCreating(true)
    const res = await adminFetch(`/admin/logistics/payouts/${selectedId}`, {
      method: 'POST',
      body: JSON.stringify({
        period_start: form.period_start,
        period_end: form.period_end,
        amount,
        reference: form.reference.trim() || undefined,
        note: form.note.trim() || undefined,
      }),
    })
    setCreating(false)
    if (!res) {
      notify.error('Création impossible')
      return
    }
    notify.success('Versement enregistré')
    setForm({ period_start: '', period_end: '', amount: '', reference: '', note: '' })
    void loadPayouts(selectedId)
  }

  const selectedPartner = partners.find(p => p.id === selectedId)

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Versements logistique"
        description="Suivi et création des paiements aux partenaires de livraison."
        icon={<Banknote size={22} className="text-indigo-600" />}
      />

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : partners.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun partenaire vérifié.</p>
      ) : (
        <>
          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Partenaire</label>
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white"
            >
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.trade_name ?? p.legal_name} — {p.city}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={createPayout} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
            <p className="font-bold text-slate-900 flex items-center gap-2">
              <Plus size={16} className="text-violet-600" />
              Nouveau versement — {selectedPartner?.trade_name ?? selectedPartner?.legal_name}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="date"
                required
                value={form.period_start}
                onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-full text-sm"
              />
              <input
                type="date"
                required
                value={form.period_end}
                onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                className="px-3 py-2 border border-slate-200 rounded-full text-sm"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="number"
                required
                min={1}
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="Montant (FCFA)"
                className="px-3 py-2 border border-slate-200 rounded-full text-sm"
              />
              <input
                type="text"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                placeholder="Référence virement (optionnel)"
                className="px-3 py-2 border border-slate-200 rounded-full text-sm"
              />
            </div>
            <input
              type="text"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Note interne (optionnel)"
              className="w-full px-3 py-2 border border-slate-200 rounded-full text-sm"
            />
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
            >
              {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Enregistrer le versement
            </button>
          </form>

          <section className="space-y-2">
            <h2 className="font-bold text-slate-900">Historique</h2>
            {loadingPayouts ? (
              <Loader2 className="animate-spin text-slate-300" size={20} />
            ) : payouts.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun versement enregistré.</p>
            ) : (
              payouts.map(p => (
                <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      {p.amount.toLocaleString('fr-FR')} FCFA
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(p.period_start).toLocaleDateString('fr-FR')} → {new Date(p.period_end).toLocaleDateString('fr-FR')}
                      {p.reference && ` · Réf. ${p.reference}`}
                    </p>
                    {p.note && <p className="text-xs text-slate-500 mt-1">{p.note}</p>}
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 shrink-0">
                    {PAYOUT_STATUS[p.status]}
                  </span>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </AdminPageContainer>
  )
}
