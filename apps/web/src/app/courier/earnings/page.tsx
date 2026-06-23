'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, Wallet } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'
import {
  fetchCourierWallet,
  fetchCourierWalletEntries,
} from '@/lib/courierJobsApi'
import { formatFcfa } from '@/lib/courierJobLabels'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

export default function CourierEarningsPage() {
  const { ready, profile } = useCourierSession()
  const [page, setPage] = useState(1)

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['courier-wallet'],
    queryFn: fetchCourierWallet,
    enabled: ready,
  })

  const { data: entriesPage, isLoading: entriesLoading } = useQuery({
    queryKey: ['courier-wallet-entries', page],
    queryFn: () => fetchCourierWalletEntries(page, PAGE_SIZE),
    enabled: ready,
  })

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  const totalPages = entriesPage?.totalPages ?? 1

  return (
    <CourierShell>
      <div className="w-full min-w-0 space-y-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Mes gains</h1>
          <p className="text-slate-500 mt-1">
            Solde et historique des rémunérations livraison (75 % des frais de livraison).
          </p>
        </div>

        {summaryLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 rounded-[28px] bg-slate-900 text-white p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
                <div className="relative">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Solde disponible</p>
                  <p className="text-3xl lg:text-4xl font-black mt-2 text-emerald-400">{formatFcfa(summary.balance)}</p>
                  <p className="text-xs text-white/60 mt-2 flex items-center gap-1.5">
                    <Wallet size={14} /> Payout manuel admin (v1)
                  </p>
                </div>
              </div>
              <StatCard label="Aujourd'hui" value={formatFcfa(summary.today)} />
              <StatCard label="Cette semaine" value={formatFcfa(summary.week)} />
              <StatCard label="Ce mois" value={formatFcfa(summary.month)} highlight />
              <StatCard label="Total cumulé" value={formatFcfa(summary.total_earned)} />
            </div>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-emerald-600" />
                <h2 className="font-extrabold text-slate-900">Historique des gains</h2>
              </div>

              {entriesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                </div>
              ) : !entriesPage?.items.length ? (
                <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center text-sm text-slate-500">
                  Aucun gain enregistré. Terminez une livraison pour créditer votre wallet.
                </div>
              ) : (
                <>
                  <ul className="bg-white rounded-[28px] border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                    {entriesPage.items.map(entry => (
                      <li key={entry.id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {entry.label ?? 'Gain livraison'}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(entry.created_at).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="text-sm font-black text-emerald-700 shrink-0">
                          +{formatFcfa(entry.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between gap-4">
                      <p className="text-sm text-slate-500">
                        {entriesPage.total} entrée{entriesPage.total > 1 ? 's' : ''} · page {page}/{totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => setPage(p => p - 1)}
                          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-40"
                        >
                          <ChevronLeft size={18} />
                        </button>
                        <button
                          type="button"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                          className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-40"
                        >
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <div className="bg-white rounded-[28px] border border-slate-100 p-8 text-center text-sm text-slate-500">
            Impossible de charger le wallet.
          </div>
        )}
      </div>
    </CourierShell>
  )
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'rounded-2xl border px-4 py-4',
      highlight ? 'bg-emerald-50/80 border-emerald-100' : 'bg-white border-slate-100',
    )}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={cn(
        'text-xl font-black mt-1',
        highlight ? 'text-emerald-700' : 'text-slate-900',
      )}>
        {value}
      </p>
    </div>
  )
}
