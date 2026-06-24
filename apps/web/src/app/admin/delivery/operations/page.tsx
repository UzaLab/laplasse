'use client'

import { useEffect, useState } from 'react'
import { Loader2, UserPlus, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Truck } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { JOB_STATUS_LABELS } from '@/lib/courierJobLabels'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminDeliveryJob {
  id: string
  status: string
  fulfilment_mode: string
  created_at: string
  updated_at: string
  offer_expires_at: string | null
  order: { id: string; status: string; total: number; delivery_fulfilment_mode: string; shop: { name: string } | null }
  courier_profile: { id: string; phone: string; user: { full_name: string | null; email: string } } | null
  offered_to: { id: string; user: { full_name: string | null } } | null
}

interface AdminCourierOption {
  id: string
  phone: string
  city: string
  is_online: boolean
  user: { full_name: string | null; email: string }
}

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

// ─── Assignments tab ──────────────────────────────────────────────────────────

function AssignmentsTab() {
  const { ready } = useAdminSession()
  const [jobs, setJobs] = useState<AdminDeliveryJob[]>([])
  const [couriers, setCouriers] = useState<AdminCourierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selection, setSelection] = useState<Record<string, string>>({})

  const load = async () => {
    if (!ready) return
    setLoading(true)
    const [jobsData, couriersData] = await Promise.all([
      adminFetch<AdminDeliveryJob[]>('/admin/delivery/jobs?filter=active'),
      adminFetch<AdminCourierOption[]>('/admin/couriers?filter=active'),
    ])
    if (jobsData) setJobs(jobsData)
    if (couriersData) setCouriers(couriersData)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready])

  const reassign = async (jobId: string) => {
    const courierProfileId = selection[jobId]
    if (!courierProfileId) return
    setProcessing(jobId)
    await adminFetch(`/admin/delivery/jobs/${jobId}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ courier_profile_id: courierProfileId }),
    })
    setProcessing(null)
    void load()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => void load()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
          <RefreshCw size={15} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucune course active.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <article key={job.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">
                    {job.order.shop?.name ?? 'Commande'} · {job.order.total.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Job {job.id.slice(0, 10)}… · commande {job.order.status}
                  </p>
                  <p className="text-xs text-slate-400">
                    Mode : {job.fulfilment_mode === 'MERCHANT_OWN' ? 'Flotte marchand' : 'Réseau LaPlasse'}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ?? job.status}
                </span>
              </div>

              <div className="text-sm text-slate-600">
                {job.courier_profile ? (
                  <p><span className="font-bold">Assigné :</span> {job.courier_profile.user.full_name ?? job.courier_profile.user.email} · {job.courier_profile.phone}</p>
                ) : job.offered_to ? (
                  <p><span className="font-bold">Offre en cours :</span> {job.offered_to.user.full_name ?? 'Livreur'}</p>
                ) : (
                  <p className="text-amber-700 font-medium">En attente d&apos;assignation</p>
                )}
              </div>

              {['PENDING', 'ASSIGNED'].includes(job.status) && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
                  <select
                    value={selection[job.id] ?? ''}
                    onChange={e => setSelection(prev => ({ ...prev, [job.id]: e.target.value }))}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
                  >
                    <option value="">Choisir un livreur…</option>
                    {couriers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.user.full_name ?? c.user.email} · {c.city}{c.is_online ? ' · en ligne' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={!selection[job.id] || processing === job.id}
                    onClick={() => void reassign(job.id)}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {processing === job.id ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                    Réassigner
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Disputes tab ─────────────────────────────────────────────────────────────

function DisputesTab() {
  const { ready } = useAdminSession()
  const [disputes, setDisputes] = useState<AdminDeliveryDispute[]>([])
  const [filter, setFilter] = useState<'all' | 'open'>('open')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const fetchDisputes = async () => {
    if (!ready) return
    setLoading(true)
    const qs = filter === 'open' ? '?filter=open' : ''
    const data = await adminFetch<AdminDeliveryDispute[]>(`/admin/delivery/disputes${qs}`)
    if (data) setDisputes(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void fetchDisputes()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready])

  const resolve = async (id: string, status: 'RESOLVED' | 'DISMISSED') => {
    setProcessing(id)
    await adminFetch(`/admin/delivery/disputes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, admin_note: notes[id]?.trim() || undefined }),
    })
    setProcessing(null)
    void fetchDisputes()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['open', 'all'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {f === 'open' ? 'Ouverts' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : disputes.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">Aucun litige pour ce filtre.</p>
      ) : (
        <div className="space-y-3">
          {disputes.map(d => (
            <article key={d.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-bold text-slate-900">{d.reason}</p>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {d.user.full_name ?? d.user.email} · {d.order.shop?.name ?? 'Boutique'} · {d.order.total.toLocaleString('fr-FR')} FCFA
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    Commande {d.order.id.slice(0, 8)}…
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  d.status === 'OPEN' ? 'bg-amber-100 text-amber-800'
                    : d.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  {d.status === 'OPEN' ? 'Ouvert' : d.status === 'RESOLVED' ? 'Résolu' : 'Classé'}
                </span>
              </div>

              {d.description && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">{d.description}</p>
              )}

              {d.order.delivery_job?.proof_photo_url && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Photo preuve livreur</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.order.delivery_job.proof_photo_url} alt="Preuve livraison"
                    className="max-h-48 rounded-xl border border-slate-100 object-cover" />
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
                    <button type="button" disabled={processing === d.id} onClick={() => void resolve(d.id, 'RESOLVED')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2">
                      {processing === d.id ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                      Résoudre
                    </button>
                    <button type="button" disabled={processing === d.id} onClick={() => void resolve(d.id, 'DISMISSED')}
                      className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-2">
                      <XCircle size={15} /> Classer
                    </button>
                  </div>
                </div>
              )}

              {d.admin_note && d.status !== 'OPEN' && (
                <p className="text-xs text-slate-500"><span className="font-bold">Note admin :</span> {d.admin_note}</p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'assignments' | 'disputes'

export default function AdminDeliveryOperationsPage() {
  const [tab, setTab] = useState<Tab>('assignments')
  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Opérations livraison"
        description="Courses actives et réassignations · Litiges clients"
        icon={<Truck size={22} className="text-violet-600" />}
      />

      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['assignments', <Truck size={14} key="t" />, 'Courses actives'],
          ['disputes', <AlertTriangle size={14} key="a" />, 'Litiges'],
        ] as [Tab, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'assignments' ? <AssignmentsTab /> : <DisputesTab />}
    </AdminPageContainer>
  )
}
