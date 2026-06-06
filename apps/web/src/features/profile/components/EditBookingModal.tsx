'use client'

import { useEffect, useState } from 'react'
import { X, Calendar, Clock, Users, Loader2 } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import type { BookingConfig, BookingType } from '@/lib/bookingConfig'
import { BOOKING_TYPE_LABELS } from '@/lib/bookingConfig'

export interface EditableBooking {
  id: string
  booking_type: BookingType
  booked_at: string
  check_out_at?: string | null
  party_size: number
  guest_name: string
  guest_phone: string
  guest_email?: string | null
  notes?: string | null
  service_id?: string | null
  staff_id?: string | null
  room_type?: string | null
  merchant: { id: string; business_name: string }
  service?: { id: string; name: string } | null
}

interface Slot {
  time: string
  available: boolean
  remaining?: number
}

interface Props {
  booking: EditableBooking
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function toDateInput(iso: string) {
  return new Date(iso).toISOString().slice(0, 10)
}

function toTimeInput(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function EditBookingModal({ booking, open, onClose, onSuccess }: Props) {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [date, setDate] = useState(toDateInput(booking.booked_at))
  const [slots, setSlots] = useState<Slot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(toTimeInput(booking.booked_at))
  const [form, setForm] = useState({
    guest_name: booking.guest_name,
    guest_phone: booking.guest_phone,
    guest_email: booking.guest_email ?? '',
    party_size: String(booking.party_size),
    service_id: booking.service_id ?? '',
    staff_id: booking.staff_id ?? '',
    room_type: booking.room_type ?? 'Double',
    check_out_date: booking.check_out_at ? toDateInput(booking.check_out_at) : '',
    notes: booking.notes ?? '',
  })

  useEffect(() => {
    if (!open) return
    setSuccess(false)
    setError('')
    setDate(toDateInput(booking.booked_at))
    setSelectedSlot(toTimeInput(booking.booked_at))
    setForm({
      guest_name: booking.guest_name,
      guest_phone: booking.guest_phone,
      guest_email: booking.guest_email ?? '',
      party_size: String(booking.party_size),
      service_id: booking.service_id ?? '',
      staff_id: booking.staff_id ?? '',
      room_type: booking.room_type ?? 'Double',
      check_out_date: booking.check_out_at ? toDateInput(booking.check_out_at) : '',
      notes: booking.notes ?? '',
    })
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${booking.merchant.id}/config`)
      .then(r => r.ok ? r.json() : null)
      .then(setConfig)
      .catch(() => setConfig(null))
  }, [open, booking])

  const bookingType = booking.booking_type
  const isRoom = bookingType === 'ROOM'

  useEffect(() => {
    if (!open || !date || !config?.enabled) return
    setSlotsLoading(true)
    const params = new URLSearchParams({ date })
    if (form.service_id) params.set('serviceId', form.service_id)
    if (form.staff_id) params.set('staffId', form.staff_id)
    params.set('excludeBookingId', booking.id)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${booking.merchant.id}/availability?${params}`)
      .then(r => r.json())
      .then(d => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [open, date, booking.merchant.id, form.service_id, form.staff_id, config?.enabled])

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isRoom && !selectedSlot) {
      setError('Choisissez un créneau disponible')
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

      const res = await authApiFetch(`/bookings/mine/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: form.guest_name,
          guest_phone: form.guest_phone,
          guest_email: form.guest_email || undefined,
          booked_at: bookedAt,
          check_out_at: checkOut,
          party_size: Number(form.party_size),
          service_id: form.service_id || undefined,
          staff_id: form.staff_id || undefined,
          room_type: isRoom ? form.room_type : undefined,
          notes: form.notes || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(Array.isArray(data.message) ? data.message.join(', ') : (data.message ?? 'Erreur'))
        return
      }
      setSuccess(true)
      onSuccess()
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-booking-title"
        className="relative bg-white w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100"
      >
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="edit-booking-title" className="text-lg font-extrabold text-slate-900">
              Modifier la réservation
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{booking.merchant.business_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <Calendar size={32} className="text-amber-500 mx-auto mb-3" />
              <p className="font-extrabold text-slate-900">Demande mise à jour</p>
              <p className="text-sm text-slate-500 mt-2">
                Votre modification a été enregistrée. Le marchand doit valider votre nouvelle demande.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-6 w-full py-3 bg-slate-900 text-white font-bold rounded-2xl"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
                Toute modification repasse en statut <strong>En attente</strong> jusqu&apos;à validation par le marchand.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {BOOKING_TYPE_LABELS[bookingType]}
                </p>

                {bookingType === 'APPOINTMENT' && config && config.services.length > 0 && (
                  <select
                    required
                    value={form.service_id}
                    onChange={e => setForm(f => ({ ...f, service_id: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="">Choisir une prestation *</option>
                    {config.services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration_min} min)
                      </option>
                    ))}
                  </select>
                )}

                {bookingType === 'APPOINTMENT' && config && config.staff.length > 0 && (
                  <select
                    value={form.staff_id}
                    onChange={e => setForm(f => ({ ...f, staff_id: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    <option value="">Prestataire (optionnel)</option>
                    {config.staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}

                {isRoom && config && (
                  <select
                    value={form.room_type}
                    onChange={e => setForm(f => ({ ...f, room_type: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                  >
                    {config.room_types.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                )}

                <input
                  type="date"
                  required
                  min={new Date().toISOString().slice(0, 10)}
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                />

                {isRoom && (
                  <input
                    type="date"
                    required
                    min={date || new Date().toISOString().slice(0, 10)}
                    value={form.check_out_date}
                    onChange={e => setForm(f => ({ ...f, check_out_date: e.target.value }))}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-400"
                  />
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
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.filter(s => s.available || s.time === selectedSlot).map(s => (
                          <button
                            key={s.time}
                            type="button"
                            disabled={!s.available && s.time !== selectedSlot}
                            onClick={() => setSelectedSlot(s.time)}
                            className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors disabled:opacity-40 ${
                              selectedSlot === s.time
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'border-slate-200 text-slate-700 hover:border-amber-400'
                            }`}
                          >
                            {s.time}
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

                {(bookingType === 'TABLE' || isRoom) && (
                  <div className="relative">
                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={form.party_size}
                      onChange={e => setForm(f => ({ ...f, party_size: e.target.value }))}
                      className="w-full border-2 border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-amber-400"
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
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Resoumettre la demande'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
