'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Loader2, UserMinus, UserPlus } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchPartnerFleet,
  linkPartnerFleetCourier,
  unlinkPartnerFleetCourier,
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

  const load = async () => {
    setLoading(true)
    setFleet(await fetchPartnerFleet())
    setLoading(false)
  }

  useEffect(() => {
    if (ready) void load()
  }, [ready])

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

  const onlineCount = fleet.filter(c => c.is_online).length

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
          <Link
            href="/logistics/stats"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700"
            style={{ textDecoration: 'none' }}
          >
            Voir les statistiques →
          </Link>
        </div>

        <form onSubmit={handleLink} className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <UserPlus size={18} /> Rattacher un livreur
          </h2>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email compte livreur (/courier/signup)"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={linking}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {linking ? '…' : 'Ajouter'}
          </button>
        </form>

        {loading ? (
          <Loader2 className="animate-spin text-slate-300 mx-auto" size={28} />
        ) : fleet.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">Aucun livreur dans la flotte.</p>
        ) : (
          <ul className="space-y-3">
            {fleet.map(c => (
              <li key={c.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Link
                    href={`/logistics/fleet/${c.id}`}
                    className="min-w-0 flex-1 group"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {c.user.full_name ?? c.user.email}
                      </p>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-400 shrink-0" />
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{c.phone} · {c.city}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.is_online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {c.is_online ? 'En ligne' : 'Hors ligne'}
                      </span>
                      {c.vehicle && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {vehicleLabel(c.vehicle)}
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {c.stats_90d.success_rate}% OK · {c.stats_90d.delivered_jobs} livr.
                      </span>
                    </div>
                  </Link>
                  <div className="flex sm:flex-col items-end gap-2 shrink-0 text-right">
                    <p className="text-sm font-extrabold text-slate-900">{formatFcfa(c.wallet_balance)}</p>
                    <p className="text-xs text-slate-400">{c.rating_avg.toFixed(1)}/5 · {c.completed_jobs} courses</p>
                    <button
                      type="button"
                      disabled={unlinking === c.id || c.stats_90d.active_jobs > 0}
                      onClick={() => void handleUnlink(c.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 disabled:opacity-40"
                      title={c.stats_90d.active_jobs > 0 ? 'Course en cours' : 'Retirer de la flotte'}
                    >
                      <UserMinus size={14} />
                      {unlinking === c.id ? '…' : 'Retirer'}
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
