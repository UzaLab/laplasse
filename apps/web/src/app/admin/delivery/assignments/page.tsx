'use client'

import { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Truck, UserPlus } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { JOB_STATUS_LABELS } from '@/lib/courierJobLabels'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { vehicleLabel, VEHICLE_OPTIONS } from '@/lib/courierLabels'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@/lib/country'

interface AdminDeliveryJob {
  id: string
  status: string
  fulfilment_mode: string
  required_vehicle: string | null
  created_at: string
  updated_at: string
  offer_expires_at: string | null
  order: {
    id: string
    status: string
    total: number
    delivery_fulfilment_mode: string
    shop: { name: string } | null
  }
  courier_profile: {
    id: string
    phone: string
    vehicle: string
    user: { full_name: string | null; email: string }
  } | null
  offered_to: {
    id: string
    user: { full_name: string | null }
  } | null
}

interface AdminCourierOption {
  id: string
  phone: string
  city: string
  vehicle: string
  is_online: boolean
  user: { full_name: string | null; email: string }
}

// Hiérarchie capacité véhicule
const VEHICLE_HIERARCHY = ['MOTO', 'TRICYCLE', 'CAR', 'VAN']
function isCompatible(courierVehicle: string, required: string | null) {
  if (!required) return true
  const ci = VEHICLE_HIERARCHY.indexOf(courierVehicle)
  const ri = VEHICLE_HIERARCHY.indexOf(required)
  return ci >= ri
}

export default function AdminDeliveryAssignmentsPage() {
  const { ready } = useAdminSession()
  const [country, setCountry] = useState('CI')
  const [jobs, setJobs] = useState<AdminDeliveryJob[]>([])
  const [couriers, setCouriers] = useState<AdminCourierOption[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [selection, setSelection] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!ready) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, country])

  const load = async () => {
    if (!ready) return
    setLoading(true)
    const [jobsData, couriersData] = await Promise.all([
      adminFetch<AdminDeliveryJob[]>(`/admin/delivery/jobs?filter=active&country=${country}`),
      adminFetch<AdminCourierOption[]>(`/admin/couriers?filter=active&country=${country}`),
    ])
    if (jobsData) setJobs(jobsData)
    if (couriersData) setCouriers(couriersData)
    setLoading(false)
  }

  const reassign = async (jobId: string) => {
    const courierProfileId = selection[jobId]
    if (!courierProfileId || !ready) return
    setProcessing(jobId)
    await adminFetch(`/admin/delivery/jobs/${jobId}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ courier_profile_id: courierProfileId }),
    })
    setProcessing(null)
    void load()
  }

  return (
    <AdminPageContainer>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Truck className="text-brand-500" /> Courses actives
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Réassignation manuelle des livreurs (fallback ops).
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Actualiser
          </button>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold"
          >
            {SUPPORTED_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-400 py-8 text-center">Aucune course active.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <article key={job.id} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">
                      {job.order.shop?.name ?? 'Commande'} · {job.order.total} FCFA
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Job {job.id.slice(0, 10)}… · commande {job.order.status}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Mode : {job.fulfilment_mode === 'MERCHANT_OWN' ? 'Flotte marchand' : 'Réseau LaPlasse'}
                      {job.required_vehicle && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                          {vehicleLabel(job.required_vehicle)} requis
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ?? job.status}
                  </span>
                </div>

                <div className="text-sm text-slate-600">
                  {job.courier_profile ? (
                    <p>
                      <span className="font-bold">Assigné :</span>{' '}
                      {job.courier_profile.user.full_name ?? job.courier_profile.user.email}
                      {' · '}{job.courier_profile.phone}
                      {' · '}<span className="text-slate-500">{vehicleLabel(job.courier_profile.vehicle)}</span>
                    </p>
                  ) : job.offered_to ? (
                    <p>
                      <span className="font-bold">Offre en cours :</span>{' '}
                      {job.offered_to.user.full_name ?? 'Livreur'}
                    </p>
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
                      {VEHICLE_OPTIONS.map(group => {
                        const groupCouriers = couriers.filter(c => c.vehicle === group.value && isCompatible(c.vehicle, job.required_vehicle))
                        if (!groupCouriers.length) return null
                        return (
                          <optgroup key={group.value} label={`${group.label}${!isCompatible(group.value, job.required_vehicle) ? ' ⚠ incompatible' : ''}`}>
                            {groupCouriers.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.user.full_name ?? c.user.email} · {c.city}
                                {c.is_online ? ' · en ligne' : ''}
                              </option>
                            ))}
                          </optgroup>
                        )
                      })}
                    </select>
                    <button
                      type="button"
                      disabled={!selection[job.id] || processing === job.id}
                      onClick={() => void reassign(job.id)}
                      className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                    >
                      {processing === job.id ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                      Réassigner
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
    </AdminPageContainer>
  )
}
