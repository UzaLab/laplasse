'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, UserMinus, UserX, TrendingUp, Search, Loader2, Star,
  Phone, Mail, MessageCircle, ShoppingBag, Calendar, Eye, Heart, Tag,
  ChevronRight, ChevronLeft, ChevronDown, X, Clock, Sparkles, Banknote,
} from 'lucide-react'
import { formatPrice } from '@/lib/marketplaceApi'
import {
  type CrmCustomer, type CrmCustomerDetail, type CrmData, type CrmSegment,
  fetchMerchantCrm, fetchMerchantCrmDetail, fetchShopCrm, fetchShopCrmDetail,
  SOURCE_LABELS, whatsappHref, telHref, mailHref,
} from '@/lib/crmApi'

type ViewMode = 'merchant' | 'shop'
type TypeFilter = 'all' | 'client' | 'prospect'
type SegmentFilter = 'all' | CrmSegment

const PAGE_SIZE = 20

const FILTER_CONTROL_CLASS =
  'w-full h-10 pl-3 pr-9 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50 appearance-none cursor-pointer'

const SEGMENT_CONFIG: Record<CrmSegment, { label: string; color: string; bg: string; icon: React.ReactNode; desc: string }> = {
  recent:   { label: 'Récent',   color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', icon: <UserCheck size={14} />, desc: 'Activité dans les 30 derniers jours' },
  regular:  { label: 'Régulier', color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100',     icon: <TrendingUp size={14} />, desc: 'Engagement sans activité récente' },
  inactive: { label: 'Inactif',  color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-100',   icon: <UserMinus size={14} />, desc: 'Aucune activité depuis 90+ jours' },
  lost:     { label: 'Perdu',    color: 'text-red-700',     bg: 'bg-red-50 border-red-100',         icon: <UserX size={14} />,     desc: 'Absent depuis 180+ jours' },
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-label={label}
          className={FILTER_CONTROL_CLASS}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      </div>
    </div>
  )
}

function CrmPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const start = page * pageSize + 1
  const end = Math.min((page + 1) * pageSize, total)

  return (
    <div className="px-4 sm:px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-slate-500 font-medium text-center sm:text-left">
        {start}–{end} sur {total} contact{total > 1 ? 's' : ''}
      </p>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          className="flex items-center justify-center gap-1 h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Préc.</span>
        </button>
        <span className="text-xs font-bold text-slate-500 tabular-nums min-w-[4.5rem] text-center">
          {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex items-center justify-center gap-1 h-10 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Suiv.</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

function SourceBadge({ source }: { source: string }) {
  const icons: Record<string, React.ReactNode> = {
    review: <Star size={10} />,
    booking: <Calendar size={10} />,
    favorite: <Heart size={10} />,
    order: <ShoppingBag size={10} />,
    interaction: <Eye size={10} />,
    promo: <Tag size={10} />,
    product_favorite: <Heart size={10} />,
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
      {icons[source]} {SOURCE_LABELS[source] ?? source}
    </span>
  )
}

function ContactActions({ customer }: { customer: Pick<CrmCustomer, 'phone' | 'email'> }) {
  if (!customer.phone && !customer.email) {
    return <span className="text-xs text-slate-300">—</span>
  }
  return (
    <div className="flex items-center gap-1">
      {customer.phone && (
        <>
          <a href={telHref(customer.phone)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors" title="Appeler">
            <Phone size={13} />
          </a>
          <a href={whatsappHref(customer.phone)} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-700 transition-colors" title="WhatsApp">
            <MessageCircle size={13} />
          </a>
        </>
      )}
      {customer.email && (
        <a href={mailHref(customer.email)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors" title="Email">
          <Mail size={13} />
        </a>
      )}
    </div>
  )
}

function CustomerDrawer({
  customerId,
  mode,
  merchantId,
  shopId,
  onClose,
}: {
  customerId: string
  mode: ViewMode
  merchantId?: string | null
  shopId?: string | null
  onClose: () => void
}) {
  const { data, isLoading } = useQuery<CrmCustomerDetail | null>({
    queryKey: ['crm-detail', mode, merchantId, shopId, customerId],
    queryFn: () =>
      mode === 'shop'
        ? fetchShopCrmDetail(customerId, shopId)
        : fetchMerchantCrmDetail(customerId, merchantId),
  })

  const c = data

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-label="Fermer" />
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-extrabold text-slate-900">Fiche contact</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>

        {isLoading || !c ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-5 border-b border-slate-50">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-extrabold text-slate-500 text-lg shrink-0">
                  {(c.full_name ?? c.email ?? c.phone ?? '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-lg text-slate-900 truncate">{c.full_name ?? 'Anonyme'}</p>
                  {c.isGuest && (
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1">Invité</span>
                  )}
                  <div className="mt-2 space-y-1">
                    {c.email && <p className="text-sm text-slate-500 truncate flex items-center gap-1.5"><Mail size={12} /> {c.email}</p>}
                    {c.phone && <p className="text-sm text-slate-500 truncate flex items-center gap-1.5"><Phone size={12} /> {c.phone}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <ContactActions customer={c} />
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.sources.map(s => <SourceBadge key={s} source={s} />)}
              </div>
            </div>

            <div className="px-5 py-4 grid grid-cols-2 gap-3 border-b border-slate-50">
              {c.orderCount > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Commandes</p>
                  <p className="text-lg font-extrabold text-slate-900">{c.orderCount}</p>
                  {c.totalSpent > 0 && <p className="text-xs text-emerald-600 font-semibold">{formatPrice(c.totalSpent)}</p>}
                </div>
              )}
              {c.bookingCount > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Réservations</p>
                  <p className="text-lg font-extrabold text-slate-900">{c.bookingCount}</p>
                </div>
              )}
              {c.reviewCount > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Avis</p>
                  <p className="text-lg font-extrabold text-slate-900 flex items-center gap-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" /> {c.avgRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-slate-400">{c.reviewCount} avis</p>
                </div>
              )}
              {c.interactionCount > 0 && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 font-medium">Interactions</p>
                  <p className="text-lg font-extrabold text-slate-900">{c.interactionCount}</p>
                </div>
              )}
            </div>

            <div className="px-5 py-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Historique
              </h3>
              {c.timeline.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune activité enregistrée.</p>
              ) : (
                <div className="space-y-3">
                  {c.timeline.map((ev, i) => (
                    <div key={`${ev.type}-${ev.date}-${i}`} className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0 pb-3 border-b border-slate-50 last:border-0">
                        <p className="text-sm font-semibold text-slate-800">{ev.label}</p>
                        {ev.detail && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{ev.detail}</p>}
                        <p className="text-[11px] text-slate-400 mt-1">{formatDate(ev.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface MerchantCrmPanelProps {
  mode: ViewMode
  merchantId?: string | null
  shopId?: string | null
  title?: string
  subtitle?: string
}

export function MerchantCrmPanel({
  mode,
  merchantId,
  shopId,
  title = 'CRM Clients',
  subtitle = 'Vue d\'ensemble de vos clients, prospects et contacts.',
}: MerchantCrmPanelProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [segment, setSegment] = useState<SegmentFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<CrmData | null>({
    queryKey: ['crm', mode, merchantId, shopId],
    queryFn: () => (mode === 'shop' ? fetchShopCrm(shopId) : fetchMerchantCrm(merchantId)),
    enabled: mode === 'shop' ? !!shopId : !!merchantId,
  })

  useEffect(() => {
    setPage(0)
  }, [typeFilter, segment, search])

  const filtered = useMemo(() => {
    return (data?.customers ?? []).filter(c => {
      if (typeFilter !== 'all' && c.customerType !== typeFilter) return false
      if (segment !== 'all' && c.segment !== segment) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          (c.full_name ?? '').toLowerCase().includes(q)
          || (c.email ?? '').toLowerCase().includes(q)
          || (c.phone ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [data?.customers, typeFilter, segment, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)

  const pagedCustomers = useMemo(() => {
    const start = safePage * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const typeOptions = useMemo(() => [
    { value: 'all', label: `Tous (${data?.customers.length ?? 0})` },
    { value: 'client', label: `Clients (${data?.summary.total_customers ?? 0})` },
    { value: 'prospect', label: `Prospects (${data?.summary.total_prospects ?? 0})` },
  ], [data?.customers.length, data?.summary.total_customers, data?.summary.total_prospects])

  const segmentOptions = useMemo(() => [
    { value: 'all', label: 'Tous les statuts' },
    ...(['recent', 'regular', 'inactive', 'lost'] as CrmSegment[]).map(seg => ({
      value: seg,
      label: SEGMENT_CONFIG[seg].label,
    })),
  ], [])

  const s = data?.summary
  const ctx = data?.context

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
        <Users size={32} className="mx-auto mb-3 text-slate-300" />
        <p className="font-bold text-slate-700">CRM indisponible</p>
        <p className="text-sm text-slate-400 mt-1">Vérifiez votre plan ou réessayez plus tard.</p>
      </div>
    )
  }

  const contextLabel = ctx?.mode === 'shop' && !ctx.merchantId
    ? 'Boutique standalone — clients issus des commandes et favoris produits'
    : ctx?.hasShop
      ? `Établissement + boutique${ctx.shopName ? ` « ${ctx.shopName} »` : ''} — avis, réservations, commandes`
      : 'Établissement — avis, réservations, favoris et interactions'

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        <p className="text-xs text-slate-500 mt-2 bg-slate-50 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-100">
          <Sparkles size={12} className="text-amber-500" /> {contextLabel}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Clients', value: s?.total_customers ?? 0, icon: <Users size={16} />, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Prospects', value: s?.total_prospects ?? 0, icon: <Eye size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Récents (30j)', value: s?.recent_30d ?? 0, icon: <UserCheck size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Commandes', value: s?.total_orders ?? 0, icon: <ShoppingBag size={16} />, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'CA clients', value: s?.total_revenue ? formatPrice(s.total_revenue) : '—', icon: <Banknote size={16} />, color: 'text-emerald-700', bg: 'bg-emerald-50', isText: true },
          { label: 'Visites (30j)', value: s?.interactions_30d ?? 0, icon: <TrendingUp size={16} />, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col gap-2">
            <div className={`w-9 h-9 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
              {kpi.icon}
            </div>
            <div>
              <p className={`${kpi.isText ? 'text-base' : 'text-xl'} font-extrabold text-slate-900 truncate`}>{kpi.value}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Liste */}
      <div className="bg-white rounded-[24px] border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-5 py-4 border-b border-slate-100">
          <div className="flex flex-col gap-2.5">
            <div className="relative min-w-0 sm:hidden">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, email, téléphone…"
                className="w-full h-10 pl-9 pr-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-[minmax(0,9.5rem)_minmax(0,10.5rem)_minmax(0,1fr)] gap-2.5 sm:gap-3 sm:items-center">
              <FilterSelect
                id="crm-type-filter"
                label="Type de contact"
                value={typeFilter}
                onChange={v => setTypeFilter(v as TypeFilter)}
                options={typeOptions}
              />
              <FilterSelect
                id="crm-segment-filter"
                label="Statut"
                value={segment}
                onChange={v => setSegment(v as SegmentFilter)}
                options={segmentOptions}
              />
              <div className="relative min-w-0 hidden sm:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Nom, email, téléphone…"
                  className="w-full h-10 pl-9 pr-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50"
                />
              </div>
            </div>
            {filtered.length > 0 && (
              <p className="text-xs text-slate-400 font-medium">
                {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
                {(typeFilter !== 'all' || segment !== 'all' || search.trim()) && ' (filtrés)'}
              </p>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Aucun contact trouvé</p>
            <p className="text-sm mt-1">Modifiez vos filtres ou attendez de nouvelles interactions.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-50">
              {pagedCustomers.map(c => {
              const seg = SEGMENT_CONFIG[c.segment]
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0">
                    {(c.full_name ?? c.email ?? c.phone ?? '?')[0]?.toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{c.full_name ?? 'Anonyme'}</p>
                      {c.customerType === 'prospect' && (
                        <span className="text-[10px] font-bold uppercase text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-md">Prospect</span>
                      )}
                      {c.isGuest && (
                        <span className="text-[10px] font-bold uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">Invité</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {[c.email, c.phone].filter(Boolean).join(' · ') || 'Pas de contact'}
                    </p>
                    <div className="hidden sm:flex flex-wrap gap-1 mt-1.5">
                      {c.sources.slice(0, 4).map(s => <SourceBadge key={s} source={s} />)}
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-0.5 shrink-0 text-xs">
                    {c.orderCount > 0 && (
                      <span className="font-bold text-slate-700">{c.orderCount} cmd · {formatPrice(c.totalSpent)}</span>
                    )}
                    {c.reviewCount > 0 && (
                      <span className="text-slate-500 flex items-center gap-0.5">
                        <Star size={10} className="text-amber-400 fill-amber-400" /> {c.avgRating.toFixed(1)} ({c.reviewCount})
                      </span>
                    )}
                    {c.bookingCount > 0 && !c.orderCount && (
                      <span className="text-slate-500">{c.bookingCount} résa.</span>
                    )}
                  </div>

                  <div className="hidden lg:block shrink-0" onClick={e => e.stopPropagation()}>
                    <ContactActions customer={c} />
                  </div>

                  <div className="hidden sm:block text-xs text-slate-400 shrink-0 w-24 text-right">
                    {formatDate(c.lastActivityAt)}
                  </div>

                  <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${seg.bg} ${seg.color} shrink-0`}>
                    {seg.icon} {seg.label}
                  </span>

                  <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 shrink-0" />
                </button>
              )
            })}
            </div>
            <CrmPagination
              page={safePage}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Légende */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(SEGMENT_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`border rounded-2xl p-4 ${cfg.bg}`}>
            <div className={`flex items-center gap-1.5 font-bold text-sm ${cfg.color} mb-1`}>
              {cfg.icon} {cfg.label}
            </div>
            <p className="text-xs text-slate-500">{cfg.desc}</p>
          </div>
        ))}
      </div>

      {selectedId && (
        <CustomerDrawer
          customerId={selectedId}
          mode={mode}
          merchantId={merchantId}
          shopId={shopId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  )
}
