'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  BedDouble,
  Calendar,
  CalendarCheck,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Stethoscope,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { MerchantBookingDetailSheet } from '@/features/merchant/components/MerchantBookingDetailSheet'
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
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [bookings, setBookings] = useState<BookingDisplaySource[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [statusTab, setStatusTab] = useState<StatusTab>('active')
  const [typeFilter, setTypeFilter] = useState<BookingType | 'ALL'>('ALL')
  const [selected, setSelected] = useState<BookingDisplaySource | null>(null)

  const fetchBookings = async (): Promise<BookingDisplaySource[]> => {
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
  }

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login?redirect=/merchant/bookings')
      return
    }
    if (hydrated && isAuthenticated) fetchBookings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId, hydrated])

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
      .sort((a, b) => new Date(a.booked_at).getTime() - new Date(b.booked_at).getTime())
  }, [bookings, statusTab, typeFilter])

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
      <div className="mb-6 sm:mb-8">
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
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
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

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[24px] sm:rounded-[28px] border border-slate-100 px-6">
          <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">
            {bookings.length === 0 ? 'Aucune réservation' : 'Aucun résultat pour ce filtre'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {bookings.length === 0
              ? 'Les demandes apparaîtront ici dès qu\'un client réserve.'
              : 'Essayez un autre filtre ou consultez toutes les réservations.'}
          </p>
        </div>
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
