'use client'

import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Package, Radio } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { CourierJobCard } from '@/features/courier/components/CourierJobCard'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import {
  acceptCourierJob,
  advanceCourierJob,
  fetchActiveJob,
  fetchAvailableJobs,
  fetchJobHistory,
  rejectCourierJob,
  uploadCourierProofPhoto,
  type DeliveryJobStatus,
} from '@/lib/courierJobsApi'
import { WebPushToggle } from '@/components/WebPushToggle'
import { notify } from '@/lib/notify'

type Tab = 'available' | 'active' | 'history'

export default function CourierMissionsPage() {
  const { ready, profile } = useCourierSession()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('active')
  const [actionError, setActionError] = useState('')

  const isOnline = profile?.is_online ?? false
  const canWork = profile?.status === 'ACTIVE'

  const { data: activeJob, isLoading: activeLoading } = useQuery({
    queryKey: ['courier-job-active'],
    queryFn: fetchActiveJob,
    enabled: ready,
    refetchInterval: 15_000,
  })

  const { data: available = [], isLoading: availableLoading } = useQuery({
    queryKey: ['courier-jobs-available'],
    queryFn: fetchAvailableJobs,
    enabled: ready && canWork && isOnline,
    refetchInterval: 8_000,
  })

  const rejectMutation = useMutation({
    mutationFn: rejectCourierJob,
    onSuccess: () => invalidate(),
  })

  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ['courier-jobs-history'],
    queryFn: fetchJobHistory,
    enabled: ready && tab === 'history',
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['courier-job-active'] })
    queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
    queryClient.invalidateQueries({ queryKey: ['courier-jobs-history'] })
  }, [queryClient])

  const acceptMutation = useMutation({
    mutationFn: async (jobId: string) => {
      setActionError('')
      const result = await acceptCourierJob(jobId)
      if (result.error) throw new Error(result.error)
      return result.job
    },
    onSuccess: () => {
      notify.success('Mission acceptée')
      setTab('active')
      invalidate()
    },
    onError: (e: Error) => setActionError(e.message),
  })

  const advanceMutation = useMutation({
    mutationFn: async ({
      jobId,
      status,
      proofOtp,
    }: { jobId: string; status: DeliveryJobStatus; proofOtp?: string }) => {
      setActionError('')
      const result = await advanceCourierJob(jobId, status, proofOtp)
      if (result.error) throw new Error(result.error)
      return result.job
    },
    onSuccess: (job) => {
      if (job?.status === 'DELIVERED') {
        notify.success('Livraison terminée')
        queryClient.invalidateQueries({ queryKey: ['courier-wallet'] })
        setTab('history')
      } else {
        notify.success('Statut mis à jour')
      }
      invalidate()
    },
  })

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  const tabs: Array<{ id: Tab; label: string; badge?: number }> = [
    { id: 'active', label: 'En cours', badge: activeJob ? 1 : 0 },
    { id: 'available', label: 'Disponibles', badge: available.length || undefined },
    { id: 'history', label: 'Historique' },
  ]

  return (
    <CourierShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Missions</h1>
          <p className="text-slate-500 mt-1">Courses disponibles, mission active et historique</p>
        </div>

        {!canWork && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-sm text-amber-900">
            Votre profil doit être validé pour recevoir des missions.
          </div>
        )}

        {canWork && !isOnline && tab === 'available' && (
          <div className="bg-slate-900 text-white rounded-2xl p-4 text-sm flex items-center gap-2">
            <Radio size={16} className="text-emerald-400" />
            Passez en ligne depuis le dashboard pour voir les missions disponibles.
          </div>
        )}

        {canWork && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">Notifications missions</p>
            <WebPushToggle compact />
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                tab === t.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.id ? 'bg-emerald-500 text-slate-900' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {actionError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{actionError}</p>
        )}

        {tab === 'active' && (
          activeLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" size={28} />
            </div>
          ) : activeJob ? (
            <CourierJobCard
              job={activeJob}
              mode="active"
              loading={advanceMutation.isPending}
              onAdvance={(jobId, status, proofOtp) =>
                advanceMutation.mutateAsync({ jobId, status, proofOtp })
              }
              onProofPhoto={async (jobId, file) => {
                const { proof_photo_url, error } = await uploadCourierProofPhoto(jobId, file)
                if (error) {
                  notify.error(error)
                  return
                }
                if (proof_photo_url) {
                  notify.success('Photo enregistrée')
                  invalidate()
                }
              }}
            />
          ) : (
            <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center">
              <Package className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="font-bold text-slate-900">Aucune mission en cours</p>
              <p className="text-sm text-slate-500 mt-1">
                {isOnline ? 'Consultez l\'onglet Disponibles pour accepter une course.' : 'Passez en ligne pour recevoir des offres.'}
              </p>
            </div>
          )
        )}

        {tab === 'available' && (
          availableLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" size={28} />
            </div>
          ) : available.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center">
              <p className="font-bold text-slate-900">Aucune mission disponible</p>
              <p className="text-sm text-slate-500 mt-1">
                Les courses apparaissent ici quand elles correspondent à vos zones.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[...available]
                .sort((a, b) => Number(b.offered_to_me) - Number(a.offered_to_me))
                .map(job => (
                <CourierJobCard
                  key={job.id}
                  job={job}
                  mode="available"
                  loading={acceptMutation.isPending || rejectMutation.isPending}
                  onAccept={async id => { await acceptMutation.mutateAsync(id) }}
                  onReject={async id => { await rejectMutation.mutateAsync(id) }}
                />
              ))}
            </div>
          )
        )}

        {tab === 'history' && (
          historyLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-slate-300" size={28} />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center text-sm text-slate-500">
              Aucune mission terminée pour le moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {history.map(job => (
                <CourierJobCard key={job.id} job={job} mode="history" />
              ))}
            </div>
          )
        )}
      </div>
    </CourierShell>
  )
}
