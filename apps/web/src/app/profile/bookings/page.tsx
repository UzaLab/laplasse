'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BedDouble,
  Calendar,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Stethoscope,
  UtensilsCrossed,
  Users,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { BookingDetailSheet } from '@/features/profile/components/BookingDetailSheet'
import { EditBookingModal, type EditableBooking } from '@/features/profile/components/EditBookingModal'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import type { BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS } from '@/lib/bookingConfig'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUS_STYLES,
  BOOKING_TYPE_STYLES,
  type BookingDisplaySource,
  getBookingCardMeta,
  getBookingPricing,
  getBookingWhenDisplay,
  isBookingUpcoming,
} from '@/lib/bookingDisplay'

interface BookingRow extends BookingDisplaySource {
  service_id?: string | null
  staff_id?: string | null
  merchant: { id: string; business_name: string; slug: string; cover_image?: string | null }
}

interface BookingsResponse {
  items: BookingRow[]
  total: number
  page: number
  limit: number
  totalPages: number
}

type Tab = 'upcoming' | 'history'

const PAGE_SIZE = 5

const PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'

const TYPE_ICONS: Record<BookingType, React.ReactNode> = {
  TABLE: <UtensilsCrossed size={14} />,
  APPOINTMENT: <CalendarCheck size={14} />,
  ROOM: <BedDouble size={14} />,
  CONSULTATION: <Stethoscope size={14} />,
  VENUE: <Calendar size={14} />,
}

function normalizeBookingsResponse(
  raw: unknown,
  tab: Tab,
  page: number,
  limit: number,
): BookingsResponse {
  if (Array.isArray(raw)) {
    const filtered = raw.filter(b =>
      tab === 'upcoming' ? isBookingUpcoming(b as BookingRow) : !isBookingUpcoming(b as BookingRow),
    )
    const start = (page - 1) * limit
    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
    }
  }

  const data = raw as Partial<BookingsResponse>
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: data.total ?? 0,
    page: data.page ?? page,
    limit: data.limit ?? limit,
    totalPages: data.totalPages ?? 1,
  }
}

async function fetchBookings(tab: Tab, page: number): Promise<BookingsResponse> {
  const res = await authApiFetch(
    `/bookings/mine?tab=${tab}&page=${page}&limit=${PAGE_SIZE}`,
  )
  if (!res.ok) {
    return { items: [], total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 }
  }
  const raw = await res.json()
  return normalizeBookingsResponse(raw, tab, page, PAGE_SIZE)
}

export default function ProfileBookingsPage() {
  const queryClient = useQueryClient()
  const { ready: authReady, hydrated, isAuthenticated, user } = useRequireAuth('/profile/bookings')
  const [tab, setTab] = useState<Tab>('upcoming')
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)
  const [editingBooking, setEditingBooking] = useState<EditableBooking | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id, tab, page],
    queryFn: () => fetchBookings(tab, page),
    enabled: authReady,
  })

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(1)
    setSelectedBooking(null)
  }

  const cancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await authApiFetch(`/bookings/mine/${id}/cancel`, { method: 'PATCH' })
      if (res.ok) {
        setSelectedBooking(null)
        await queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
        await queryClient.invalidateQueries({ queryKey: ['my-bookings-dashboard'] })
      }
    } finally {
      setCancellingId(null)
    }
  }

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated || !user) return null

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total = data?.total ?? 0

  return (
    <ProfileShell>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2 sm:gap-3">
          <CalendarCheck size={22} className="text-slate-700 shrink-0" strokeWidth={2} />
          Mes réservations
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          {isLoading
            ? 'Chargement…'
            : total === 0
              ? tab === 'upcoming'
                ? 'Aucune réservation à venir.'
                : 'Aucune réservation passée.'
              : `${total} réservation${total > 1 ? 's' : ''}${tab === 'upcoming' ? ' à venir' : ' dans l\'historique'}`}
        </p>
      </div>

      <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 p-1 bg-white border border-slate-200 rounded-2xl w-full sm:w-max">
        {(['upcoming', 'history'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            {t === 'upcoming' ? 'À venir' : 'Historique'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-[24px] sm:rounded-[28px] border border-slate-100 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={26} className="text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-slate-500 font-medium mb-2">
            {tab === 'upcoming' ? 'Aucune réservation à venir.' : 'Aucun historique pour le moment.'}
          </p>
          {tab === 'upcoming' && (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Tables, chambres, rendez-vous ou consultations — tout apparaît ici une fois réservé.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors text-sm"
                style={{ textDecoration: 'none' }}
              >
                Explorer les adresses
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 sm:space-y-4">
            {items.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                onOpen={() => setSelectedBooking(b)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {selectedBooking && (
        <BookingDetailSheet
          booking={selectedBooking}
          tab={tab}
          open={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onEdit={() => setEditingBooking(selectedBooking)}
          onCancel={() => cancel(selectedBooking.id)}
          cancelling={cancellingId === selectedBooking.id}
        />
      )}

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          open={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
            setSelectedBooking(null)
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
            queryClient.invalidateQueries({ queryKey: ['my-bookings-dashboard'] })
          }}
        />
      )}
    </ProfileShell>
  )
}

function BookingCard({
  booking,
  onOpen,
}: {
  booking: BookingRow
  onOpen: () => void
}) {
  const when = getBookingWhenDisplay(booking)
  const meta = getBookingCardMeta(booking)
  const pricing = getBookingPricing(booking)
  const cover = booking.merchant.cover_image || PLACEHOLDER_COVER

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-left bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-5 border border-slate-100 shadow-sm hover:border-amber-200 hover:shadow-md transition-all active:scale-[0.99]"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cover}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
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
                {booking.merchant.business_name}
              </h3>
            </div>
            <ChevronRight size={18} className="text-slate-300 shrink-0 mt-1" aria-hidden />
          </div>

          <p className="text-xs sm:text-sm font-semibold text-slate-700 line-clamp-2 leading-snug">
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

          {(booking.booking_type === 'TABLE' || booking.booking_type === 'ROOM') && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-1 sm:hidden">
              <Users size={11} /> {booking.party_size} pers.
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (p: number) => void
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs sm:text-sm text-slate-500 font-medium text-center sm:text-left">
        {total} réservation{total > 1 ? 's' : ''} · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> <span className="hidden xs:inline">Préc.</span>
        </button>
        <div className="flex items-center gap-1">
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            const showEllipsis = prev !== undefined && p - prev > 1
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
                    p === page
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              </span>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden xs:inline">Suiv.</span> <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
