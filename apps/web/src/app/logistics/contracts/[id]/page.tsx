'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Clock, Loader2, Pause, Play, Save, TrendingUp, Truck, Zap,
} from 'lucide-react'
import { LogisticsShell } from '@/features/logistics/components/LogisticsShell'
import { useLogisticsSession } from '@/features/logistics/hooks/useLogisticsSession'
import {
  fetchPartnerContract,
  updatePartnerContract,
  type PartnerContractDetail,
} from '@/lib/deliveryStakeholdersApi'
import { notify } from '@/lib/notify'

const STATUS_LABELS: Record<string, string> = {
  PENDING_PARTNER: 'À valider',
  PENDING_MERCHANT: 'En attente commerce',
  ACTIVE: 'Actif',
  PAUSED: 'En pause',
  TERMINATED: 'Terminé',
}

function formatXof(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function LogisticsContractDetailPage() {
  const params = useParams()
  const contractId = params.id as string
  const { ready } = useLogisticsSession()
  const [contract, setContract] = useState<PartnerContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    sla_eta_max_minutes: 45,
    fee_override: '' as string,
    auto_dispatch: true,
  })

  const load = async () => {
    setLoading(true)
    const data = await fetchPartnerContract(contractId)
    setContract(data)
    if (data) {
      setForm({
        sla_eta_max_minutes: data.sla_eta_max_minutes ?? 45,
        fee_override: data.fee_override != null ? String(data.fee_override) : '',
        auto_dispatch: data.auto_dispatch,
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!ready || !contractId) return
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, contractId])

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (!contract) {
    return (
      <LogisticsShell>
        <div className="space-y-4">
          <Link href="/logistics/contracts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} /> Retour aux contrats
          </Link>
          <p className="text-slate-500">Contrat introuvable.</p>
        </div>
      </LogisticsShell>
    )
  }

  const editable = ['ACTIVE', 'PAUSED', 'PENDING_PARTNER', 'PENDING_MERCHANT'].includes(contract.status)

  const save = async () => {
    setSaving(true)
    const fee = form.fee_override.trim()
    const { contract: updated, error } = await updatePartnerContract(contractId, {
      sla_eta_max_minutes: form.sla_eta_max_minutes,
      fee_override: fee === '' ? null : Number(fee),
      auto_dispatch: form.auto_dispatch,
    })
    setSaving(false)
    if (error) {
      notify.error(error)
      return
    }
    if (updated) setContract(updated)
    notify.success('Contrat mis à jour')
  }

  const togglePause = async () => {
    const pause = contract.status === 'ACTIVE'
    setSaving(true)
    const { contract: updated, error } = await updatePartnerContract(contractId, { pause })
    setSaving(false)
    if (error) {
      notify.error(error)
      return
    }
    if (updated) setContract(updated)
    notify.success(pause ? 'Contrat mis en pause' : 'Contrat réactivé')
  }

  return (
    <LogisticsShell>
      <div className="w-full min-w-0 space-y-6">
        <div>
          <Link
            href="/logistics/contracts"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-4"
            style={{ textDecoration: 'none' }}
          >
            <ArrowLeft size={16} /> Contrats
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {contract.shop.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={contract.shop.logo} alt="" className="w-14 h-14 rounded-2xl object-cover" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-slate-900 text-indigo-400 flex items-center justify-center text-xl font-black">
                  {contract.shop.name.slice(0, 1)}
                </div>
              )}
              <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {contract.shop.name}
                </h1>
                <p className="text-slate-500 mt-0.5">
                  {contract.shop.city} · {STATUS_LABELS[contract.status] ?? contract.status}
                </p>
              </div>
            </div>
            {(contract.status === 'ACTIVE' || contract.status === 'PAUSED') && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void togglePause()}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold ${
                  contract.status === 'ACTIVE'
                    ? 'bg-amber-50 text-amber-800 border border-amber-100'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {contract.status === 'ACTIVE' ? <Pause size={16} /> : <Play size={16} />}
                {contract.status === 'ACTIVE' ? 'Mettre en pause' : 'Réactiver'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Courses (30j)', value: String(contract.stats.jobs_30d), icon: Truck },
            { label: 'CA livraison (30j)', value: formatXof(contract.stats.revenue_30d), icon: TrendingUp },
            {
              label: 'Taux SLA',
              value: contract.stats.sla_rate != null ? `${contract.stats.sla_rate} %` : '—',
              icon: Clock,
            },
            { label: 'Dernière livraison', value: formatDate(contract.stats.last_delivery_at), icon: Zap },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Icon size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
              </div>
              <p className="text-lg font-extrabold text-slate-900">{value}</p>
            </div>
          ))}
        </div>

        {editable && (
          <section className="bg-white rounded-2xl border border-slate-100 p-5 lg:p-6 space-y-5">
            <h2 className="font-bold text-slate-900">Conditions négociées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">SLA max (minutes)</span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  value={form.sla_eta_max_minutes}
                  onChange={e => setForm(f => ({ ...f, sla_eta_max_minutes: Number(e.target.value) }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700">Tarif override (FCFA, optionnel)</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Tarif plateforme par défaut"
                  value={form.fee_override}
                  onChange={e => setForm(f => ({ ...f, fee_override: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                />
              </label>
            </div>
            <label className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-900">Auto-dispatch pour ce contrat</p>
                <p className="text-sm text-slate-500">Assigner automatiquement les courses de cette boutique.</p>
              </div>
              <input
                type="checkbox"
                checked={form.auto_dispatch}
                onChange={e => setForm(f => ({ ...f, auto_dispatch: e.target.checked }))}
                className="w-5 h-5 rounded accent-indigo-600"
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </section>
        )}
      </div>
    </LogisticsShell>
  )
}
