'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Calendar, Loader2, Users, Clock, MapPin } from 'lucide-react'
import { createMerchantBooking } from '@/lib/bookingApi'
import { BOOKING_PREFILL_EVENT, type BookingPrefillDetail } from '@/lib/bookingPrefill'
import { useAuthStore } from '@/stores/authStore'
import { useQueryClient } from '@tanstack/react-query'
import type { BookingConfig } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS, formatPrice } from '@/lib/bookingConfig'

interface BookingFormProps {
  merchantId: string
  merchantName: string
}

interface Slot {
  time: string
  available: boolean
  remaining?: number
}

export function BookingForm({ merchantId, merchantName }: BookingFormProps) {
  const { user, isAuthenticated } = useAuthStore()
  const queryClient = useQueryClient()
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')
  const [form, setForm] = useState({
    guest_name: user?.full_name ?? '',
    guest_phone: '',
    guest_email: user?.email ?? '',
    party_size: '2',
    service_id: '',
    staff_id: '',
    room_type: 'Double',
    check_out_date: '',
    notes: '',
  })

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/config`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setConfig(d))
      .catch(() => setConfig(null))
  }, [merchantId])

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        guest_name: f.guest_name || user.full_name || '',
        guest_email: f.guest_email || user.email || '',
      }))
    }
  }, [user])

  const bookingType = config?.booking_type ?? null
  const isRoom = bookingType === 'ROOM'

  useEffect(() => {
    if (!date || !config?.enabled || isRoom) return
    setSlotsLoading(true)
    const params = new URLSearchParams({ date })
    if (form.service_id) params.set('serviceId', form.service_id)
    if (form.staff_id) params.set('staffId', form.staff_id)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/availability?${params}`)
      .then(r => r.json())
      .then(d => {
        setSlots(d.slots ?? [])
        setSelectedSlot('')
      })
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [date, merchantId, form.service_id, form.staff_id, config?.enabled, isRoom])

  useEffect(() => {
    if (!config || bookingType !== 'ROOM') return
    const roomOptions = (config.room_services?.length ? config.room_services : config.services.filter(
      s => s.service_kind === 'ROOM_TYPE',
    ))
    if (roomOptions.length && !form.service_id) {
      const first = roomOptions[0]
      setForm(f => ({ ...f, service_id: first.id, room_type: first.name }))
    }
  }, [config, bookingType, form.service_id])

  useEffect(() => {
    const onPrefill = (e: Event) => {
      const detail = (e as CustomEvent<BookingPrefillDetail>).detail
      if (!detail) return
      setForm(f => ({
        ...f,
        ...(detail.serviceId ? { service_id: detail.serviceId } : {}),
        ...(detail.roomType ? { room_type: detail.roomType } : {}),
      }))
      if (detail.checkIn) setDate(detail.checkIn)
      if (detail.checkOut) setForm(f => ({ ...f, check_out_date: detail.checkOut! }))
    }
    window.addEventListener(BOOKING_PREFILL_EVENT, onPrefill)
    return () => window.removeEventListener(BOOKING_PREFILL_EVENT, onPrefill)
  }, [])

  const roomStayTotal = useMemo(() => {
    if (config?.booking_type !== 'ROOM' || !date || !form.check_out_date || !config) return null
    const roomOptions = (config.room_services?.length ? config.room_services : config.services.filter(
      s => s.service_kind === 'ROOM_TYPE',
    )) ?? []
    const selected = config.services.find(s => s.id === form.service_id)
      ?? roomOptions.find(s => s.id === form.service_id)
    if (!selected) return null
    const start = new Date(`${date}T12:00:00`)
    const end = new Date(`${form.check_out_date}T12:00:00`)
    const nights = Math.round((end.getTime() - start.getTime()) / 86400000)
    if (nights <= 0) return null
    const rate = selected.nightly_rate ?? selected.price ?? 0
    return { nights, rate, total: nights * rate }
  }, [config, date, form.check_out_date, form.service_id])

  if (!config) return null
  if (!config.enabled) return null

  const resolvedBookingType = config.booking_type!
  const roomOptions = (config.room_services?.length ? config.room_services : config.services.filter(
    s => s.service_kind === 'ROOM_TYPE',
  )) ?? []
  const hasRoomServices = roomOptions.length > 0
  const selectableServices = config.services.filter(s => {
    if (resolvedBookingType === 'APPOINTMENT') {
      return !s.service_kind || s.service_kind === 'APPOINTMENT'
    }
    if (resolvedBookingType === 'CONSULTATION') {
      return !s.service_kind || s.service_kind === 'CONSULTATION'
    }
    if (resolvedBookingType === 'TABLE') {
      return !s.service_kind || s.service_kind === 'TABLE_MENU'
    }
    return true
  })
  const showServices = selectableServices.length > 0 && (
    resolvedBookingType === 'APPOINTMENT'
    || resolvedBookingType === 'CONSULTATION'
    || resolvedBookingType === 'TABLE'
  )
  const selectedService = config.services.find(s => s.id === form.service_id)
    ?? roomOptions.find(s => s.id === form.service_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isRoom) {
      if (!date || !form.check_out_date) {
        setError('Indiquez les dates d\'arrivée et de départ')
        return
      }
      if (form.check_out_date <= date) {
        setError('La date de départ doit être après l\'arrivée')
        return
      }
    } else if (!selectedSlot) {
      setError('Choisissez un créneau disponible')
      return
    }
    if (
      (resolvedBookingType === 'APPOINTMENT' || resolvedBookingType === 'CONSULTATION')
      && !form.service_id
    ) {
      setError(resolvedBookingType === 'CONSULTATION'
        ? 'Choisissez une consultation'
        : 'Choisissez une prestation')
      return
    }
    setLoading(true)
    setError('')
    try {
      const bookedAt = isRoom
        ? new Date(`${date}T14:00:00`).toISOString()
        : new Date(`${date}T${selectedSlot}:00`).toISOString()
      const checkOut = isRoom && form.check_out_date
        ? new Date(`${form.check_out_date}T11:00:00`).toISOString()
        : undefined

      const res = await createMerchantBooking(merchantId, {
        guest_name: form.guest_name,
        guest_phone: form.guest_phone,
        guest_email: form.guest_email || undefined,
        booked_at: bookedAt,
        check_out_at: checkOut,
        party_size: Number(form.party_size),
        service_id: form.service_id || undefined,
        staff_id: form.staff_id || undefined,
        room_type: isRoom ? form.room_type : undefined,
        booking_type: resolvedBookingType,
        notes: form.notes || undefined,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur'))
        setLoading(false)
        return
      }
      setSuccess(true)
      if (isAuthenticated) {
        void queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
        void queryClient.invalidateQueries({ queryKey: ['my-bookings-dashboard'] })
      }
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-[32px] p-6 text-center">
        <Calendar size={28} className="text-emerald-600 mx-auto mb-2" />
        <p className="font-bold text-emerald-800">Demande envoyée !</p>
        <p className="text-sm text-emerald-600 mt-1">
          {merchantName} confirmera votre {BOOKING_TYPE_LABELS[resolvedBookingType].toLowerCase()} sous peu.
        </p>
        {isAuthenticated && (
          <Link href="/profile/bookings" className="text-sm font-bold text-emerald-700 underline mt-3 inline-block">
            Voir mes réservations
          </Link>
        )}
        {!isAuthenticated && (
          <p className="text-xs text-slate-500 mt-3">
            <Link href="/login" className="font-bold text-emerald-700 underline">Connectez-vous</Link>
            {' '}pour retrouver vos réservations dans votre profil.
          </p>
        )}
      </div>
    )
  }

  return (
    <div id="reservation" className="scroll-mt-28 bg-white border border-slate-200 p-6 rounded-[32px] shadow-xl shadow-slate-200/50">
      <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
        <Calendar size={18} className="text-amber-500" /> {config.cta}
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        {isRoom
          ? 'Séjour — disponibilité par nuit, confirmation par l\'établissement'
          : `${BOOKING_TYPE_LABELS[resolvedBookingType]} — créneaux selon horaires d'ouverture`}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {showServices && (
          <select
            required={resolvedBookingType === 'APPOINTMENT' || resolvedBookingType === 'CONSULTATION'}
            value={form.service_id}
            onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          >
            <option value="">
              {resolvedBookingType === 'TABLE' ? 'Menu / formule (optionnel)' : 'Choisir une prestation *'}
            </option>
            {selectableServices.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.duration_min ? ` (${s.duration_min} min)` : ''}
                {s.price != null ? ` — ${formatPrice(s.price)}` : ''}
              </option>
            ))}
          </select>
        )}

        {resolvedBookingType === 'APPOINTMENT' && config.staff.length > 0 && (
          <select
            value={form.staff_id}
            onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          >
            <option value="">Prestataire (optionnel)</option>
            {config.staff.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.role ? ` — ${s.role}` : ''}</option>
            ))}
          </select>
        )}

        {isRoom && (
          hasRoomServices ? (
            <select
              required
              value={form.service_id}
              onChange={e => {
                const svc = roomOptions.find(s => s.id === e.target.value)
                setForm(f => ({
                  ...f,
                  service_id: e.target.value,
                  room_type: svc?.name ?? f.room_type,
                }))
              }}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              {roomOptions.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.price != null ? ` — ${formatPrice(r.price)}/nuit` : ''}
                  {r.capacity && r.capacity > 1 ? ` (${r.capacity} dispo.)` : ''}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={form.room_type}
              onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
            >
              {config.room_types.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )
        )}

        {selectedService?.price != null && (
          <p className="text-sm font-bold text-amber-700 bg-amber-50 rounded-xl px-4 py-2">
            Tarif indicatif : {formatPrice(selectedService.price)}
            {isRoom ? ' / nuit' : ''}
          </p>
        )}

        <input
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          value={date}
          onChange={e => setDate(e.target.value)}
          aria-label={isRoom ? 'Date d\'arrivée' : 'Date'}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
        />

        {isRoom && (
          <input
            type="date"
            required
            min={date || new Date().toISOString().slice(0, 10)}
            value={form.check_out_date}
            onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))}
            aria-label="Date de départ"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
          />
        )}

        {roomStayTotal && (
          <div className="rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm">
            <p className="font-bold text-brand-900">
              {roomStayTotal.nights} nuit{roomStayTotal.nights > 1 ? 's' : ''} ·{' '}
              {formatPrice(roomStayTotal.total)}
            </p>
            <p className="text-xs text-brand-700 mt-0.5">
              {formatPrice(roomStayTotal.rate)} / nuit (estimation)
            </p>
          </div>
        )}

        {!isRoom && date && (
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
              <Clock size={12} /> Créneaux disponibles
            </p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" /> Chargement…
              </div>
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
                        : 'border-slate-200 text-slate-700 hover:border-amber-400'
                    }`}
                  >
                    {s.time}
                    {s.remaining !== undefined && resolvedBookingType === 'TABLE' && (
                      <span className="text-[10px] ml-1 opacity-70">({s.remaining})</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <input
          type="text"
          required
          placeholder="Votre nom *"
          value={form.guest_name}
          onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
        />
        <input
          type="tel"
          required
          placeholder="Téléphone *"
          value={form.guest_phone}
          onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
        />

        {(resolvedBookingType === 'TABLE' || isRoom) && (
          <div className="relative">
            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              min={1}
              max={20}
              value={form.party_size}
              onChange={e => setForm(f => ({ ...f, party_size: e.target.value }))}
              className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-400"
              placeholder="Nombre de personnes"
            />
          </div>
        )}

        <textarea
          placeholder="Notes (optionnel)"
          rows={2}
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-amber-400"
        />

        {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : config.cta}
        </button>

        {!isAuthenticated && (
          <p className="text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
            <MapPin size={10} /> Connexion optionnelle — <Link href="/login" className="underline">se connecter</Link>
          </p>
        )}
      </form>
    </div>
  )
}
