'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BedDouble,
  Calendar,
  CalendarCheck,
  CalendarOff,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Settings2,
  Stethoscope,
  Trash2,
  UtensilsCrossed,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { matchesSearchQuery } from '@/lib/merchantListFilters'
import { merchantApiFetch } from '@/lib/merchantApi'
import { getMerchantVertical } from '@/lib/merchantVertical'
import { notify } from '@/lib/notify'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantBookingDetailSheet } from '@/features/merchant/components/MerchantBookingDetailSheet'
import {
  MerchantBookingAgenda,
  MerchantBookingsViewToggle,
} from '@/features/merchant/components/MerchantBookingAgenda'
import { MerchantListToolbar } from '@/features/merchant/components/MerchantListToolbar'
import { BookingPaymentSettingsFields } from '@/features/merchant/components/BookingPaymentSettingsFields'
import { toBookingSettingsPatch, type MerchantBookingSettings } from '@/lib/bookingSettingsApi'
import type { BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS } from '@/lib/bookingConfig'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  BOOKING_TYPE_STYLES,
  type BookingDisplaySource,
  type MerchantBookingStatusAction,
  getBookingCardMeta,
  getBookingPricing,
  getBookingWhenDisplay,
  isMerchantBookingHistory,
} from '@/lib/bookingDisplay'

type PageView = 'list' | 'settings' | 'blocks'

interface BookingSettings extends MerchantBookingSettings {
  max_capacity: number
  slot_duration_min: number
  buffer_min: number
  booking_window_days: number
  auto_confirm: boolean
}

interface AvailabilityBlock {
  id: string
  starts_at: string
  ends_at: string
  all_day: boolean
  reason: string | null
}

const INPUT = 'w-full border-2 border-slate-200 rounded-xl px-4 py-2 text-sm bg-white outline-none focus:border-amber-400'

type StatusTab = 'active' | 'pending' | 'history' | 'all'

const TYPE_ICONS: Record<BookingType, React.ReactNode> = {
  TABLE: <UtensilsCrossed size={14} />,
  APPOINTMENT: <CalendarCheck size={14} />,
  ROOM: <BedDouble size={14} />,
  CONSULTATION: <Stethoscope size={14} />,
  VENUE: <Calendar size={14} />,
}

const STATUS_TABS: { id: StatusTab; label: string }[] = [
  { id: 'active', label: 'À traiter' },
  { id: 'pending', label: 'En attente' },
  { id: 'history', label: 'Historique' },
  { id: 'all', label: 'Toutes' },
]

function bookingSearchFields(booking: BookingDisplaySource) {
  return [
    booking.guest_name,
    booking.guest_phone,
    booking.guest_email,
    booking.notes,
    booking.room_type,
    booking.service?.name,
    booking.staff?.name,
    booking.user?.full_name,
    booking.user?.email,
    BOOKING_TYPE_LABELS[booking.booking_type],
    BOOKING_STATUS_LABELS[booking.status],
  ]
}

function matchesStatusTab(booking: BookingDisplaySource, tab: StatusTab): boolean {
  switch (tab) {
    case 'pending':
      return booking.status === 'PENDING'
    case 'active':
      return ['PENDING', 'CONFIRMED'].includes(booking.status)
    case 'history':
      return isMerchantBookingHistory(booking.status)
    default:
      return true
  }
}

export default function MerchantBookingsPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId, user } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [bookings, setBookings] = useState<BookingDisplaySource[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [statusTab, setStatusTab] = useState<StatusTab>('active')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [typeFilter, setTypeFilter] = useState<BookingType | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<BookingDisplaySource | null>(null)
  const [pageView, setPageView] = useState<PageView>('list')

  // Settings panel state
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  // Blocks panel state
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [blockForm, setBlockForm] = useState({ starts_at: '', ends_at: '', all_day: false, reason: '' })

  const activeMerchant = user?.merchants?.find(m => m.id === activeMerchantId)
  const isFood = getMerchantVertical(activeMerchant?.category_slug ?? '') === 'food'

  const debouncedSearch = useDebounce(searchQuery, 250)

  const fetchBookings = useCallback(async (): Promise<BookingDisplaySource[]> => {
    setLoading(true)
    const res = await merchantApiFetch('/bookings/merchant', activeMerchantId)
    let list: BookingDisplaySource[] = []
    if (res.ok) {
      const data = await res.json()
      list = Array.isArray(data) ? data : []
      setBookings(list)
    }
    setLoading(false)
    return list
  }, [activeMerchantId])

  const fetchSettings = useCallback(async () => {
    if (!activeMerchantId) return
    const res = await merchantApiFetch('/merchants/me/booking-settings', activeMerchantId)
    if (res.ok) setSettings(await res.json())
  }, [activeMerchantId])

  const fetchBlocks = useCallback(async () => {
    if (!activeMerchantId) return
    const res = await merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId)
    if (res.ok) setBlocks(await res.json())
  }, [activeMerchantId])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/merchant/bookings')
      return
    }
    if (hydrated && isAuthenticated) {
      void fetchBookings()
      void fetchSettings()
      void fetchBlocks()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId, hydrated])

  const saveSettings = async () => {
    if (!settings || !activeMerchantId) return
    setSavingSettings(true)
    try {
      const res = await merchantApiFetch('/merchants/me/booking-settings', activeMerchantId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toBookingSettingsPatch(settings)),
      })
      if (!res.ok) { notify.error('Erreur lors de l\'enregistrement'); return }
      setSettings(await res.json())
      notify.success('Paramètres enregistrés.')
    } catch { notify.error('Erreur réseau.') }
    finally { setSavingSettings(false) }
  }

  const addBlock = async () => {
    if (!activeMerchantId || !blockForm.starts_at || !blockForm.ends_at) return
    await merchantApiFetch('/merchants/me/availability-blocks', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starts_at: new Date(blockForm.starts_at).toISOString(),
        ends_at: new Date(blockForm.ends_at).toISOString(),
        all_day: blockForm.all_day,
        reason: blockForm.reason.trim() || undefined,
      }),
    })
    setBlockForm({ starts_at: '', ends_at: '', all_day: false, reason: '' })
    void fetchBlocks()
  }

  const deleteBlock = async (id: string) => {
    if (!activeMerchantId) return
    await merchantApiFetch(`/merchants/me/availability-blocks/${id}`, activeMerchantId, { method: 'DELETE' })
    void fetchBlocks()
  }

  const availableTypes = useMemo(() => {
    const types = new Set(bookings.map(b => b.booking_type))
    return (['TABLE', 'APPOINTMENT', 'ROOM', 'CONSULTATION', 'VENUE'] as BookingType[]).filter(t =>
      types.has(t),
    )
  }, [bookings])

  const filtered = useMemo(() => {
    return bookings
      .filter(b => matchesStatusTab(b, statusTab))
      .filter(b => typeFilter === 'ALL' || b.booking_type === typeFilter)
      .filter(b => matchesSearchQuery(bookingSearchFields(b), debouncedSearch))
      .sort((a, b) => new Date(a.booked_at).getTime() - new Date(b.booked_at).getTime())
  }, [bookings, statusTab, typeFilter, debouncedSearch])

  const hasExtraFilters =
    typeFilter !== 'ALL' || statusTab !== 'active' || searchQuery.trim().length > 0

  const resetFilters = () => {
    setSearchQuery('')
    setTypeFilter('ALL')
    setStatusTab('active')
  }

  const counts = useMemo(() => ({
    pending: bookings.filter(b => b.status === 'PENDING').length,
    active: bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).length,
    history: bookings.filter(b => isMerchantBookingHistory(b.status)).length,
  }), [bookings])

  const updateStatus = async (id: string, status: MerchantBookingStatusAction) => {
    setProcessing(true)
    const res = await merchantApiFetch(`/bookings/${id}/status`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const list = await fetchBookings()
      setSelected(prev => (prev ? list.find(b => b.id === prev.id) ?? null : null))
    }
    setProcessing(false)
  }

  if (hydrated && !isAuthenticated) return null

  return (
    <MerchantShell>
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3">
            <CalendarCheck size={22} className="text-amber-500 shrink-0" />
            Réservations
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {loading
              ? 'Chargement…'
              : `${bookings.length} demande${bookings.length > 1 ? 's' : ''} · ${counts.pending} en attente`}
          </p>
        </div>
        {isFood && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setPageView(v => v === 'blocks' ? 'list' : 'blocks')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                pageView === 'blocks' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <CalendarOff size={15} />
              <span className="hidden sm:inline">Blocages</span>
            </button>
            <button
              type="button"
              onClick={() => setPageView(v => v === 'settings' ? 'list' : 'settings')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                pageView === 'settings' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Settings2 size={15} />
              <span className="hidden sm:inline">Paramètres</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings panel */}
      {pageView === 'settings' && settings && (
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-5 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">Paramètres des créneaux</h2>
            <button type="button" onClick={() => setPageView('list')} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"><X size={18} /></button>
          </div>

          {/* Explication slots TABLE */}
          {isFood && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Comment fonctionnent les créneaux ?</p>
                  <p className="text-amber-800 mt-1">
                    Les créneaux disponibles sont calculés automatiquement à partir de vos <strong>horaires d&apos;ouverture</strong>.
                    Si aucun créneau n&apos;apparaît, vérifiez que vos horaires sont bien renseignés.
                  </p>
                  <a
                    href="/merchant/hours"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900"
                  >
                    <ChevronRight size={13} /> Configurer les horaires d&apos;ouverture
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Tables disponibles</span>
              <input type="number" min={1} value={settings.max_capacity} onChange={e => setSettings(s => s ? { ...s, max_capacity: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Durée créneau (min)</span>
              <input type="number" min={15} step={15} value={settings.slot_duration_min} onChange={e => setSettings(s => s ? { ...s, slot_duration_min: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Tampon entre créneaux (min)</span>
              <input type="number" min={0} value={settings.buffer_min} onChange={e => setSettings(s => s ? { ...s, buffer_min: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-slate-500">Fenêtre de réservation (jours)</span>
              <input type="number" min={1} value={settings.booking_window_days} onChange={e => setSettings(s => s ? { ...s, booking_window_days: Number(e.target.value) } : s)} className="mt-1 w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <input type="checkbox" checked={settings.auto_confirm} onChange={e => setSettings(s => s ? { ...s, auto_confirm: e.target.checked } : s)} />
            Confirmation automatique
          </label>
          <BookingPaymentSettingsFields settings={settings} onChange={patch => setSettings(s => s ? { ...s, ...patch } : s)} />
          <label className="block">
            <span className="text-xs font-bold text-slate-500">Politique d&apos;annulation</span>
            <textarea rows={2} value={settings.cancellation_policy ?? ''} onChange={e => setSettings(s => s ? { ...s, cancellation_policy: e.target.value || null } : s)} placeholder="Ex. Annulation gratuite jusqu'à 2 h avant." className={`mt-1 ${INPUT} resize-y`} />
          </label>
          <button type="button" onClick={() => void saveSettings()} disabled={savingSettings} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-60">
            {savingSettings ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </section>
      )}

      {/* Blocks panel */}
      {pageView === 'blocks' && (
        <section className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-5 space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-slate-900">Indisponibilités</h2>
            <button type="button" onClick={() => setPageView('list')} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <input type="datetime-local" value={blockForm.starts_at} onChange={e => setBlockForm(f => ({ ...f, starts_at: e.target.value }))} className={INPUT} />
            <input type="datetime-local" value={blockForm.ends_at} onChange={e => setBlockForm(f => ({ ...f, ends_at: e.target.value }))} className={INPUT} />
            <input placeholder="Motif (optionnel)" value={blockForm.reason} onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))} className={`${INPUT} sm:col-span-2`} />
          </div>
          <button type="button" onClick={() => void addBlock()} disabled={!blockForm.starts_at || !blockForm.ends_at} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold disabled:opacity-50">Ajouter blocage</button>
          <ul className="space-y-2">
            {blocks.length === 0 && <li className="text-sm text-slate-400 py-2">Aucune indisponibilité configurée.</li>}
            {blocks.map(b => (
              <li key={b.id} className="flex items-center justify-between gap-2 text-sm border border-slate-100 rounded-xl px-3 py-2">
                <span className="text-slate-700">{new Date(b.starts_at).toLocaleString('fr-FR')} → {new Date(b.ends_at).toLocaleString('fr-FR')}{b.reason ? ` · ${b.reason}` : ''}</span>
                <button type="button" onClick={() => void deleteBlock(b.id)} className="p-1.5 text-red-400 hover:text-red-600 rounded-lg"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <MerchantListToolbar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Nom, téléphone, chambre, notes…"
        resultCount={filtered.length}
        totalCount={bookings.length}
        showReset={hasExtraFilters}
        onReset={resetFilters}
      />

      <div className="flex gap-1.5 sm:gap-2 mb-4 p-1 bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        {STATUS_TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStatusTab(t.id)}
            className={`shrink-0 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
              statusTab === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t.label}
            {t.id === 'pending' && counts.pending > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[10px]">
                {counts.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {availableTypes.length > 1 && (
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <Filter size={14} className="text-slate-400 shrink-0" />
          <button
            type="button"
            onClick={() => setTypeFilter('ALL')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              typeFilter === 'ALL'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            Tous types
          </button>
          {availableTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(type)}
              className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                typeFilter === type
                  ? `${BOOKING_TYPE_STYLES[type]}`
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {TYPE_ICONS[type]}
              {BOOKING_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}

      <MerchantBookingsViewToggle view={viewMode} onChange={setViewMode} />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[24px] sm:rounded-[28px] border border-slate-100 px-6">
          <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">
            {bookings.length === 0
              ? 'Aucune réservation'
              : debouncedSearch || hasExtraFilters
                ? 'Aucun résultat pour cette recherche'
                : 'Aucun résultat pour ce filtre'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {bookings.length === 0
              ? 'Les demandes apparaîtront ici dès qu\'un client réserve.'
              : hasExtraFilters
                ? 'Modifiez la recherche ou réinitialisez les filtres.'
                : 'Essayez un autre filtre ou consultez toutes les réservations.'}
          </p>
          {hasExtraFilters && bookings.length > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 text-sm font-bold text-amber-600 hover:text-amber-700 underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : viewMode === 'calendar' ? (
        <MerchantBookingAgenda
          bookings={filtered}
          onSelect={b => setSelected(b)}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filtered.map(b => (
            <MerchantBookingCard
              key={b.id}
              booking={b}
              onOpen={() => setSelected(b)}
            />
          ))}
        </div>
      )}

      {selected && (
        <MerchantBookingDetailSheet
          booking={selected}
          open={!!selected}
          onClose={() => setSelected(null)}
          onStatusChange={status => updateStatus(selected.id, status)}
          processing={processing}
        />
      )}
    </MerchantShell>
  )
}

function MerchantBookingCard({
  booking,
  onOpen,
}: {
  booking: BookingDisplaySource
  onOpen: () => void
}) {
  const when = getBookingWhenDisplay(booking)
  const meta = getBookingCardMeta(booking)
  const pricing = getBookingPricing(booking)
  const isPending = booking.status === 'PENDING'

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full text-left bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border shadow-sm hover:shadow-md transition-all active:scale-[0.99] ${
        isPending ? 'border-amber-200 ring-1 ring-amber-100' : 'border-slate-100 hover:border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            <span
              className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                BOOKING_TYPE_STYLES[booking.booking_type]
              }`}
            >
              {TYPE_ICONS[booking.booking_type]}
              {BOOKING_TYPE_LABELS[booking.booking_type]}
            </span>
            <span
              className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${
                BOOKING_STATUS_STYLES[booking.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
            {booking.guest_name}
          </h3>
          <p className="text-xs text-slate-500 truncate">{booking.guest_phone}</p>

          <p className="text-xs sm:text-sm font-semibold text-slate-700 mt-2 line-clamp-2">
            {when.headline}
          </p>
          {when.subline && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              {when.showTime ? <Clock size={12} className="text-amber-500 shrink-0" /> : null}
              {when.subline}
            </p>
          )}

          {pricing?.formattedTotal && booking.booking_type === 'ROOM' && (
            <p className="text-sm font-extrabold text-slate-900 mt-1.5">
              {pricing.formattedTotal}
              {pricing.nights > 0 && pricing.formattedUnit && (
                <span className="text-xs font-semibold text-slate-400 ml-1.5">
                  ({pricing.formattedUnit} × {pricing.nights})
                </span>
              )}
            </p>
          )}

          {meta.length > 0 && (
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1.5 truncate">
              {meta.join(' · ')}
            </p>
          )}

          {booking.notes && (
            <p className="text-xs text-slate-500 mt-1.5 italic line-clamp-1">&ldquo;{booking.notes}&rdquo;</p>
          )}

          {(booking.booking_type === 'TABLE' || booking.booking_type === 'ROOM') && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 sm:hidden">
              <Users size={11} /> {booking.party_size} pers.
            </span>
          )}
        </div>

        <ChevronRight size={18} className="text-slate-300 shrink-0 mt-2" aria-hidden />
      </div>

      {isPending && (
        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mt-3 pt-3 border-t border-amber-100">
          Action requise · Appuyez pour confirmer ou refuser
        </p>
      )}
    </button>
  )
}
