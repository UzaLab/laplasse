'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader2, Check, X, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

interface Booking {
  id: string
  guest_name: string
  guest_phone: string
  guest_email: string | null
  booked_at: string
  party_size: number
  notes: string | null
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW: 'Absent',
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CONFIRMED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
  COMPLETED: 'bg-slate-50 text-slate-600 border-slate-200',
  NO_SHOW: 'bg-red-50 text-red-700 border-red-200',
}

export default function MerchantBookingsPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    const res = await merchantApiFetch('/bookings/merchant', activeMerchantId)
    if (res.ok) setBookings(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    if (hydrated && !isAuthenticated) { router.push('/login?redirect=/merchant/bookings'); return }
    fetchBookings()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const updateStatus = async (id: string, status: string) => {
    setProcessing(id)
    await merchantApiFetch(`/bookings/${id}/status`, activeMerchantId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await fetchBookings()
    setProcessing(null)
  }

  if (hydrated && !isAuthenticated) return null

  return (
    <MerchantShell>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          <Calendar size={22} className="text-amber-500" /> Réservations
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Gérez les demandes de réservation de votre établissement.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-[28px] border border-slate-100">
          <Calendar size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Aucune réservation</p>
          <p className="text-sm text-slate-400 mt-1">Les demandes apparaîtront ici dès qu&apos;un client réserve.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(b => (
            <div key={b.id} className="bg-white border border-slate-100 rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-extrabold text-slate-900">{b.guest_name}</p>
                  <p className="text-sm text-slate-500">{b.guest_phone}</p>
                  <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(b.booked_at).toLocaleString('fr-FR')} · {b.party_size} pers.
                  </p>
                  {b.notes && <p className="text-sm text-slate-600 mt-2 italic">&ldquo;{b.notes}&rdquo;</p>}
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[b.status] ?? ''}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>

              {b.status === 'PENDING' && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button
                    disabled={processing === b.id}
                    onClick={() => updateStatus(b.id, 'CONFIRMED')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-60"
                  >
                    <Check size={14} /> Confirmer
                  </button>
                  <button
                    disabled={processing === b.id}
                    onClick={() => updateStatus(b.id, 'CANCELLED')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 disabled:opacity-60"
                  >
                    <X size={14} /> Refuser
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </MerchantShell>
  )
}
