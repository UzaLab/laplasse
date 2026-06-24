'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { adminFetch } from '@/lib/adminApi'

interface AdminDeliveryDispute {
  id: string
  reason: string
  description: string | null
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED'
  admin_note: string | null
  created_at: string
  resolved_at: string | null
  user: { id: string; full_name: string | null; email: string }
  order: {
    id: string
    total: number
    shop: { name: string } | null
    delivery_job: { proof_photo_url: string | null; proof_confirmed_at: string | null } | null
  }
}

const STATUS_LABELS: Record<AdminDeliveryDispute['status'], string> = {
  OPEN: 'Ouvert',
  RESOLVED: 'Résolu',
  DISMISSED: 'Classé',
}

export default function AdminDeliveryDisputesPage() {
  const { ready } = useAdminSession()
  const [disputes, setDisputes] = useState<AdminDeliveryDispute[]>([])
  const [filter, setFilter] = useState<'all' | 'open'>('open')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!ready) return
    void fetchDisputes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready])

  const fetchDisputes = async () => {
    if (!ready) return
    setLoading(true)
    const qs = filter === 'open' ? '?filter=open' : ''
    const data = await adminFetch<AdminDeliveryDispute[]>(`/admin/delivery/disputes${qs}`)
    if (data) setDisputes(data)
    setLoading(false)
  }

  const resolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    if (!ready) return
    setProcessing(id)
    await adminFetch(`/admin/delivery/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_note: notes[id]?.trim() || undefined }),
    })
    setProcessing(null)
    void fetchDisputes()
  }

  return (
    <AdminPageContainer>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" /> Litiges livraison
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Signalements clients après livraison — photo preuve livreur incluse.
            </p>
          </div>
          <div className="flex gap-2">
            {(['open', 'all'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-sm font-bold ${
                  filter === f ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                {f === 'open' ? 'Ouverts' : 'Tous'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : disputes.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Aucun litige pour ce filtre.</p>
        ) : (
          <div className="space-y-4">
            {disputes.map(d => (
              <article key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{d.reason}</p>
                    <p className="text-sm text-slate-500 mt-1">
                      {d.user.full_name ?? d.user.email} · {d.order.shop?.name ?? 'Boutique'} · {d.order.total} FCFA
                    </p>
                    <Link href={`/profile/orders/${d.order.id}`} className="text-xs font-bold text-brand-600 mt-1 inline-block">
                      Commande {d.order.id.slice(0, 8)}…
                    </Link>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    d.status === 'OPEN' ? 'bg-amber-100 text-amber-800'
                      : d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                  }`}>
                    {STATUS_LABELS[d.status]}
                  </span>
                </div>

                {d.description && (
                  <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">{d.description}</p>
                )}

                {d.order.delivery_job?.proof_photo_url && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Photo preuve livreur</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.order.delivery_job.proof_photo_url}
                      alt="Preuve livraison"
                      className="max-h-48 rounded-xl border border-slate-100 object-cover"
                    />
                  </div>
                )}

                {d.status === 'OPEN' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <textarea
                      value={notes[d.id] ?? ''}
                      onChange={e => setNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                      rows={2}
                      placeholder="Note interne (visible client si résolu)…"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={processing === d.id}
                        onClick={() => resolve(d.id, 'RESOLVED')}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing === d.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        Résoudre
                      </button>
                      <button
                        type="button"
                        disabled={processing === d.id}
                        onClick={() => resolve(d.id, 'DISMISSED')}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} />
                        Classer
                      </button>
                    </div>
                  </div>
                )}

                {d.admin_note && d.status !== 'OPEN' && (
                  <p className="text-xs text-slate-500">
                    <span className="font-bold">Note admin :</span> {d.admin_note}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
    </AdminPageContainer>
  )
}
