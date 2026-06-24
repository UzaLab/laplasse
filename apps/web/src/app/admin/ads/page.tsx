'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Megaphone, Ban } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { notify } from '@/lib/notify'
import { AdminPageContainer, AdminPageHeader } from '@/features/admin/components/AdminPageContainer'

type AdPlacement =
  | 'SEARCH'
  | 'FEATURED'
  | 'CATEGORY'
  | 'MARKETPLACE'
  | 'MARKETPLACE_FEATURED_PRODUCTS'

type AdCampaignStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'WAITLISTED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'

interface PlacementAvailability {
  placement: AdPlacement
  capacity: number
  active: number
  waitlist: number
  available_slots: number
  is_saturated: boolean
}

interface AdCampaign {
  id: string
  placement: AdPlacement
  status: AdCampaignStatus
  target_type: string
  amount: number
  duration_days: number
  starts_at: string
  ends_at: string
  impressions: number
  clicks: number
  waitlist_position: number | null
  created_at: string
  owner: { email: string; full_name: string | null }
  merchant: { business_name: string; slug: string } | null
  shop: { name: string; slug: string } | null
  product: { name: string; slug: string } | null
}

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  SEARCH: 'Recherche',
  FEATURED: 'Mise en avant',
  CATEGORY: 'Catégorie',
  MARKETPLACE: 'Marketplace',
  MARKETPLACE_FEATURED_PRODUCTS: 'Produits vedettes',
}

const STATUS_LABELS: Record<AdCampaignStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_PAYMENT: 'Paiement en attente',
  WAITLISTED: 'Liste d\'attente',
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  CANCELLED: 'Annulée',
}

const STATUS_COLORS: Record<AdCampaignStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_PAYMENT: 'bg-amber-100 text-amber-800',
  WAITLISTED: 'bg-sky-100 text-sky-800',
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  EXPIRED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function AdminAdsPage() {
  const { ready } = useAdminSession()
  const [availability, setAvailability] = useState<Record<AdPlacement, PlacementAvailability> | null>(null)
  const [statusCounts, setStatusCounts] = useState<Array<{ status: AdCampaignStatus; count: number }>>([])
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [statusFilter, setStatusFilter] = useState<AdCampaignStatus | ''>('ACTIVE')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const loadOverview = useCallback(async () => {
    const data = await adminFetch<{
      placement_availability: Record<AdPlacement, PlacementAvailability>
      campaigns_by_status: Array<{ status: AdCampaignStatus; count: number }>
    }>('/admin/ads/overview')
    if (data) {
      setAvailability(data.placement_availability)
      setStatusCounts(data.campaigns_by_status)
    }
  }, [])

  const loadCampaigns = useCallback(async () => {
    const qs = statusFilter ? `?status=${statusFilter}&limit=50` : '?limit=50'
    const data = await adminFetch<AdCampaign[]>(`/admin/ads/campaigns${qs}`)
    setCampaigns(data ?? [])
  }, [statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    await Promise.all([loadOverview(), loadCampaigns()])
    setLoading(false)
  }, [loadOverview, loadCampaigns])

  useEffect(() => {
    if (!ready) return
    void load()
  }, [ready, load])

  const cancelCampaign = async (id: string) => {
    if (!confirm('Annuler cette campagne ?')) return
    setCancelling(id)
    const res = await adminFetch(`/admin/ads/campaigns/${id}/cancel`, { method: 'PATCH' })
    setCancelling(null)
    if (!res) {
      notify.error('Annulation impossible')
      return
    }
    notify.success('Campagne annulée')
    void load()
  }

  const targetLabel = (c: AdCampaign) =>
    c.product?.name ?? c.shop?.name ?? c.merchant?.business_name ?? c.target_type

  return (
    <AdminPageContainer>
      <AdminPageHeader
        title="Campagnes publicitaires"
        description="Supervision des emplacements et des campagnes actives."
        icon={<Megaphone size={22} className="text-violet-600" />}
      />

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : (
        <>
          {availability && (
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.values(availability) as PlacementAvailability[]).map(p => (
                <div
                  key={p.placement}
                  className={`bg-white border rounded-2xl p-4 ${
                    p.is_saturated ? 'border-amber-200' : 'border-slate-100'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    {PLACEMENT_LABELS[p.placement]}
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {p.active}/{p.capacity}
                  </p>
                  <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.is_saturated ? 'bg-amber-500' : 'bg-violet-500'}`}
                      style={{ width: `${Math.min(100, (p.active / Math.max(p.capacity, 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {p.available_slots} place{p.available_slots !== 1 ? 's' : ''} libre{p.available_slots !== 1 ? 's' : ''}
                    {p.waitlist > 0 && ` · ${p.waitlist} en attente`}
                  </p>
                </div>
              ))}
            </section>
          )}

          {statusCounts.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  statusFilter === '' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                Toutes
              </button>
              {statusCounts.map(s => (
                <button
                  key={s.status}
                  type="button"
                  onClick={() => setStatusFilter(s.status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    statusFilter === s.status ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {STATUS_LABELS[s.status]} ({s.count})
                </button>
              ))}
            </div>
          )}

          <section className="space-y-2">
            {campaigns.length === 0 ? (
              <p className="text-sm text-slate-400">Aucune campagne pour ce filtre.</p>
            ) : (
              campaigns.map(c => (
                <div
                  key={c.id}
                  className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900 truncate">{targetLabel(c)}</p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {PLACEMENT_LABELS[c.placement]} · {c.amount.toLocaleString('fr-FR')} FCFA · {c.duration_days}j
                      {c.waitlist_position != null && ` · #${c.waitlist_position} attente`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {c.owner.full_name ?? c.owner.email} · {c.impressions} vues · {c.clicks} clics
                    </p>
                  </div>
                  {['ACTIVE', 'WAITLISTED', 'PENDING_PAYMENT'].includes(c.status) && (
                    <button
                      type="button"
                      disabled={cancelling === c.id}
                      onClick={() => void cancelCampaign(c.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 border border-red-100 hover:bg-red-50 disabled:opacity-50 shrink-0"
                    >
                      {cancelling === c.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Ban size={14} />
                      )}
                      Annuler
                    </button>
                  )}
                </div>
              ))
            )}
          </section>
        </>
      )}
    </AdminPageContainer>
  )
}
