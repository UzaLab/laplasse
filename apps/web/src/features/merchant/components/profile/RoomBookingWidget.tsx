'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronDown, Loader2 } from 'lucide-react'
import { createMerchantBooking } from '@/lib/bookingApi'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { computeStayPricing, getMinStayNights } from '@/lib/roomPricing'
import { getRoomMaxGuests } from '@/lib/roomListingConfig'

interface Props {
  merchantId: string
  merchantName: string
  merchantSlug: string
  room: MerchantServiceConfig
  bookingSettings?: BookingSettingsConfig | null
  bookingEnabled?: boolean
}

export function RoomBookingWidget({
  merchantId,
  merchantName,
  merchantSlug,
  room,
  bookingSettings,
  bookingEnabled = true,
}: Props) {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [partySize, setPartySize] = useState('2')
  const [guestName, setGuestName] = useState(user?.full_name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState(user?.email ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)

  const maxGuests = getRoomMaxGuests(room) ?? 4
  const rate = room.nightly_rate ?? room.price

  useEffect(() => {
    if (user) {
      setGuestName(n => n || user.full_name || '')
      setGuestEmail(e => e || user.email || '')
    }
  }, [user])

  const staySummary = useMemo(() => {
    if (!checkIn || !checkOut) return null
    return computeStayPricing(room, checkIn, checkOut)
  }, [room, checkIn, checkOut])

  const todayStr = useMemo(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }, [])

  const handleSubmit = async () => {
    if (!bookingEnabled) {
      setError('Les réservations ne sont pas disponibles pour cet établissement')
      return
    }
    if (!checkIn || !checkOut) {
      setError('Sélectionnez vos dates d\'arrivée et de départ')
      return
    }
    if (checkOut <= checkIn) {
      setError('La date de départ doit être après l\'arrivée')
      return
    }
    const minStay = getMinStayNights(room)
    if (staySummary && staySummary.nights < minStay) {
      setError(`Séjour minimum : ${minStay} nuit${minStay > 1 ? 's' : ''}`)
      return
    }
    if (Number(partySize) > maxGuests) {
      setError(`Maximum ${maxGuests} voyageur${maxGuests > 1 ? 's' : ''} pour cette chambre`)
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      setShowGuestForm(true)
      setError('Nom et téléphone requis')
      return
    }
    if (bookingSettings?.require_payment && staySummary?.total && !isAuthenticated) {
      setError('Connectez-vous pour réserver avec paiement')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        booked_at: new Date(`${checkIn}T14:00:00`).toISOString(),
        check_out_at: new Date(`${checkOut}T11:00:00`).toISOString(),
        party_size: Number(partySize),
        service_id: room.id,
        room_type: room.name,
        booking_type: 'ROOM',
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
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-[32px] text-center">
        <Calendar size={28} className="text-emerald-600 mx-auto mb-2" />
        <p className="font-bold text-emerald-800">Demande envoyée !</p>
        <p className="text-sm text-emerald-600 mt-1">
          {merchantName} confirmera votre séjour sous peu.
        </p>
        {isAuthenticated ? (
          <Link href="/profile/bookings" className="text-sm font-bold text-emerald-700 underline mt-3 inline-block">
            Voir mes réservations
          </Link>
        ) : (
          <p className="text-xs text-slate-500 mt-3">
            <Link href="/login" className="font-bold text-emerald-700 underline">Connectez-vous</Link>
            {' '}pour retrouver vos réservations.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
      {rate != null && (
        <div className="mb-6 flex items-end gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {formatPrice(rate).replace(' F', '')}
            <span className="text-xl"> FCFA</span>
          </span>
          <span className="text-slate-500 font-medium mb-1">/ nuit</span>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <label className="bg-slate-50 border border-slate-200 p-3 rounded-2xl cursor-pointer hover:border-brand-300 transition-colors block">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Arrivée</p>
            <input
              type="date"
              min={todayStr}
              value={checkIn}
              onChange={e => {
                setCheckIn(e.target.value)
                if (checkOut && e.target.value >= checkOut) setCheckOut('')
              }}
              className="w-full bg-transparent font-bold text-slate-900 text-sm outline-none cursor-pointer"
            />
          </label>
          <label className="bg-slate-50 border border-slate-200 p-3 rounded-full cursor-pointer hover:border-brand-300 transition-colors block">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Départ</p>
            <input
              type="date"
              min={checkIn || todayStr}
              value={checkOut}
              disabled={!checkIn}
              onChange={e => setCheckOut(e.target.value)}
              className="w-full bg-transparent font-bold text-slate-900 text-sm outline-none cursor-pointer disabled:opacity-50"
            />
          </label>
        </div>

        <label className="flex items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-full cursor-pointer hover:border-brand-300 transition-colors">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Voyageurs</p>
            <select
              value={partySize}
              onChange={e => setPartySize(e.target.value)}
              className="bg-transparent font-bold text-slate-900 text-sm outline-none cursor-pointer"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map(n => (
                <option key={n} value={String(n)}>
                  {n} {n === 1 ? 'Adulte' : 'Adultes'}
                </option>
              ))}
            </select>
          </div>
          <ChevronDown className="w-5 h-5 text-slate-400 pointer-events-none" />
        </label>
      </div>

      {staySummary && (
        <>
          <div className="space-y-3 mb-6 pb-6 border-b border-slate-100 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>
                {formatPrice(staySummary.averageNightly)} × {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''}
              </span>
              <span>{formatPrice(staySummary.total)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6 text-lg font-extrabold text-slate-900">
            <span>Total</span>
            <span>{formatPrice(staySummary.total)}</span>
          </div>
        </>
      )}

      {(showGuestForm || !isAuthenticated) && (
        <div className="space-y-3 mb-4">
          <input
            placeholder="Nom complet *"
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            placeholder="Téléphone *"
            value={guestPhone}
            onChange={e => setGuestPhone(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="email"
            placeholder="Email (optionnel)"
            value={guestEmail}
            onChange={e => setGuestEmail(e.target.value)}
            className="w-full border-2 border-slate-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-brand-400"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600 font-medium mb-3">{error}</p>}

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={loading || !bookingEnabled}
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-brand-500 transition-colors shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        Réserver cette chambre
      </button>

      <p className="text-center text-xs text-slate-400 font-medium mt-4">
        {bookingSettings?.require_payment
          ? 'Un acompte peut être demandé à la confirmation.'
          : 'Confirmation par l\'établissement — sans débit immédiat.'}
      </p>

      <Link
        href={`/m/${merchantSlug}?tab=chambres#profile-tabs`}
        className="block text-center text-xs font-bold text-brand-600 hover:text-brand-700 mt-4"
        style={{ textDecoration: 'none' }}
      >
        Voir toutes les chambres de l&apos;hôtel
      </Link>
    </div>
  )
}
