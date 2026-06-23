'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, Package, Star, ToggleLeft, ToggleRight } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import { useCourierLocationSync } from '@/features/courier/hooks/useCourierLocationSync'
import { setCourierOnline } from '@/lib/courierApi'
import { fetchActiveJob } from '@/lib/courierJobsApi'
import { JOB_STATUS_LABELS } from '@/lib/courierJobLabels'
import { useAuthStore } from '@/stores/authStore'
import {
  COURIER_STATUS_LABELS, COURIER_STATUS_STYLES, vehicleLabel, type CourierStatus,
} from '@/lib/courierLabels'

export default function CourierDashboardPage() {
  const { ready, user, profile } = useCourierSession()
  const updateUser = useAuthStore(s => s.updateUser)
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState('')

  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus
  const canGoOnline = status === 'ACTIVE'
  const isOnline = profile?.is_online ?? false
  const { error: locationError, syncing: locationSyncing } = useCourierLocationSync(
    ready && !!profile && canGoOnline && isOnline,
  )

  const { data: activeJob } = useQuery({
    queryKey: ['courier-job-active'],
    queryFn: fetchActiveJob,
    enabled: ready && !!profile,
    refetchInterval: 20_000,
  })

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  const handleToggleOnline = async () => {
    if (!canGoOnline) return
    setToggling(true)
    setToggleError('')
    const result = await setCourierOnline(!isOnline)
    setToggling(false)
    if (result.error) {
      setToggleError(result.error)
      return
    }
    if (result.profile) {
      updateUser({ courier_profile: { ...profile, is_online: result.profile.is_online } })
    }
  }

  return (
    <CourierShell>
      <div className="w-full min-w-0 space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
            Bonjour{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-slate-500 mt-1">Votre espace livreur LaPlasse</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Statut', value: COURIER_STATUS_LABELS[status], icon: Package },
            { label: 'Ville', value: profile.city, icon: MapPin },
            { label: 'Véhicule', value: vehicleLabel(profile.vehicle), icon: Package },
            { label: 'Note', value: profile.rating_count ? `${profile.rating_avg?.toFixed(1)} ★` : '—', icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-[28px] border border-slate-100 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-slate-900">Disponibilité</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {canGoOnline
                  ? (isOnline ? 'Vous recevrez les prochaines courses.' : 'Passez en ligne pour recevoir des missions.')
                  : 'Votre profil doit être validé par l\'équipe ops.'}
              </p>
              <span className={`inline-flex mt-3 text-xs font-bold px-2.5 py-1 rounded-full ${COURIER_STATUS_STYLES[status]}`}>
                {COURIER_STATUS_LABELS[status]}
              </span>
            </div>
            <button
              type="button"
              disabled={!canGoOnline || toggling}
              onClick={handleToggleOnline}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 ${
                isOnline
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {toggling ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isOnline ? (
                <ToggleRight size={20} />
              ) : (
                <ToggleLeft size={20} />
              )}
              {isOnline ? 'En ligne' : 'Hors ligne'}
            </button>
          </div>
          {toggleError && (
            <p className="text-sm text-red-600 mt-3">{toggleError}</p>
          )}
          {isOnline && canGoOnline && (
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
              {locationSyncing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <MapPin size={12} className="text-emerald-600" />
              )}
              {locationError
                ? locationError
                : profile.current_latitude != null
                  ? `Position GPS synchronisée (${profile.current_latitude.toFixed(4)}, ${profile.current_longitude?.toFixed(4)})`
                  : 'Synchronisation GPS en cours…'}
            </p>
          )}
        </div>

        {status === 'PENDING_REVIEW' && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <p className="font-bold text-amber-900">Candidature en cours de validation</p>
            <p className="text-sm text-amber-800 mt-1">
              Notre équipe vérifie votre dossier. Vous serez notifié dès activation.
            </p>
            <Link
              href="/courier/onboarding"
              className="inline-block mt-3 text-sm font-bold text-amber-700 hover:text-amber-900"
              style={{ textDecoration: 'none' }}
            >
              Voir les prochaines étapes →
            </Link>
          </div>
        )}

        <div className="bg-slate-900 text-white rounded-[28px] p-6">
          <p className="text-lg font-extrabold mb-1">Missions</p>
          {activeJob ? (
            <>
              <p className="text-slate-400 text-sm">
                Course en cours — {activeJob.order.shop_name} ({JOB_STATUS_LABELS[activeJob.status]})
              </p>
              <Link
                href="/courier/missions"
                className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm hover:bg-emerald-400 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Gérer la mission
              </Link>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm">
                {isOnline
                  ? 'Consultez les missions disponibles dans votre zone.'
                  : 'Passez en ligne pour recevoir des courses.'}
              </p>
              <Link
                href="/courier/missions"
                className="inline-flex mt-4 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-900 font-bold text-sm hover:bg-emerald-400 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                Voir les missions
              </Link>
            </>
          )}
        </div>
      </div>
    </CourierShell>
  )
}
