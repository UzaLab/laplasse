'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Loader2, Wallet } from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  downloadPartnerFinancesCsv,
  fetchPartnerFinances,
} from '@/lib/deliveryStakeholdersApi'
import { formatFcfa } from '@/lib/courierJobLabels'
import { notify } from '@/lib/notify'

function currentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const PAYOUT_STATUS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  PAID: 'Payé',
  FAILED: 'Échec',
}

function monthOptions(count = 12) {
  const opts: { value: string; label: string }[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const value = `${y}-${String(m).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    opts.push({ value, label })
    d.setMonth(d.getMonth() - 1)
  }
  return opts
}

export default function LogisticsFinancesPage() {
  const { ready, partner } = useLogisticsSession()
  const [month, setMonth] = useState(currentMonth)
  const [exporting, setExporting] = useState(false)
  const months = useMemo(() => monthOptions(12), [])

  const verified = partner?.verification === 'VERIFIED'

  const { data, isLoading } = useQuery({
    queryKey: ['logistics-finances', month],
    queryFn: () => fetchPartnerFinances(month),
    enabled: ready && verified,
  })

  const monthLabel = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    if (!y || !m) return month
    return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  }, [month])

  const handleExport = async () => {
    setExporting(true)
    const { ok, error } = await downloadPartnerFinancesCsv(month)
    setExporting(false)
    if (!ok) notify.error(error ?? 'Export impossible')
    else notify.success('Export CSV téléchargé')
  }

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
          Finances disponibles après validation de votre structure.
        </div>
      </LogisticsShell>
    )
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Finances</h1>
            <p className="text-slate-500 mt-1">Commissions, répartition livraison et versements — {monthLabel}.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-white capitalize"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={exporting || isLoading}
              onClick={() => void handleExport()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export CSV
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-slate-300" size={28} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Courses livrées', value: String(data.summary.total_jobs) },
                { label: 'Frais livraison', value: formatFcfa(data.summary.delivery_fees_total) },
                { label: 'Votre commission', value: formatFcfa(data.summary.partner_commission), accent: 'text-emerald-700' },
                { label: 'Versements livreurs', value: formatFcfa(data.summary.courier_payouts) },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                  <p className={`text-xl font-extrabold mt-1 ${item.accent ?? 'text-slate-900'}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[28px] border border-slate-100 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2 flex items-center gap-2">
                <Wallet size={14} /> Taux commission partenaire
              </p>
              <p className="text-2xl font-black text-slate-900">
                {Math.round(data.summary.commission_rate * 100)}%
                <span className="text-sm font-semibold text-slate-500 ml-2">
                  · part plateforme {formatFcfa(data.summary.platform_share)}
                </span>
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="bg-white rounded-[28px] border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Par commerce</h2>
                {data.by_shop.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune livraison ce mois.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.by_shop.map(row => (
                      <li key={row.shop_id} className="flex justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{row.shop_name}</p>
                          <p className="text-xs text-slate-500">{row.jobs} course(s)</p>
                        </div>
                        <p className="font-extrabold text-emerald-700 shrink-0">{formatFcfa(row.commission)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="bg-white rounded-[28px] border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Par livreur</h2>
                {data.by_courier.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucun versement livreur ce mois.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.by_courier.map(row => (
                      <li key={row.courier_id} className="flex justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.jobs} course(s)</p>
                        </div>
                        <p className="font-extrabold text-slate-900 shrink-0">{formatFcfa(row.earnings)}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            {data.payouts.length > 0 && (
              <section className="bg-white rounded-[28px] border border-slate-100 p-5">
                <h2 className="font-bold text-slate-900 mb-4">Versements LaPlasse → partenaire</h2>
                <ul className="space-y-2">
                  {data.payouts.map(p => (
                    <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border-b border-slate-50 pb-2 last:border-0">
                      <span className="text-slate-600">
                        {new Date(p.period_start).toLocaleDateString('fr-FR')} — {new Date(p.period_end).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="font-bold text-slate-900">{formatFcfa(p.amount)}</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {PAYOUT_STATUS[p.status] ?? p.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">Journal des courses</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[10px] font-bold uppercase tracking-wide text-slate-400 border-b border-slate-100">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Commerce</th>
                      <th className="px-5 py-3">Livreur</th>
                      <th className="px-5 py-3 text-right">Frais</th>
                      <th className="px-5 py-3 text-right">Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ledger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-slate-500">Aucune course livrée.</td>
                      </tr>
                    ) : (
                      data.ledger.map(row => (
                        <tr key={row.job_id} className="border-b border-slate-50 last:border-0">
                          <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                            {row.delivered_at
                              ? new Date(row.delivered_at).toLocaleDateString('fr-FR')
                              : '—'}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-900">{row.shop_name}</td>
                          <td className="px-5 py-3 text-slate-600">{row.courier_name ?? '—'}</td>
                          <td className="px-5 py-3 text-right">{formatFcfa(row.delivery_fee)}</td>
                          <td className="px-5 py-3 text-right font-bold text-emerald-700">{formatFcfa(row.partner_commission)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </LogisticsShell>
  )
}
