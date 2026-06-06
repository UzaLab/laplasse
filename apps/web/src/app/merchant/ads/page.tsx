'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/authStore'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { getHighestPlan, PLAN_LIMITS } from '@/lib/planLimits'

interface Campaign {
  id: string
  placement: string
  status: string
  amount: number
  starts_at: string
  ends_at: string
}

export default function MerchantAdsPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId, user } = useAuthStore()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pricing, setPricing] = useState<Record<string, Record<number, number>>>({})
  const [placement, setPlacement] = useState('SEARCH')
  const [duration, setDuration] = useState(7)
  const [pendingPayment, setPendingPayment] = useState<{ paymentId: string; reference: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const plan = getHighestPlan(user?.merchants ?? [])
  const canAds = PLAN_LIMITS[plan]?.adsSelfService ?? false

  const load = async () => {
    setLoading(true)
    const [cRes, pRes] = await Promise.all([
      authApiFetch(`/ads/campaigns?merchantId=${activeMerchantId ?? ''}`),
      authApiFetch('/ads/pricing'),
    ])
    if (cRes.ok) setCampaigns(await cRes.json())
    if (pRes.ok) {
      const p = await pRes.json()
      setPricing(p.prices ?? {})
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/merchant/ads'); return }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const launch = async () => {
    const res = await authApiFetch(`/ads/campaigns?merchantId=${activeMerchantId ?? ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placement, duration_days: duration }),
    })
    const data = await res.json()
    if (res.ok) {
      setPendingPayment({ paymentId: data.payment.id, reference: data.payment.reference })
    }
  }

  const confirm = async (result: 'success' | 'failure') => {
    if (!pendingPayment) return
    await authApiFetch('/ads/campaigns/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: pendingPayment.paymentId, simulateResult: result }),
    })
    setPendingPayment(null)
    load()
  }

  const price = pricing[placement]?.[duration]

  return (
    <MerchantShell>
      <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-2">
        <Megaphone size={22} className="text-amber-500" /> Visibilité sponsorisée
      </h1>
      <p className="text-sm text-slate-500 mb-6">Boostez votre fiche en recherche (self-service, plan Growth+)</p>

      {!canAds ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          Passez au plan Growth pour lancer des campagnes publicitaires.
        </div>
      ) : pendingPayment ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <p className="font-bold">Simulateur paiement campagne — {pendingPayment.reference}</p>
          <div className="flex gap-3">
            <button onClick={() => confirm('success')} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCircle2 size={16} /> Succès
            </button>
            <button onClick={() => confirm('failure')} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              <XCircle size={16} /> Échec
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 space-y-3">
          <select value={placement} onChange={e => setPlacement(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm">
            <option value="SEARCH">Top recherche</option>
            <option value="FEATURED">Page d&apos;accueil</option>
            <option value="CATEGORY">Catégorie</option>
          </select>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm">
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
            <option value={30}>30 jours</option>
          </select>
          {price && <p className="text-sm font-bold text-slate-700">{price.toLocaleString('fr-FR')} FCFA</p>}
          <button onClick={launch} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">Lancer la campagne</button>
        </div>
      )}

      {loading ? <Loader2 className="animate-spin mx-auto text-slate-400" /> : (
        <div className="space-y-2">
          {campaigns.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 text-sm">
              <span className="font-bold">{c.placement}</span> — {c.status} — {c.amount.toLocaleString('fr-FR')} F
            </div>
          ))}
        </div>
      )}
    </MerchantShell>
  )
}
