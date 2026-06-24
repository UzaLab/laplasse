'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BadgeCheck,
  Ban,
  Loader2,
  MapPin,
  RotateCcw,
  Truck,
} from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@/lib/country'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

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
  service_zones: Array<{
    all_communes: boolean
    city: { name: string }
    communes: Array<{ commune: { name: string } }>
  }>
  _count: { jobs: number; reviews: number }
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-800 border-red-200',
  OFFLINE: 'bg-slate-50 text-slate-600 border-slate-200',
  DRAFT: 'bg-slate-50 text-slate-600 border-slate-200',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En attente KYC',
  ACTIVE: 'Actif',
  SUSPENDED: 'Suspendu',
  OFFLINE: 'Hors ligne',
  DRAFT: 'Brouillon',
}

const VEHICLE_LABELS: Record<string, string> = {
  MOTO: 'Moto',
  VELO: 'Vélo',
  VOITURE: 'Voiture',
  CAMIONNETTE: 'Camionnette',
}

export default function AdminDeliveryCouriersPage() {
  const { ready } = useAdminSession()
  const [couriers, setCouriers] = useState<AdminCourier[]>([])
  const [filter, setFilter] = useState<'pending' | 'active' | 'suspended' | 'all'>('pending')
  const [country, setCountry] = useState('CI')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    if (!ready) return
    void fetchCouriers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, country, ready])

  const fetchCouriers = async () => {
    if (!ready) return
    setLoading(true)
    const params = new URLSearchParams({ country })
    if (filter !== 'all') params.set('filter', filter)
    const data = await adminFetch<AdminCourier[]>(`/admin/couriers?${params}`)
    if (data) setCouriers(data)
    setLoading(false)
  }

  const updateStatus = async (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_REVIEW') => {
    if (!ready) return
    setProcessing(id)
    await adminFetch(`/admin/couriers/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
    await fetchCouriers()
    setProcessing(null)
  }

  const formatZones = (courier: AdminCourier) => {
    if (!courier.service_zones.length) return 'Aucune zone'
    return courier.service_zones.map(z => {
      if (z.all_communes) return `${z.city.name} (toutes communes)`
      const names = z.communes.map(c => c.commune.name).join(', ')
      return `${z.city.name} : ${names || '—'}`
    }).join(' · ')
  }

  return (
    <AdminPageContainer>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/admin/delivery"
              className="text-xs font-bold text-slate-400 hover:text-brand-600 mb-2 inline-block"
              style={{ textDecoration: 'none' }}
            >
              ← Ops livraison
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="text-brand-500" /> Livreurs — validation KYC
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Approuver les inscriptions, suspendre ou réactiver les profils livreurs.
            </p>
          </div>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium bg-white"
          >
            {SUPPORTED_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{getCountryLabel(c.code)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            ['pending', 'En attente KYC'],
            ['active', 'Actifs'],
            ['suspended', 'Suspendus'],
            ['all', 'Tous'],
          ] as const).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                filter === val
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : couriers.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm">Aucun livreur pour ce filtre.</div>
        ) : (
          <div className="space-y-4">
            {couriers.map(c => (
              <article key={c.id} className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="font-extrabold text-slate-900">
                        {c.user.full_name ?? c.user.email}
                      </h2>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[c.status] ?? STATUS_STYLES.DRAFT}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                      {c.is_online && c.status === 'ACTIVE' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                          En ligne
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{c.user.email} · {c.phone}</p>
                    <p className="text-sm text-slate-600 mt-2">
                      {VEHICLE_LABELS[c.vehicle] ?? c.vehicle}
                      {c.plate_number ? ` · ${c.plate_number}` : ''}
                      {' · '}{c.city}, {c.country}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {c.rating_avg > 0 ? `${c.rating_avg.toFixed(1)}/5` : 'Pas encore noté'}
                      {' · '}{c.completed_jobs} courses · {c._count.jobs} missions
                    </p>
                    <p className="text-xs text-slate-500 mt-3 flex items-start gap-1.5">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-amber-500" />
                      {formatZones(c)}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 shrink-0">
                    {c.status === 'PENDING_REVIEW' && (
                      <button
                        type="button"
                        disabled={processing === c.id}
                        onClick={() => void updateStatus(c.id, 'ACTIVE')}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                      >
                        {processing === c.id ? <Loader2 size={14} className="animate-spin" /> : <BadgeCheck size={14} />}
                        Approuver
                      </button>
                    )}
                    {c.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={processing === c.id}
                        onClick={() => void updateStatus(c.id, 'SUSPENDED')}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-50"
                      >
                        <Ban size={14} />
                        Suspendre
                      </button>
                    )}
                    {c.status === 'SUSPENDED' && (
                      <button
                        type="button"
                        disabled={processing === c.id}
                        onClick={() => void updateStatus(c.id, 'ACTIVE')}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                      >
                        <RotateCcw size={14} />
                        Réactiver
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
    </AdminPageContainer>
  )
}
