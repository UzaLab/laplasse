'use client'

import { Loader2 } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import {
  COURIER_STATUS_LABELS, COURIER_STATUS_STYLES, vehicleLabel, type CourierStatus,
} from '@/lib/courierLabels'

export default function CourierProfilePage() {
  const { ready, user, profile } = useCourierSession()

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  const status = profile.status as CourierStatus

  return (
    <CourierShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Mon profil</h1>
          <p className="text-slate-500 mt-1">Informations de votre compte livreur</p>
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <p className="text-lg font-extrabold text-slate-900">{user?.full_name ?? '—'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`inline-flex mt-3 text-xs font-bold px-2.5 py-1 rounded-full ${COURIER_STATUS_STYLES[status]}`}>
              {COURIER_STATUS_LABELS[status]}
            </span>
          </div>
          <dl className="divide-y divide-slate-100">
            {[
              { label: 'Téléphone', value: profile.phone ?? user?.phone ?? '—' },
              { label: 'Ville', value: profile.city },
              { label: 'Pays', value: profile.country },
              { label: 'Véhicule', value: vehicleLabel(profile.vehicle) },
              { label: 'Plaque', value: profile.plate_number ?? '—' },
              { label: 'Courses livrées', value: String(profile.completed_jobs ?? 0) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between px-6 py-4 gap-4">
                <dt className="text-sm font-semibold text-slate-500">{label}</dt>
                <dd className="text-sm font-bold text-slate-900 text-right">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </CourierShell>
  )
}
