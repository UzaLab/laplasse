'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, XCircle, ExternalLink } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { useAuthStore } from '@/stores/authStore'
import { BOOKING_TYPE_LABELS, type BookingType } from '@/lib/bookingConfig'

interface BookingRow {
  id: string
  booking_type: BookingType
  booked_at: string
  check_out_at?: string | null
  party_size: number
  status: string
  notes?: string | null
  merchant: { business_name: string; slug: string }
  service?: { name: string } | null
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absent',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
  NO_SHOW: 'bg-red-100 text-red-700',
}

export default function ProfileBookingsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    authApiFetch('/bookings/mine')
      .then(r => r.ok ? r.json() : [])
      .then(setBookings)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/profile/bookings')
      return
    }
    load()
  }, [isAuthenticated, router])

  const cancel = async (id: string) => {
    const res = await authApiFetch(`/bookings/mine/${id}/cancel`, { method: 'PATCH' })
    if (res.ok) load()
  }

  const upcoming = bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status) && new Date(b.booked_at) >= new Date())
  const past = bookings.filter(b => !upcoming.includes(b))

  return (
    <ProfileShell>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-1 flex items-center gap-2">
          <Calendar size={22} className="text-amber-500" /> Mes réservations
        </h1>
        <p className="text-slate-500 text-sm mb-8">Suivez vos tables, rendez-vous et séjours</p>

        {loading ? (
          <div className="flex justify-center py-12 text-slate-400">
            <Loader2 size={24} className="animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center">
            <Calendar size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700">Aucune réservation</p>
            <Link href="/search" className="text-sm font-bold text-amber-600 mt-2 inline-block">Explorer Abidjan</Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">À venir</h2>
                <div className="space-y-3">
                  {upcoming.map(b => (
                    <BookingCard key={b.id} booking={b} onCancel={() => cancel(b.id)} />
                  ))}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Historique</h2>
                <div className="space-y-3">
                  {past.map(b => (
                    <BookingCard key={b.id} booking={b} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </ProfileShell>
  )
}

function BookingCard({ booking, onCancel }: { booking: BookingRow; onCancel?: () => void }) {
  const dt = new Date(booking.booked_at)
  const canCancel = onCancel && ['PENDING', 'CONFIRMED'].includes(booking.status)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-extrabold text-slate-900">{booking.merchant.business_name}</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {BOOKING_TYPE_LABELS[booking.booking_type]} · {dt.toLocaleDateString('fr-FR')} à {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          {booking.service && <p className="text-xs text-slate-400 mt-1">{booking.service.name}</p>}
          {booking.check_out_at && (
            <p className="text-xs text-slate-400">Départ : {new Date(booking.check_out_at).toLocaleDateString('fr-FR')}</p>
          )}
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${STATUS_COLORS[booking.status] ?? 'bg-slate-100'}`}>
          {STATUS_LABELS[booking.status] ?? booking.status}
        </span>
      </div>
      <div className="flex gap-3 mt-4">
        <Link
          href={`/m/${booking.merchant.slug}`}
          className="text-xs font-bold text-slate-600 flex items-center gap-1 hover:text-amber-600"
        >
          <ExternalLink size={12} /> Voir l&apos;établissement
        </Link>
        {canCancel && (
          <button
            onClick={onCancel}
            className="text-xs font-bold text-red-500 flex items-center gap-1 hover:text-red-700"
          >
            <XCircle size={12} /> Annuler
          </button>
        )}
      </div>
    </div>
  )
}
