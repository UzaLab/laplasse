'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Loader2, Pause, Play, UserMinus, UserPlus } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { LogisticsDispatchMapLazy } from '@/features/logistics/components/LogisticsDispatchMapLazy'
import { LogisticsFleetInviteCard } from '@/features/logistics/components/LogisticsFleetInviteCard'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchFleetInviteLink,
  fetchPartnerFleet,
  linkPartnerFleetCourier,
  unlinkPartnerFleetCourier,
  updateFleetCourierStatus,
  type PartnerFleetCourier,
} from '@/lib/deliveryStakeholdersApi'
import { formatFcfa } from '@/lib/courierJobLabels'
import { vehicleLabel } from '@/lib/courierLabels'
import { notify } from '@/lib/notify'

export default function LogisticsFleetPage() {
  const { ready } = useLogisticsSession()
  const [fleet, setFleet] = useState<PartnerFleetCourier[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [unlinking, setUnlinking] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null)

  const { data: inviteLink } = useQuery({
    queryKey: ['logistics-fleet-invite'],
    queryFn: fetchFleetInviteLink,
    enabled: ready,
  })

  const load = async () => {
    setLoading(true)
    setFleet(await fetchPartnerFleet())
    setLoading(false)
  }

  useEffect(() => {
    if (ready) void load()
  }, [ready])

  const mapCouriers = useMemo(
    () => fleet.map(c => ({
      id: c.id,
      label: c.user.full_name ?? c.user.email,
      lat: c.current_latitude ?? null,
      lng: c.current_longitude ?? null,
      is_online: c.is_online,
      active_jobs: c.stats_90d.active_jobs,
    })),
    [fleet],
  )

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLinking(true)
    const { error } = await linkPartnerFleetCourier(email.trim())
    setLinking(false)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Livreur ajouté à la flotte')
    setEmail('')
    void load()
  }

  const handleUnlink = async (courierId: string) => {
    if (!window.confirm('Retirer ce livreur de votre flotte ?')) return
    setUnlinking(courierId)
    const { error } = await unlinkPartnerFleetCourier(courierId)
    setUnlinking(null)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Livreur retiré de la flotte')
    void load()
  }

  const toggleSuspend = async (courier: PartnerFleetCourier) => {
    const next = courier.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    setStatusUpdating(courier.id)
    const { ok, error } = await updateFleetCourierStatus(courier.id, next)
    setStatusUpdating(null)
    if (!ok) {
      notify.error(error ?? 'Erreur')
      return
    }
    notify.success(next === 'SUSPENDED' ? 'Livreur suspendu' : 'Livreur réactivé')
    void load()
  }

  const onlineCount = fleet.filter(c => c.is_online && c.status === 'ACTIVE').length

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Flotte livreurs</h1>
            <p className="text-slate-500 mt-1">
              {fleet.length} livreur{fleet.length !== 1 ? 's' : ''}
              {fleet.length > 0 && ` · ${onlineCount} en ligne`}
            </p>
          </div>
          <Link href="/logistics/dispatch" className="text-sm font-bold text-indigo-600 hover:text-indigo-700" style={{ textDecoration: 'none' }}>
            Ouvrir le dispatch →
          </Link>
        </div>

        {inviteLink && (
          <LogisticsFleetInviteCard
            partnerName={inviteLink.partner_name}
            url={inviteLink.url}
          />
        )}

        <LogisticsDispatchMapLazy
          couriers={mapCouriers}
          jobs={[]}
          selectedJobId={null}
          onSelectJob={() => {}}
          title="Positions flotte"
        />

        <form onSubmit={handleLink} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <UserPlus size={18} /> Rattacher un livreur existant
          </h2>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Email compte livreur" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
          <button type="submit" disabled={linking} className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50">
            {linking ? '…' : 'Ajouter par email'}
          </button>
        </form>

        {loading ? (
          <Loader2 className="animate-spin text-slate-300 mx-auto" size={28} />
        ) : fleet.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Aucun livreur dans la flotte — partagez le lien d&apos;invitation.</p>
        ) : (
          <ul className="space-y-3">
            {fleet.map(c => (
              <li key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Link href={`/logistics/fleet/${c.id}`} className="min-w-0 flex-1 group" style={{ textDecoration: 'none' }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.user.full_name ?? c.user.email}
                      </p>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 shrink-0" />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{c.phone} · {c.city}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : c.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {c.status === 'SUSPENDED' ? 'Suspendu' : c.is_online ? 'En ligne' : 'Hors ligne'}
                      </span>
                      {c.vehicle && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {vehicleLabel(c.vehicle)}
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="flex sm:flex-col items-end gap-2 shrink-0 text-right">
                    <p className="text-sm font-extrabold text-slate-900">{formatFcfa(c.wallet_balance)}</p>
                    {c.status !== 'SUSPENDED' && (
                      <button type="button" disabled={statusUpdating === c.id || c.stats_90d.active_jobs > 0} onClick={() => void toggleSuspend(c)} className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 disabled:opacity-40">
                        <Pause size={14} /> Suspendre
                      </button>
                    )}
                    {c.status === 'SUSPENDED' && (
                      <button type="button" disabled={statusUpdating === c.id} onClick={() => void toggleSuspend(c)} className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                        <Play size={14} /> Réactiver
                      </button>
                    )}
                    <button type="button" disabled={unlinking === c.id || c.stats_90d.active_jobs > 0} onClick={() => void handleUnlink(c.id)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-40">
                      <UserMinus size={14} /> Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </LogisticsShell>
  )
}
