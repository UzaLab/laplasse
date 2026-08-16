'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Package } from 'lucide-react'
import {
  acceptCourierJob,
  fetchAvailableJobs,
  rejectCourierJob,
} from '@/lib/courierJobsApi'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import { formatFcfa } from '@/lib/courierJobLabels'

export function CourierOfferBanner() {
  const { ready, profile } = useCourierSession()
  const queryClient = useQueryClient()
  const isOnline = profile?.is_online ?? false
  const canWork = profile?.status === 'ACTIVE'
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const { data: jobs = [] } = useQuery({
    queryKey: ['courier-jobs-available'],
    queryFn: fetchAvailableJobs,
    enabled: ready && canWork && isOnline,
    refetchInterval: 3_000,
  })

  const urgentJob = useMemo(
    () => jobs.find(j => j.offered_to_me && (j.offer_seconds_left ?? 0) > 0) ?? null,
    [jobs],
  )

  const visible = !!urgentJob && urgentJob.id !== dismissedId

  useEffect(() => {
    if (!visible || !urgentJob) return
    setSecondsLeft(urgentJob.offer_seconds_left ?? 30)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([400, 200, 400, 200, 400])
    }
  }, [visible, urgentJob?.id, urgentJob?.offer_seconds_left])

  useEffect(() => {
    if (!visible || secondsLeft == null || secondsLeft <= 0) return
    const t = window.setInterval(() => {
      setSecondsLeft(prev => (prev != null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [visible, secondsLeft])

  const acceptMutation = useMutation({
    mutationFn: acceptCourierJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
      void queryClient.invalidateQueries({ queryKey: ['courier-job-active'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: rejectCourierJob,
    onSuccess: () => {
      if (urgentJob) setDismissedId(urgentJob.id)
      void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
    },
  })

  if (!visible || !urgentJob) return null

  const busy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[80] px-4 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto rounded-2xl border-2 border-emerald-500 bg-slate-900 text-white shadow-2xl p-5 space-y-4 animate-in slide-in-from-bottom-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
            <Package size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-300">Nouvelle course</p>
            <p className="font-extrabold text-lg leading-tight">{urgentJob.order.shop_name}</p>
            <p className="text-sm text-slate-300 mt-0.5">
              {formatFcfa(urgentJob.order.delivery_fee)} · {urgentJob.order.delivery_district ?? 'Livraison'}
            </p>
          </div>
          <div className="text-center shrink-0">
            <p className="text-3xl font-extrabold text-red-400 leading-none">{secondsLeft ?? 0}</p>
            <p className="text-[10px] text-slate-400 font-bold">sec</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void rejectMutation.mutateAsync(urgentJob.id)}
            className="flex-1 min-h-[44px] rounded-xl border border-slate-600 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Refuser
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void acceptMutation.mutateAsync(urgentJob.id)}
            className="flex-1 min-h-[44px] rounded-xl bg-emerald-500 text-slate-900 text-sm font-extrabold hover:bg-emerald-400 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            Accepter
          </button>
        </div>
        <Link
          href="/courier/missions"
          className="block text-center text-xs font-bold text-emerald-300 hover:text-emerald-200"
          style={{ textDecoration: 'none' }}
        >
          Voir le détail →
        </Link>
      </div>
    </div>
  )
}
