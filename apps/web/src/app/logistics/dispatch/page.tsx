'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Radio, RefreshCw, Truck, Zap } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { LogisticsDispatchJobCard } from '@/features/logistics/components/LogisticsDispatchJobCard'
import { LogisticsDispatchMapLazy } from '@/features/logistics/components/LogisticsDispatchMapLazy'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  assignPartnerJob,
  fetchPartnerDispatchBoard,
  releasePartnerJob,
  updatePartnerSettings,
  type DispatchBoardCourier,
  type DispatchBoardJob,
} from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

const POLL_MS = 8_000

const TABS = [
  { id: 'all', label: 'Toutes' },
  { id: 'PENDING', label: 'En attente' },
  { id: 'ASSIGNED', label: 'Assignées' },
  { id: 'in_route', label: 'En route' },
] as const

function matchesTab(job: DispatchBoardJob, tab: string) {
  if (tab === 'all') return true
  if (tab === 'in_route') return job.status === 'PICKED_UP' || job.status === 'IN_TRANSIT'
  return job.status === tab
}

function fleetForSelect(fleet: DispatchBoardCourier[]) {
  return fleet
    .filter(c => c.status === 'ACTIVE')
    .map(c => ({
      id: c.id,
      phone: '',
      vehicle: c.vehicle,
      status: c.status,
      is_online: c.is_online,
      rating_avg: c.rating_avg,
      rating_count: 0,
      completed_jobs: 0,
      cancellation_rate: 0,
      city: '',
      last_location_at: null,
      wallet_balance: 0,
      stats_90d: {
        total_jobs: 0,
        delivered_jobs: 0,
        active_jobs: c.active_jobs,
        success_rate: 0,
      },
      user: { full_name: c.label, email: '' },
    }))
}

export default function LogisticsDispatchPage() {
  const { ready, partner } = useLogisticsSession()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<string>('all')
  const [selectedCourier, setSelectedCourier] = useState<Record<string, string>>({})
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [newJobIds, setNewJobIds] = useState<Set<string>>(new Set())
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const prevJobIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  const verified = partner?.verification === 'VERIFIED'

  const { data: board, isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['logistics-dispatch-board'],
    queryFn: fetchPartnerDispatchBoard,
    enabled: ready && verified,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: true,
  })

  const jobs = board?.jobs ?? []
  const fleet = board?.fleet ?? []

  useEffect(() => {
    if (!jobs.length && !initializedRef.current) return

    const currentIds = new Set(jobs.map(j => j.id))
    const prev = prevJobIdsRef.current

    if (initializedRef.current) {
      const freshPending: string[] = []
      for (const job of jobs) {
        if (!prev.has(job.id) && job.status === 'PENDING') {
          freshPending.push(job.id)
          notify.success(`Nouvelle course — ${job.order.shop?.name ?? 'Commerce'}`)
        }
      }
      if (freshPending.length) {
        setNewJobIds(s => new Set([...s, ...freshPending]))
        window.setTimeout(() => {
          setNewJobIds(s => {
            const next = new Set(s)
            freshPending.forEach(id => next.delete(id))
            return next
          })
        }, 12_000)
      }
    } else {
      initializedRef.current = true
    }

    prevJobIdsRef.current = currentIds
    setLastUpdated(new Date(dataUpdatedAt))
  }, [jobs, dataUpdatedAt])

  const assignMutation = useMutation({
    mutationFn: async ({ jobId, courierId }: { jobId: string; courierId: string }) => {
      const { error } = await assignPartnerJob(jobId, courierId)
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      notify.success('Course assignée au livreur')
      void queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-board'] })
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const releaseMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const result = await releasePartnerJob(jobId)
      if (!result.ok) throw new Error(result.error ?? 'Libération impossible')
    },
    onSuccess: () => {
      notify.success('Course libérée — vous pouvez la réassigner')
      void queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-board'] })
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const settingsMutation = useMutation({
    mutationFn: async (auto: boolean) => {
      const { error } = await updatePartnerSettings({ auto_dispatch_default: auto })
      if (error) throw new Error(error)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['logistics-dispatch-board'] })
    },
    onError: (e: Error) => notify.error(e.message),
  })

  const counts = useMemo(() => ({
    all: jobs.length,
    PENDING: jobs.filter(j => j.status === 'PENDING').length,
    ASSIGNED: jobs.filter(j => j.status === 'ASSIGNED').length,
    in_route: jobs.filter(j => j.status === 'PICKED_UP' || j.status === 'IN_TRANSIT').length,
  }), [jobs])

  const visibleJobs = useMemo(
    () => jobs.filter(j => matchesTab(j, tab)),
    [jobs, tab],
  )

  const activeFleet = fleet.filter(c => c.status === 'ACTIVE')
  const onlineFleet = activeFleet.filter(c => c.is_online).length
  const urgentCount = jobs.filter(j => j.is_urgent && j.status === 'PENDING').length
  const selectFleet = useMemo(() => fleetForSelect(fleet), [fleet])

  const mapJobs = useMemo(
    () => jobs.map(j => ({
      id: j.id,
      label: j.order.shop?.name ?? 'Course',
      lat: j.pickup_lat ?? j.dropoff_lat ?? null,
      lng: j.pickup_lng ?? j.dropoff_lng ?? null,
      status: j.status,
      is_urgent: j.is_urgent,
    })),
    [jobs],
  )

  const mapCouriers = useMemo(
    () => fleet.map(c => ({
      id: c.id,
      label: c.label,
      lat: c.lat,
      lng: c.lng,
      is_online: c.is_online,
      active_jobs: c.active_jobs,
    })),
    [fleet],
  )

  if (!ready || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (!verified) {
    return (
      <LogisticsShell>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 text-sm text-amber-800">
          Votre structure doit être vérifiée par l&apos;admin pour accéder au dispatch.
        </div>
      </LogisticsShell>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Dispatch</h1>
            <p className="text-slate-500 mt-1">Carte temps réel, suggestions et assignation de votre flotte.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={board?.auto_dispatch_default ?? false}
                disabled={settingsMutation.isPending}
                onChange={e => settingsMutation.mutate(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <Zap size={14} className="text-amber-500" />
              Auto-dispatch
            </label>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl shrink-0">
              {isFetching ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Radio size={14} className="text-emerald-500" />
              )}
              Live · maj. {lastUpdated?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) ?? '—'}
            </div>
          </div>
        </div>

        <LogisticsDispatchMapLazy
          couriers={mapCouriers}
          jobs={mapJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
        />

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'En attente', value: counts.PENDING, accent: counts.PENDING > 0 ? 'border-amber-200 bg-amber-50/50' : '' },
            { label: 'Urgentes (>5 min)', value: urgentCount, accent: urgentCount > 0 ? 'border-red-200 bg-red-50/50' : '' },
            { label: 'Assignées', value: counts.ASSIGNED, accent: '' },
            { label: 'En route', value: counts.in_route, accent: '' },
            { label: 'Flotte en ligne', value: `${onlineFleet}/${activeFleet.length}`, accent: '' },
          ].map(item => (
            <div key={item.label} className={`bg-white rounded-2xl border border-slate-100 p-4 ${item.accent}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                tab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {t.label}
              {counts[t.id as keyof typeof counts] != null && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {counts[t.id as keyof typeof counts]}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : visibleJobs.length === 0 ? (
          <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
            <Truck className="mx-auto text-slate-200 mb-4" size={40} />
            <p className="font-bold text-slate-900">Aucune course {tab !== 'all' ? 'dans ce filtre' : 'active'}</p>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Les nouvelles commandes de vos commerces partenaires s&apos;afficheront ici automatiquement.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {visibleJobs.map(job => (
              <li key={job.id} id={`job-${job.id}`}>
                <LogisticsDispatchJobCard
                  job={job}
                  fleet={selectFleet}
                  assigning={assignMutation.isPending && assignMutation.variables?.jobId === job.id}
                  selectedCourierId={selectedCourier[job.id] ?? job.suggested_courier_id ?? ''}
                  onSelectCourier={courierId => setSelectedCourier(s => ({ ...s, [job.id]: courierId }))}
                  onAssign={() => {
                    const courierId = selectedCourier[job.id] ?? job.suggested_courier_id
                    if (!courierId) {
                      notify.error('Choisissez un livreur')
                      return
                    }
                    assignMutation.mutate({ jobId: job.id, courierId })
                  }}
                  onAssignNearest={() => {
                    const courierId = job.suggested_courier_id
                    if (!courierId) {
                      notify.error('Aucun livreur disponible à proximité')
                      return
                    }
                    assignMutation.mutate({ jobId: job.id, courierId })
                  }}
                  onRelease={() => {
                    if (!confirm('Libérer cette course et la remettre en attente ?')) return
                    releaseMutation.mutate(job.id)
                  }}
                  releasing={releaseMutation.isPending && releaseMutation.variables === job.id}
                  isNew={newJobIds.has(job.id)}
                  isHighlighted={selectedJobId === job.id}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </LogisticsShell>
  )
}
