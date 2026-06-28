'use client'

import { useState } from 'react'
import { Loader2, Pencil, Check, X } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import { WebPushToggle } from '@/components/WebPushToggle'
import {
  COURIER_STATUS_LABELS, COURIER_STATUS_STYLES, vehicleLabel, VEHICLE_OPTIONS, type CourierStatus,
} from '@/lib/courierLabels'
import { updateCourierProfile } from '@/lib/courierApi'
import { useAuthStore } from '@/stores/authStore'

export default function CourierProfilePage() {
  const { ready, user, profile } = useCourierSession()
  const { updateUser } = useAuthStore()
  const [editing, setEditing] = useState(false)
  const [vehicle, setVehicle] = useState(profile?.vehicle ?? 'MOTO')
  const [plate, setPlate] = useState(profile?.plate_number ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  const status = profile.status as CourierStatus

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const result = await updateCourierProfile({
      vehicle,
      plate_number: plate,
    })
    setSaving(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    updateUser({
      courier_profile: {
        ...profile,
        vehicle: result.vehicle,
        plate_number: result.plate_number ?? null,
      },
    })
    setEditing(false)
  }

  const handleCancel = () => {
    setVehicle(profile.vehicle)
    setPlate(profile.plate_number ?? '')
    setError('')
    setEditing(false)
  }

  return (
    <CourierShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Mon profil</h1>
            <p className="text-slate-500 mt-1">Informations de votre compte livreur</p>
          </div>
          {!editing && (
            <button
              type="button"
              onClick={() => { setVehicle(profile.vehicle); setPlate(profile.plate_number ?? ''); setEditing(true) }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <Pencil size={15} /> Modifier
            </button>
          )}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <p className="text-lg font-extrabold text-slate-900">{user?.full_name ?? '—'}</p>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <span className={`inline-flex mt-3 text-xs font-bold px-2.5 py-1 rounded-full ${COURIER_STATUS_STYLES[status]}`}>
              {COURIER_STATUS_LABELS[status]}
            </span>
          </div>

          {editing ? (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Véhicule</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {VEHICLE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVehicle(opt.value)}
                      className={`p-3 rounded-2xl border-2 text-left transition-all ${
                        vehicle === opt.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-emerald-200'
                      }`}
                    >
                      <p className="font-bold text-slate-900 text-sm">{opt.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.hint}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Plaque <span className="text-slate-400 font-normal normal-case">(optionnel)</span>
                </label>
                <input
                  value={plate}
                  onChange={e => setPlate(e.target.value)}
                  placeholder="AB-123-CD"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 font-semibold outline-none focus:border-emerald-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-500 disabled:opacity-60"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  <X size={16} /> Annuler
                </button>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        <WebPushToggle variant="featured" />
      </div>
    </CourierShell>
  )
}
