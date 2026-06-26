'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Lightbulb,
  Loader2,
  Megaphone,
  Package,
  Sparkles,
  Store,
  XCircle,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { getEffectivePlanLimits } from '@/lib/planLimits'
import { notify } from '@/lib/notify'
import {
  ADS_CONTEXT_DESCRIPTIONS,
  getAdsApiScope,
  getAllowedTargets,
  getContextSubjectLabel,
  resolveAdsContext,
  scopeEligibilityProducts,
  scopeEligibilityShops,
  TARGET_HINTS,
  type AdsContextKind,
} from '@/lib/adsContext'
import {
  cancelAdWaitlist,
  confirmAdPayment,
  createAdCampaign,
  fetchAdCampaigns,
  fetchAdCampaignStats,
  fetchAdEligibility,
  fetchAdPricing,
  PLACEMENT_LABELS,
  TARGET_LABELS,
  type AdCampaign,
  type AdCampaignStats,
  type AdEligibility,
  type AdPlacement,
  type AdPricing,
  type AdSuggestion,
  type AdTargetType,
  type PlacementAvailability,
} from '@/lib/adsApi'
import { cn } from '@/lib/utils'

const STEPS = ['Objectif', 'Emplacement', 'Durée', 'Paiement'] as const

const TARGET_ICONS: Record<AdTargetType, typeof Store> = {
  MERCHANT: Sparkles,
  SHOP: Store,
  PRODUCT: Package,
}

interface MerchantAdsPanelProps {
  /** Force un contexte (sinon déduit de la route + auth) */
  context?: AdsContextKind
}

function formatFcfa(amount: number) {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

function campaignLabel(c: AdCampaign) {
  if (c.product) return c.product.name
  if (c.shop) return c.shop.name
  if (c.merchant) return c.merchant.business_name
  return 'Campagne'
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    PENDING_PAYMENT: 'bg-amber-50 text-amber-700',
    WAITLISTED: 'bg-indigo-50 text-indigo-700',
    EXPIRED: 'bg-slate-100 text-slate-500',
    CANCELLED: 'bg-red-50 text-red-600',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'En attente',
    PENDING_PAYMENT: 'Paiement en attente',
    WAITLISTED: 'File d\'attente',
    EXPIRED: 'Expirée',
    CANCELLED: 'Annulée',
  }
  return (
    <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg', styles[status] ?? 'bg-slate-100 text-slate-600')}>
      {labels[status] ?? status}
    </span>
  )
}

function filterCampaignsForContext(
  campaigns: AdCampaign[],
  context: AdsContextKind,
  scopedShopIds: Set<string>,
  merchantId: string | null | undefined,
): AdCampaign[] {
  return campaigns.filter(c => {
    if (context === 'merchant_only') {
      return c.target_type === 'MERCHANT'
    }
    if (context === 'merchant_retail') {
      if (c.target_type === 'MERCHANT') return c.merchant?.id === merchantId
      if (c.target_type === 'SHOP') return c.shop?.id ? scopedShopIds.has(c.shop.id) : false
      if (c.target_type === 'PRODUCT') return c.shop?.id ? scopedShopIds.has(c.shop.id) : false
      return false
    }
    // linked_shop + standalone_shop
    if (c.target_type === 'MERCHANT') return false
    if (c.target_type === 'SHOP') return c.shop?.id ? scopedShopIds.has(c.shop.id) : false
    if (c.target_type === 'PRODUCT') return c.shop?.id ? scopedShopIds.has(c.shop.id) : false
    return false
  })
}

export function MerchantAdsPanel({ context: contextOverride }: MerchantAdsPanelProps) {
  const pathname = usePathname()
  const { activeMerchantId, activeShopId, user } = useAuthStore()

  const context = useMemo(
    () => contextOverride ?? resolveAdsContext(pathname, user?.shops, activeMerchantId),
    [contextOverride, pathname, user?.shops, activeMerchantId],
  )

  const apiScope = useMemo(
    () => getAdsApiScope(context, activeMerchantId, activeShopId, user?.shops),
    [context, activeMerchantId, activeShopId, user?.shops],
  )

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eligibility, setEligibility] = useState<AdEligibility | null>(null)
  const [pricing, setPricing] = useState<AdPricing | null>(null)
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([])
  const [campaignStats, setCampaignStats] = useState<AdCampaignStats | null>(null)

  const scopedShops = useMemo(
    () => scopeEligibilityShops(context, eligibility?.shops ?? [], activeMerchantId, activeShopId),
    [context, eligibility?.shops, activeMerchantId, activeShopId],
  )

  const scopedProducts = useMemo(
    () => scopeEligibilityProducts(scopedShops, eligibility?.products ?? []),
    [scopedShops, eligibility?.products],
  )

  const scopedShopIds = useMemo(() => new Set(scopedShops.map(s => s.id)), [scopedShops])

  const availableTargets = useMemo(
    () => getAllowedTargets(context, eligibility, scopedShops, scopedProducts),
    [context, eligibility, scopedShops, scopedProducts],
  )

  const subjectLabel = useMemo(
    () => getContextSubjectLabel(context, eligibility, scopedShops),
    [context, eligibility, scopedShops],
  )

  const [targetType, setTargetType] = useState<AdTargetType>('MERCHANT')
  const [targetId, setTargetId] = useState<string>('')
  const [placement, setPlacement] = useState<AdPlacement>('SEARCH')
  const [duration, setDuration] = useState(7)
  const [pendingPayment, setPendingPayment] = useState<{ paymentId: string; reference: string } | null>(null)

  const placementsForTarget = useMemo(() => {
    return pricing?.placements_by_target?.[targetType] ?? []
  }, [pricing, targetType])

  const price = pricing?.prices?.[placement]?.[duration]

  const placementAvailability = useMemo((): PlacementAvailability | null => {
    return pricing?.placement_availability?.[placement] ?? eligibility?.placement_availability?.[placement] ?? null
  }, [pricing, eligibility, placement])

  const isPlacementSaturated = placementAvailability?.is_saturated ?? false

  const filteredCampaigns = useMemo(
    () => filterCampaignsForContext(campaigns, context, scopedShopIds, activeMerchantId),
    [campaigns, context, scopedShopIds, activeMerchantId],
  )

  const canAds = useMemo(() => {
    if (context === 'standalone_shop') {
      return scopedShops.some(s => s.eligible) || getEffectivePlanLimits().adsSelfService
    }
    return getEffectivePlanLimits().adsSelfService
  }, [context, scopedShops])

  const suggestions = useMemo(() => {
    const raw = eligibility?.suggestions ?? []
    return raw.filter(s => availableTargets.includes(s.target_type))
  }, [eligibility?.suggestions, availableTargets])

  const stats = useMemo(() => {
    if (campaignStats?.totals) {
      return {
        active: campaignStats.totals.active,
        waitlisted: campaignStats.totals.waitlisted,
        impressions: campaignStats.totals.impressions,
        clicks: campaignStats.totals.clicks,
        ctr: campaignStats.totals.ctr,
        spent: campaignStats.totals.spent,
        campaigns: campaignStats.totals.campaigns,
      }
    }
    const active = filteredCampaigns.filter(c => c.status === 'ACTIVE').length
    const waitlisted = filteredCampaigns.filter(c => c.status === 'WAITLISTED').length
    const impressions = filteredCampaigns.reduce((sum, c) => sum + c.impressions, 0)
    const clicks = filteredCampaigns.reduce((sum, c) => sum + c.clicks, 0)
    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(1)) : null
    const spent = filteredCampaigns
      .filter(c => ['ACTIVE', 'EXPIRED', 'PENDING_PAYMENT'].includes(c.status))
      .reduce((sum, c) => sum + c.amount, 0)
    return {
      active,
      waitlisted,
      impressions,
      clicks,
      ctr,
      spent,
      campaigns: filteredCampaigns.length,
    }
  }, [campaignStats, filteredCampaigns])

  const applySuggestion = (s: AdSuggestion) => {
    setTargetType(s.target_type)
    setTargetId(s.target_id)
    setPlacement(s.placement)
    setStep(1)
  }

  const load = useCallback(async () => {
    setLoading(true)
    const { merchantId, shopId } = apiScope
    const [elig, priceData, campaignRows, statsData] = await Promise.all([
      fetchAdEligibility(merchantId, shopId),
      fetchAdPricing(),
      fetchAdCampaigns(merchantId, shopId),
      fetchAdCampaignStats(merchantId, shopId),
    ])
    setEligibility(elig)
    setPricing(priceData)
    setCampaigns(campaignRows)
    setCampaignStats(statsData)
    setLoading(false)
  }, [apiScope])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!availableTargets.includes(targetType) && availableTargets.length) {
      setTargetType(availableTargets[0])
    }
  }, [availableTargets, targetType])

  useEffect(() => {
    if (placementsForTarget.length && !placementsForTarget.includes(placement)) {
      setPlacement(placementsForTarget[0])
    }
  }, [placementsForTarget, placement])

  useEffect(() => {
    if (targetType === 'MERCHANT' && eligibility?.merchant) {
      setTargetId(eligibility.merchant.id)
    } else if (targetType === 'SHOP') {
      const eligible = scopedShops.filter(s => s.eligible)
      if (eligible.length === 1) setTargetId(eligible[0].id)
    }
  }, [targetType, eligibility, scopedShops])

  // Une seule cible possible → démarrer directement sur emplacement
  useEffect(() => {
    if (availableTargets.length === 1 && step === 0) {
      setTargetType(availableTargets[0])
      setStep(1)
    }
  }, [availableTargets, step])

  const launch = async (mode: 'immediate' | 'waitlist' = 'immediate') => {
    if (!price) return
    setSubmitting(true)
    const resolvedTargetId =
      targetType === 'MERCHANT'
        ? eligibility?.merchant?.id
        : targetId || undefined

    const { merchantId, shopId } = apiScope
    const res = await createAdCampaign(
      {
        target_type: targetType,
        target_id: resolvedTargetId,
        placement,
        duration_days: duration,
        mode,
      },
      merchantId,
      shopId,
    )
    const data = await res.json()
    setSubmitting(false)

    if (res.ok) {
      if (data.waitlist) {
        notify.success(
          'Inscrit en file d\'attente',
          data.waitlist_position
            ? `Position #${data.waitlist_position} — vous serez notifié quand une place se libère.`
            : 'Vous serez notifié quand une place se libère.',
        )
        setStep(context === 'merchant_only' ? 1 : 0)
        void load()
        return
      }
      setPendingPayment({ paymentId: data.payment.id, reference: data.payment.reference })
      setStep(3)
    } else {
      const errBody = typeof data.message === 'object' && data.message !== null ? data.message : data
      const message =
        typeof errBody.message === 'string'
          ? errBody.message
          : typeof data.message === 'string'
            ? data.message
            : 'Erreur lors de la création'
      if (errBody.code === 'PLACEMENT_SATURATED' || message.includes('complet')) {
        notify.error('Emplacement saturé', message)
      } else {
        notify.error('Campagne impossible', message)
      }
    }
  }

  const resumePayment = (campaign: AdCampaign) => {
    if (!campaign.payment_id) return
    setPendingPayment({
      paymentId: campaign.payment_id,
      reference: `Campagne ${campaign.id.slice(0, 8)}`,
    })
    setStep(3)
  }

  const leaveWaitlist = async (campaignId: string) => {
    setSubmitting(true)
    const { merchantId, shopId } = apiScope
    const res = await cancelAdWaitlist(campaignId, merchantId, shopId)
    setSubmitting(false)
    if (res.ok) {
      notify.success('File d\'attente', 'Votre inscription a été annulée.')
      void load()
    } else {
      const data = await res.json().catch(() => ({}))
      notify.error('Erreur', data.message ?? 'Impossible d\'annuler')
    }
  }

  const confirm = async (result: 'success' | 'failure') => {
    if (!pendingPayment) return
    setSubmitting(true)
    await confirmAdPayment(pendingPayment.paymentId, result)
    setSubmitting(false)
    setPendingPayment(null)
    setStep(context === 'merchant_only' ? 1 : 0)
    if (result === 'success') {
      notify.success('Campagne activée', 'Votre visibilité sponsorisée est en ligne.')
    }
    void load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-slate-300" size={28} />
      </div>
    )
  }

  if (!canAds) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-sm text-amber-900">
        <p className="font-bold mb-1">Boutique non éligible</p>
        <p className="text-amber-800">
          Activez votre boutique et ajoutez au moins un produit en stock pour lancer une campagne.
        </p>
      </div>
    )
  }

  if (!availableTargets.length) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
        <p className="font-bold text-slate-800 mb-1">Aucune cible éligible</p>
        <p>
          {context === 'merchant_only'
            ? 'Votre établissement doit être vérifié et actif pour lancer une campagne de visibilité.'
            : context === 'standalone_shop' || context === 'linked_shop'
              ? 'Activez votre boutique et ajoutez au moins un produit en stock.'
              : 'Vérifiez votre établissement, activez votre boutique et ajoutez des produits en stock.'}
        </p>
      </div>
    )
  }

  const showTargetStep = availableTargets.length > 1 && context !== 'merchant_only'

  return (
    <div className="space-y-8">
      {/* Contexte actif */}
      <div className="bg-brand-50/60 border border-brand-100 rounded-2xl px-4 py-3 text-sm">
        <p className="text-slate-700">{ADS_CONTEXT_DESCRIPTIONS[context]}</p>
        {subjectLabel && (
          <p className="text-xs font-bold text-brand-700 mt-1 truncate">
            {context === 'merchant_only' || context === 'merchant_retail'
              ? `Établissement : ${subjectLabel}`
              : `Boutique : ${subjectLabel}`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Campagnes</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.campaigns}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Actives</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">En attente</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.waitlisted}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Impressions</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.impressions.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Clics</p>
          <p className="text-xl font-extrabold text-slate-900">{stats.clicks.toLocaleString('fr-FR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">CTR · Budget</p>
          <p className="text-lg font-extrabold text-slate-900 leading-tight">
            {stats.ctr != null ? `${stats.ctr} %` : '—'}
          </p>
          <p className="text-[10px] text-slate-400 font-semibold">{formatFcfa(stats.spent)} engagés</p>
        </div>
      </div>

      {suggestions.length > 0 && !pendingPayment && step === 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-500" />
            Suggestions
          </h2>
          <div className="space-y-2">
            {suggestions.map(s => (
              <button
                key={`${s.target_type}-${s.target_id}-${s.placement}`}
                type="button"
                onClick={() => applySuggestion(s)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/40 transition-all"
              >
                <p className="text-sm font-bold text-slate-900">{s.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.message}</p>
                <p className="text-[10px] font-bold text-brand-600 uppercase mt-1">
                  {TARGET_LABELS[s.target_type]} · {PLACEMENT_LABELS[s.placement]}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!pendingPayment && showTargetStep && (
        <div className="flex items-center gap-2 flex-wrap">
          {STEPS.slice(0, 3).map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors',
                step === i
                  ? 'bg-slate-900 text-white'
                  : i < step
                    ? 'bg-brand-50 text-brand-700 hover:bg-brand-100'
                    : 'bg-slate-100 text-slate-400',
              )}
            >
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              {label}
            </button>
          ))}
        </div>
      )}

      {pendingPayment ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 shadow-sm">
          <p className="font-bold text-slate-900">
            Paiement campagne — {pendingPayment.reference}
          </p>
          <p className="text-sm text-slate-500">
            Simulateur de paiement · {formatFcfa(price ?? 0)} · {PLACEMENT_LABELS[placement]}
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void confirm('success')}
              className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <CheckCircle2 size={16} /> Succès
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void confirm('failure')}
              className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <XCircle size={16} /> Échec
            </button>
          </div>
        </div>
      ) : showTargetStep && step === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-3">
          <p className="text-sm font-bold text-slate-700">Que souhaitez-vous mettre en avant ?</p>
          <div className={cn('grid gap-3', availableTargets.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
            {availableTargets.map(type => {
              const Icon = TARGET_ICONS[type]
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setTargetType(type)
                    setStep(1)
                  }}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all hover:border-brand-400 hover:shadow-md',
                    targetType === type ? 'border-brand-500 bg-brand-50/50' : 'border-slate-100',
                  )}
                >
                  <Icon size={20} className="text-brand-500 mb-2" />
                  <p className="font-bold text-sm text-slate-900">{TARGET_LABELS[type]}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{TARGET_HINTS[type]}</p>
                </button>
              )
            })}
          </div>
        </div>
      ) : step === 1 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          {showTargetStep && availableTargets.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {availableTargets.map(type => {
                const Icon = TARGET_ICONS[type]
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTargetType(type)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors',
                      targetType === type
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300',
                    )}
                  >
                    <Icon size={12} />
                    {TARGET_LABELS[type]}
                  </button>
                )
              })}
            </div>
          )}

          {targetType === 'SHOP' && scopedShops.filter(s => s.eligible).length > 1 && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Boutique</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              >
                {scopedShops.filter(s => s.eligible).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {targetType === 'PRODUCT' && (
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Produit</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
              >
                <option value="">Choisir un produit…</option>
                {scopedProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.price.toLocaleString('fr-FR')} {p.currency}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Emplacement</label>
            <div className="mt-2 space-y-2">
              {placementsForTarget.map(p => {
                const avail = pricing?.placement_availability?.[p] ?? eligibility?.placement_availability?.[p]
                return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlacement(p)}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                    placement === p
                      ? 'border-brand-500 bg-brand-50 text-brand-900'
                      : 'border-slate-100 hover:border-slate-200',
                  )}
                >
                  <span className="block">{PLACEMENT_LABELS[p]}</span>
                  {avail && (
                    <span className={cn(
                      'text-[10px] font-bold uppercase mt-1 block',
                      avail.is_saturated ? 'text-amber-600' : 'text-slate-400',
                    )}>
                      {avail.active}/{avail.capacity} places · {avail.waitlist} en file
                      {avail.is_saturated ? ' · Complet' : ` · ${avail.available_slots} dispo`}
                    </span>
                  )}
                </button>
              )})}
            </div>
          </div>

          <div className="flex gap-3">
            {showTargetStep && (
              <button type="button" onClick={() => setStep(0)} className="px-4 py-2.5 text-sm font-bold text-slate-500">
                Retour
              </button>
            )}
            <button
              type="button"
              disabled={targetType === 'PRODUCT' && !targetId}
              onClick={() => setStep(2)}
              className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              Continuer
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <p className="text-sm text-slate-600">
            <span className="font-bold text-slate-900">{TARGET_LABELS[targetType]}</span>
            {' · '}
            {PLACEMENT_LABELS[placement]}
          </p>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Durée</label>
            <select
              value={duration}
              onChange={e => setDuration(Number(e.target.value))}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm"
            >
              {(pricing?.durations ?? [7, 14, 30]).map(d => (
                <option key={d} value={d}>{d} jours</option>
              ))}
            </select>
          </div>
          {price != null && (
            <p className="text-lg font-extrabold text-slate-900">{formatFcfa(price)}</p>
          )}
          {placementAvailability && (
            <div className={cn(
              'rounded-xl px-4 py-3 text-sm',
              isPlacementSaturated
                ? 'bg-amber-50 border border-amber-200 text-amber-900'
                : 'bg-emerald-50 border border-emerald-100 text-emerald-800',
            )}>
              {isPlacementSaturated ? (
                <>
                  <p className="font-bold">Emplacement complet ({placementAvailability.active}/{placementAvailability.capacity})</p>
                  <p className="text-xs mt-1 text-amber-800">
                    {placementAvailability.waitlist} annonceur(s) déjà en file. Rejoignez la file d&apos;attente — vous pourrez payer dès qu&apos;une place se libère.
                  </p>
                </>
              ) : (
                <p>
                  <span className="font-bold">{placementAvailability.available_slots}</span> place(s) disponible(s) sur {placementAvailability.capacity}.
                </p>
              )}
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setStep(1)} className="px-4 py-2.5 text-sm font-bold text-slate-500">
              Retour
            </button>
            {isPlacementSaturated ? (
              <button
                type="button"
                disabled={submitting || price == null || (targetType === 'PRODUCT' && !targetId)}
                onClick={() => void launch('waitlist')}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                Rejoindre la file d&apos;attente
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || price == null || (targetType === 'PRODUCT' && !targetId)}
                onClick={() => void launch('immediate')}
                className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                Lancer la campagne
              </button>
            )}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-2">
          <BarChart3 size={16} /> Mes campagnes
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Historique et performances de vos campagnes. Une campagne « Top recherche » active apparaît en tête des résultats sur{' '}
          <Link href="/search" className="text-brand-600 font-semibold hover:underline">/search</Link>
          {' '}(badge Sponsorisé, max 3 par page).
        </p>
        {filteredCampaigns.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
            Aucune campagne pour ce contexte. Lancez votre première visibilité sponsorisée ci-dessus.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCampaigns.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-4 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {statusBadge(c.status)}
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {TARGET_LABELS[c.target_type]} · {PLACEMENT_LABELS[c.placement]}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 truncate">{campaignLabel(c)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(c.starts_at).toLocaleDateString('fr-FR')} →{' '}
                    {new Date(c.ends_at).toLocaleDateString('fr-FR')}
                  </p>
                  {c.status === 'ACTIVE' && c.placement === 'SEARCH' && c.merchant?.business_name && (
                    <Link
                      href={`/search?q=${encodeURIComponent(c.merchant.business_name)}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline mt-1.5"
                    >
                      Voir sur la recherche →
                    </Link>
                  )}
                  {c.status === 'PENDING_PAYMENT' && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-amber-700">
                        Paiement requis pour activer la campagne.
                      </p>
                      {c.payment_id && (
                        <button
                          type="button"
                          onClick={() => resumePayment(c)}
                          className="text-xs font-bold text-brand-600 hover:underline"
                        >
                          Finaliser le paiement →
                        </button>
                      )}
                    </div>
                  )}
                  {c.status === 'WAITLISTED' && (
                    <div className="mt-1.5 space-y-1">
                      <p className="text-xs text-indigo-700 flex items-center gap-1">
                        <Clock size={12} />
                        Position #{c.waitlist_position ?? '—'} dans la file
                        {placementAvailability && c.placement === placement
                          ? ` (${placementAvailability.waitlist} au total)`
                          : ''}
                      </p>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => void leaveWaitlist(c.id)}
                        className="text-xs font-bold text-slate-500 hover:text-red-600"
                      >
                        Quitter la file
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm text-slate-800">{formatFcfa(c.amount)}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-semibold">
                    {c.impressions.toLocaleString('fr-FR')} vues · {c.clicks.toLocaleString('fr-FR')} clics
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.impressions > 0
                      ? <>CTR {((c.clicks / c.impressions) * 100).toFixed(1)} %</>
                      : c.status === 'ACTIVE' ? 'En attente de trafic' : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
