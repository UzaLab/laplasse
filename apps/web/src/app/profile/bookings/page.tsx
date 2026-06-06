'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  CalendarCheck, Calendar, Clock, Users, Loader2, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { EditBookingModal, type EditableBooking } from '@/features/profile/components/EditBookingModal'
import { useAuthStore } from '@/stores/authStore'
import type { BookingType } from '@/lib/bookingConfig'

interface BookingRow {
  id: string
  booking_type: BookingType
  booked_at: string
  check_out_at?: string | null
  party_size: number
  status: string
  guest_name: string
  guest_phone: string
  guest_email?: string | null
  notes?: string | null
  service_id?: string | null
  staff_id?: string | null
  room_type?: string | null
  merchant: { id: string; business_name: string; slug: string; cover_image?: string | null }
  service?: { id: string; name: string } | null
  staff?: { id: string; name: string } | null
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absent',
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border-slate-200',
  NO_SHOW: 'bg-red-50 text-red-600 border-red-200',
}

const PLACEHOLDER_COVER =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=400'

function isUpcoming(booking: BookingRow) {
  return (
    ['PENDING', 'CONFIRMED'].includes(booking.status) &&
    new Date(booking.booked_at) >= new Date()
  )
}

/** Compatible ancienne API (tableau) et nouvelle API (objet paginé). */
function normalizeBookingsResponse(
  raw: unknown,
  tab: Tab,
  page: number,
  limit: number,
): BookingsResponse {
  if (Array.isArray(raw)) {
    const filtered = raw.filter(b =>
      tab === 'upcoming' ? isUpcoming(b) : !isUpcoming(b),
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
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated, user, access_token } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState<Tab>('upcoming')
  const [page, setPage] = useState(1)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [editingBooking, setEditingBooking] = useState<EditableBooking | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login?redirect=/profile/bookings')
    }
  }, [mounted, isAuthenticated, router])

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id, tab, page],
    queryFn: () => fetchBookings(tab, page),
    enabled: !!(mounted && isAuthenticated && access_token),
  })

  const switchTab = (next: Tab) => {
    setTab(next)
    setPage(1)
  }

  const cancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await authApiFetch(`/bookings/mine/${id}/cancel`, { method: 'PATCH' })
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
        await queryClient.invalidateQueries({ queryKey: ['my-bookings-dashboard'] })
      }
    } finally {
      setCancellingId(null)
    }
  }

  if (!mounted) {
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
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <CalendarCheck size={24} className="text-slate-700" strokeWidth={2} />
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

      <div className="flex gap-2 mb-8 p-1 bg-white border border-slate-200 rounded-2xl w-max">
        {(['upcoming', 'history'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => switchTab(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
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
        <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CalendarCheck size={28} className="text-slate-300" strokeWidth={1.5} />
          </div>
          <p className="text-slate-500 font-medium mb-2">
            {tab === 'upcoming' ? 'Aucune réservation à venir.' : 'Aucun historique pour le moment.'}
          </p>
          {tab === 'upcoming' && (
            <>
              <p className="text-sm text-slate-400 mb-4">
                Consultez l&apos;onglet Historique si vos réservations sont passées.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors text-sm"
                style={{ textDecoration: 'none' }}
              >
                Explorer les adresses
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {items.map(b => (
              <BookingCard
                key={b.id}
                booking={b}
                tab={tab}
                cancelling={cancellingId === b.id}
                onCancel={() => cancel(b.id)}
                onEdit={() => setEditingBooking(b)}
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

      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          open={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          onSuccess={() => {
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
  tab,
  cancelling,
  onCancel,
  onEdit,
}: {
  booking: BookingRow
  tab: Tab
  cancelling: boolean
  onCancel: () => void
  onEdit: () => void
}) {
  const dt = new Date(booking.booked_at)
  const canEdit =
    tab === 'upcoming' && ['PENDING', 'CONFIRMED'].includes(booking.status)
  const canCancel = canEdit
  const cover = booking.merchant.cover_image || PLACEHOLDER_COVER

  return (
    <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-amber-200 transition-colors">
      <div className="w-full md:w-40 h-32 md:h-auto rounded-2xl overflow-hidden shrink-0 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cover}
          alt={booking.merchant.business_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-3 mb-2">
          <h3 className="text-xl font-extrabold text-slate-900 truncate">
            {booking.merchant.business_name}
          </h3>
          <span
            className={`px-3 py-1 text-xs font-bold rounded-lg border shrink-0 ${
              STATUS_STYLES[booking.status] ?? 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            {STATUS_LABELS[booking.status] ?? booking.status}
          </span>
        </div>

        {booking.service && (
          <p className="text-sm text-slate-400 font-medium mb-2">{booking.service.name}</p>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-slate-500 font-medium mb-4">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} className="text-amber-500 shrink-0" />
            {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} className="text-amber-500 shrink-0" />
            {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={16} className="text-amber-500 shrink-0" />
            {booking.party_size} pers.
          </span>
        </div>

        {booking.check_out_at && (
          <p className="text-xs text-slate-400 mb-4">
            Départ :{' '}
            {new Date(booking.check_out_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}

        {tab === 'upcoming' && (canEdit || canCancel) && (
          <div className="flex flex-wrap gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="text-sm font-bold text-slate-600 hover:text-slate-900 border border-slate-200 px-4 py-2 rounded-xl transition-colors"
              >
                Modifier
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={cancelling}
                className="text-sm font-bold text-red-600 hover:text-red-700 border border-red-100 bg-red-50 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Annulation…' : 'Annuler'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-sm text-slate-500 font-medium">
        {total} réservation{total > 1 ? 's' : ''} · page {page}/{totalPages}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Préc.
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
          Suiv. <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
