'use client'

import { useEffect, useState } from 'react'
import { Loader2, Truck, Building2, BadgeCheck, Ban, RotateCcw, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@/lib/country'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'
import { notify } from '@/lib/notify'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminCourier {
  id: string
  kind: string
  country: string
  city: string
  phone: string
  vehicle: string
  plate_number: string | null
  status: string
  is_online: boolean
  rating_avg: number
  rating_count: number
  completed_jobs: number
  created_at: string
  user: { id: string; email: string; full_name: string | null; phone: string | null }
  service_zones: Array<{ all_communes: boolean; city: { name: string }; communes: Array<{ commune: { name: string } }> }>
  _count: { jobs: number; reviews: number }
}

interface AdminLogisticsPartner {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  country: string
  phone: string
  verification: string
  is_active: boolean
  created_at: string
  owner: { full_name: string | null; email: string }
  _count: { couriers: number; contracts: number }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURIER_STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-800 border-red-200',
  OFFLINE: 'bg-slate-50 text-slate-600 border-slate-200',
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
}

const COURIER_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En attente KYC', ACTIVE: 'Actif', SUSPENDED: 'Suspendu',
  OFFLINE: 'Hors ligne', DRAFT: 'Brouillon',
}

const VEHICLE_LABELS: Record<string, string> = {
  MOTO: 'Moto', VELO: 'Vélo', VOITURE: 'Voiture', CAMIONNETTE: 'Camionnette',
}

const PARTNER_VERIF_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
}

// ─── Couriers tab ─────────────────────────────────────────────────────────────

function CouriersTab() {
  const { ready } = useAdminSession()
  const [couriers, setCouriers] = useState<AdminCourier[]>([])
  const [filter, setFilter] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending')
  const [country, setCountry] = useState('CI')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchCouriers = async () => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ country })
    if (filter !== 'all') params.set('filter', filter)
    const data = await adminFetch<AdminCourier[]>(`/admin/couriers?${params}`)
    if (data) setCouriers(data)
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void fetchCouriers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, country, ready])

  const updateStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW') => {
    setProcessing(id)
    await adminFetch(`/admin/couriers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await fetchCouriers()
    setProcessing(null)
  }

  const formatZones = (c: AdminCourier) => {
    if (!c.service_zones.length) return 'Aucune zone'
    return c.service_zones.map(z => {
      if (z.all_communes) return `${z.city.name} (toutes communes)`
      const names = z.communes.map(co => co.commune.name).join(', ')
      return `${z.city.name} : ${names || '—'}`
    }).join(' · ')
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex flex-wrap gap-2 flex-1">
          {(['pending', 'active', 'suspended', 'all'] as const).map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}>
              {f === 'pending' ? 'En attente KYC' : f === 'active' ? 'Actifs' : f === 'suspended' ? 'Suspendus' : 'Tous'}
            </button>
          ))}
        </div>
        <select value={country} onChange={e => setCountry(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white shrink-0">
          {SUPPORTED_COUNTRIES.map(c => (
            <option key={c.code} value={c.code}>{getCountryLabel(c.code)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : couriers.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Aucun livreur pour ce filtre.</div>
      ) : (
        <div className="space-y-3">
          {couriers.map(c => (
            <article key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-extrabold text-slate-900">{c.user.full_name ?? c.user.email}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${COURIER_STATUS_STYLES[c.status] ?? ''}`}>
                      {COURIER_STATUS_LABELS[c.status] ?? c.status}
                    </span>
                    {c.is_online && c.status === 'ACTIVE' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">En ligne</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{c.user.email} · {c.phone}</p>
                  <p className="text-sm text-slate-600 mt-1">
                    {VEHICLE_LABELS[c.vehicle] ?? c.vehicle}{c.plate_number ? ` · ${c.plate_number}` : ''} · {c.city}, {c.country}
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {c.rating_avg > 0 ? `${c.rating_avg.toFixed(1)}/5` : 'Pas encore noté'} · {c.completed_jobs} courses
                  </p>
                  <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                    <MapPin size={12} className="shrink-0 mt-0.5 text-amber-500" />
                    {formatZones(c)}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  {c.status === 'PENDING_REVIEW' && (
                    <button type="button" disabled={processing === c.id} onClick={() => void updateStatus(c.id, 'ACTIVE')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50">
                      {processing === c.id ? <Loader2 size={13} className="animate-spin" /> : <BadgeCheck size={13} />} Approuver
                    </button>
                  )}
                  {c.status === 'ACTIVE' && (
                    <button type="button" disabled={processing === c.id} onClick={() => void updateStatus(c.id, 'SUSPENDED')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50">
                      <Ban size={13} /> Suspendre
                    </button>
                  )}
                  {c.status === 'SUSPENDED' && (
                    <button type="button" disabled={processing === c.id} onClick={() => void updateStatus(c.id, 'ACTIVE')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50">
                      <RotateCcw size={13} /> Réactiver
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Partners tab ─────────────────────────────────────────────────────────────

function PartnersTab() {
  const { ready } = useAdminSession()
  const [partners, setPartners] = useState<AdminLogisticsPartner[]>([])
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const load = async () => {
    if (!ready) return
    setLoading(true)
    const qs = filter === 'all' ? '' : `?filter=${filter}`
    const data = await adminFetch<AdminLogisticsPartner[]>(`/admin/delivery/partners${qs}`)
    setPartners(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!ready) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, ready])

  const updateVerif = async (id: string, verification: 'VERIFIED' | 'REJECTED') => {
    setProcessing(id)
    const res = await adminFetch(`/admin/delivery/partners/${id}/verification`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verification }),
    })
    if (res) notify.success(verification === 'VERIFIED' ? 'Partenaire vérifié' : 'Partenaire rejeté')
    else notify.error('Erreur lors de la mise à jour')
    await load()
    setProcessing(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['pending', 'verified', 'all'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filter === f ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}>
            {f === 'pending' ? 'En attente' : f === 'verified' ? 'Vérifiés' : 'Tous'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">Aucun partenaire pour ce filtre.</div>
      ) : (
        <div className="space-y-3">
          {partners.map(p => (
            <article key={p.id} className="bg-white border border-slate-100 rounded-2xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <h3 className="font-extrabold text-slate-900">{p.legal_name}</h3>
                    {p.trade_name && <span className="text-sm text-slate-500">({p.trade_name})</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PARTNER_VERIF_STYLES[p.verification] ?? 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {p.verification}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {p.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{p.owner.full_name ?? p.owner.email}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{p.city}, {p.country} · {p.phone}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {p._count.couriers} livreur{p._count.couriers !== 1 ? 's' : ''} · {p._count.contracts} contrat{p._count.contracts !== 1 ? 's' : ''}
                  </p>
                </div>
                {p.verification === 'PENDING' && (
                  <div className="flex gap-2 shrink-0">
                    <button type="button" disabled={processing === p.id} onClick={() => void updateVerif(p.id, 'VERIFIED')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50">
                      {processing === p.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />} Vérifier
                    </button>
                    <button type="button" disabled={processing === p.id} onClick={() => void updateVerif(p.id, 'REJECTED')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50">
                      <XCircle size={13} /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'couriers' | 'partners'

export default function AdminDeliveryEquipesPage() {
  const [tab, setTab] = useState<Tab>('couriers')
  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Équipes de livraison"
        description="Gestion des livreurs (KYC) et des partenaires logistique."
        icon={<Truck size={22} className="text-violet-600" />}
      />

      <div className="flex gap-1 border-b border-slate-200">
        {([
          ['couriers', <Truck size={14} key="t" />, 'Livreurs'] ,
          ['partners', <Building2 size={14} key="p" />, 'Partenaires logistique'],
        ] as [Tab, React.ReactNode, string][]).map(([key, icon, label]) => (
          <button key={key} type="button" onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}>
            {icon}{label}
          </button>
        ))}
      </div>

      {tab === 'couriers' ? <CouriersTab /> : <PartnersTab />}
    </AdminPageContainer>
  )
}
