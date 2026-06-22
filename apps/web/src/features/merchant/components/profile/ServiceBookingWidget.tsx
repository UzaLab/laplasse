'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Loader2 } from 'lucide-react'
import { createMerchantBooking } from '@/lib/bookingApi'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import type { BookingSettingsConfig, MerchantServiceConfig, StaffMemberConfig } from '@/lib/bookingConfig'
import { formatPrice, staffForService } from '@/lib/bookingConfig'
import { computeBookingPaymentPreview, bookingPaymentFootnote } from '@/lib/bookingPaymentDisplay'

interface Props {
  merchantId: string
  merchantName: string
  merchantSlug: string
  categorySlug: string
  service: MerchantServiceConfig
  staff?: StaffMemberConfig[]
  bookingSettings?: BookingSettingsConfig | null
  bookingEnabled?: boolean
  bookingType?: 'APPOINTMENT' | 'CONSULTATION'
}

interface Slot {
  time: string
  available: boolean
  remaining?: number
}

export function ServiceBookingWidget({
  merchantId,
  merchantName,
  merchantSlug,
  categorySlug,
  service,
  staff = [],
  bookingSettings,
  bookingEnabled = true,
  bookingType = 'APPOINTMENT',
}: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [staffId, setStaffId] = useState(service.staff_id ?? '')
  const [guestName, setGuestName] = useState(user?.full_name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState(user?.email ?? '')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const paymentPreview = useMemo(
    () => computeBookingPaymentPreview(service.price, bookingSettings),
    [service.price, bookingSettings],
  )

  const eligibleStaff = useMemo(() => staffForService(staff, service.id), [staff, service.id])

  useEffect(() => {
    if (user) {
      setGuestName(n => n || user.full_name || '')
      setGuestEmail(e => e || user.email || '')
    }
  }, [user])

  useEffect(() => {
    if (staffId && !eligibleStaff.some(s => s.id === staffId)) {
      setStaffId('')
    }
  }, [staffId, eligibleStaff])

  useEffect(() => {
    if (!date || !bookingEnabled) return
    setSlotsLoading(true)
    const params = new URLSearchParams({ date, serviceId: service.id })
    if (staffId) params.set('staffId', staffId)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/availability?${params}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.slots ?? [])
        setSelectedSlot('')
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [date, merchantId, service.id, staffId, bookingEnabled])

  const handleSubmit = async () => {
    if (!bookingEnabled) {
      setError('Les réservations ne sont pas disponibles')
      return
    }
    if (!date || !selectedSlot) {
      setError('Choisissez une date et un créneau')
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setError('Nom et téléphone obligatoires')
      return
    }
    if (paymentPreview?.requirePayment && !isAuthenticated) {
      setError('Connectez-vous pour payer votre réservation')
      return
    }
    setLoading(true)
    setError('')
    try {
      const bookedAt = new Date(`${date}T${selectedSlot}:00`).toISOString()
      const res = await createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        booked_at: bookedAt,
        service_id: service.id,
        staff_id: staffId || undefined,
        booking_type: bookingType,
        notes: notes.trim() || undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur'))
        setLoading(false)
        return
      }
      if (data.payment_required && data.payment?.id) {
        router.push(`/bookings/pay?bookingId=${data.id}`)
        return
      }
      setSuccess(true)
      if (isAuthenticated) {
        void queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      }
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center">
        <p className="font-bold text-emerald-800">Demande envoyée !</p>
        <p className="text-sm text-emerald-600 mt-1">{merchantName} confirmera votre rendez-vous.</p>
        {isAuthenticated && (
          <Link href="/profile/bookings" className="text-sm font-bold text-emerald-700 underline mt-3 inline-block">
            Voir mes réservations
          </Link>
        )}
      </div>
    )
  }

  const ctaLabel = categorySlug === 'pharmacies' ? 'Prendre rendez-vous' : 'Réserver cette prestation'

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50 sticky top-28">
      <p className="text-2xl font-extrabold text-slate-900 mb-1">
        {service.price != null && service.price > 0 ? formatPrice(service.price) : 'Sur devis'}
      </p>
      {service.duration_min > 0 && (
        <p className="text-sm text-slate-500 mb-4 flex items-center gap-1.5">
          <Clock size={14} /> {service.duration_min} min
        </p>
      )}

      {paymentPreview?.requirePayment && paymentPreview.dueNow > 0 && (
        <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm mb-4">
          <div className="flex justify-between text-brand-800">
            <span>À payer ({paymentPreview.depositPercent} %)</span>
            <span className="font-extrabold">{formatPrice(paymentPreview.dueNow)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {eligibleStaff.length > 0 && (
          <select
            value={staffId}
            onChange={e => setStaffId(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          >
            <option value="">Praticien (optionnel — attribution automatique)</option>
            {eligibleStaff.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        {date && (
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">Créneaux disponibles</p>
            {slotsLoading ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : slots.filter(s => s.available).length === 0 ? (
              <p className="text-sm text-slate-400">Aucun créneau ce jour</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.filter(s => s.available).map(s => (
                  <button
                    key={s.time}
                    type="button"
                    onClick={() => setSelectedSlot(s.time)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                      selectedSlot === s.time
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:border-brand-400'
                    }`}
                  >
                    {s.time}
                    {(s.remaining ?? 0) > 1 && (
                      <span className="text-[10px] ml-1 opacity-70">({s.remaining})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <input
          placeholder="Nom complet *"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <input
          placeholder="Téléphone *"
          value={guestPhone}
          onChange={e => setGuestPhone(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-400"
        />
        <textarea
          placeholder="Notes (optionnel)"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-brand-400"
        />
      </div>

      {error && <p className="text-sm text-red-600 font-medium mb-3">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={loading || !bookingEnabled}
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-brand-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {ctaLabel}
      </button>

      <p className="text-center text-xs text-slate-400 font-medium mt-4">
        {bookingPaymentFootnote(paymentPreview)}
      </p>

      <Link
        href={`/m/${merchantSlug}?tab=${categorySlug === 'pharmacies' ? 'prestations' : 'prestations'}#profile-tabs`}
        className="block text-center text-xs font-bold text-brand-600 hover:text-brand-700 mt-4"
        style={{ textDecoration: 'none' }}
      >
        Retour à la fiche établissement
      </Link>
    </div>
  )
}
