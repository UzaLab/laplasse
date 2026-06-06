'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, Eye, X } from 'lucide-react'
import { AdminShell } from '@/features/admin/components/AdminShell'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'

interface Complaint {
  id: string
  reason: string
  description: string | null
  status: string
  created_at: string
  resolved_at: string | null
  merchant: { id: string; business_name: string; slug: string }
  reporter: { id: string; email: string; full_name: string | null }
}

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-red-50 text-red-700 border-red-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DISMISSED: 'bg-slate-50 text-slate-600 border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  UNDER_REVIEW: 'En cours',
  RESOLVED: 'Résolu',
  DISMISSED: 'Rejeté',
}

export default function AdminComplaintsPage() {
  const { ready, access_token } = useAdminSession()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !access_token) return
    fetchComplaints()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready, access_token])

  const fetchComplaints = async () => {
    if (!access_token) return
    setLoading(true)
    const qs = filter === 'open' ? '?filter=open' : ''
    const data = await adminFetch<Complaint[]>(`/admin/complaints${qs}`, access_token)
    if (data) setComplaints(data)
    setLoading(false)
  }

  const moderate = async (id: string, action: 'review' | 'resolve' | 'dismiss') => {
    if (!access_token) return
    setProcessing(id)
    await adminFetch(`/admin/complaints/${id}`, access_token, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    })
    await fetchComplaints()
    setProcessing(null)
  }

  return (
    <AdminShell pageTitle="Signalements">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">Signalements</h2>
        <p className="text-slate-400 text-sm mt-0.5">{complaints.length} signalements</p>
      </div>

      <div>
        <div className="flex gap-2 mb-6">
          {([['open', 'Ouverts'], ['all', 'Tous']] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                filter === val ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={28} className="animate-spin text-slate-300" />
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <CheckCircle2 size={48} className="text-emerald-300 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Aucun signalement en attente</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map(c => (
              <div key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status] ?? STATUS_STYLES.OPEN}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      <Link href={`/m/${c.merchant.slug}`} target="_blank" className="text-sm font-bold text-brand-600 hover:underline" style={{ textDecoration: 'none' }}>
                        {c.merchant.business_name}
                      </Link>
                      <span className="text-xs text-slate-400">
                        par {c.reporter.full_name ?? c.reporter.email}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(c.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 text-sm">{c.reason}</p>
                    {c.description && <p className="text-sm text-slate-600 mt-1 leading-relaxed">{c.description}</p>}
                  </div>

                  {(c.status === 'OPEN' || c.status === 'UNDER_REVIEW') && (
                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === 'OPEN' && (
                        <button
                          onClick={() => moderate(c.id, 'review')}
                          disabled={processing === c.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold rounded-xl text-xs hover:bg-amber-100 disabled:opacity-50"
                        >
                          {processing === c.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                          Examiner
                        </button>
                      )}
                      <button
                        onClick={() => moderate(c.id, 'resolve')}
                        disabled={processing === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 disabled:opacity-50"
                      >
                        <CheckCircle2 size={12} /> Résoudre
                      </button>
                      <button
                        onClick={() => moderate(c.id, 'dismiss')}
                        disabled={processing === c.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-xs hover:bg-red-100 disabled:opacity-50"
                      >
                        <X size={12} /> Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  )
}
