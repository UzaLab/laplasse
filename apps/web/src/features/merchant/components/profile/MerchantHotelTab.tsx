'use client'

import { useEffect, useMemo, useState } from 'react'
import { BedDouble, Calendar, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react'
import type { BookingConfig, MerchantServiceConfig } from '@/lib/bookingConfig'
import { formatPrice } from '@/lib/bookingConfig'
import { computeStayPricing, getMinStayNights } from '@/lib/roomPricing'
import {
  amenityLabel,
  highlightLabel,
  propertyTypeLabel,
  unitTypeLabel,
} from '@/lib/roomListingConfig'
import { openBookingWithPrefill } from '@/lib/bookingPrefill'
import { ImageCarousel } from '@/components/ui/ImageGalleryViewer'

interface DayCell {
  date: string
  available: boolean
  nightly_rate: number | null
}

interface Props {
  merchantId: string
}

function monthRange(year: number, month: number) {
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0)
  return {
    from: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    to: `${year}-${String(month + 1).padStart(2, '0')}-${String(to.getDate()).padStart(2, '0')}`,
    daysInMonth: to.getDate(),
    startWeekday: from.getDay(),
  }
}

function isPastDate(dateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(`${dateStr}T12:00:00`) < today
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const start = new Date(`${checkIn}T12:00:00`)
  const end = new Date(`${checkOut}T12:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86400000)
}

function isNightInStay(date: string, checkIn: string | null, checkOut: string | null): boolean {
  if (!checkIn) return false
  if (!checkOut) return date === checkIn
  return date >= checkIn && date < checkOut
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

export function MerchantHotelTab({ merchantId }: Props) {
  const [config, setConfig] = useState<BookingConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [viewDate, setViewDate] = useState(() => new Date())
  const [days, setDays] = useState<DayCell[]>([])
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [rangeError, setRangeError] = useState('')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const { from, to, daysInMonth, startWeekday } = useMemo(
    () => monthRange(year, month),
    [year, month],
  )

  const rooms = config?.room_services ?? []

  useEffect(() => {
    void fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/config`)
      .then(r => (r.ok ? r.json() : null))
      .then((d: BookingConfig | null) => {
        setConfig(d)
        setSelectedRoomId(d?.room_services?.[0]?.id ?? null)
      })
      .finally(() => setLoading(false))
  }, [merchantId])

  useEffect(() => {
    if (!selectedRoomId) return
    setCalendarLoading(true)
    const qs = new URLSearchParams({ from, to, serviceId: selectedRoomId })
    void fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/bookings/merchant/${merchantId}/room-calendar?${qs}`,
    )
      .then(r => (r.ok ? r.json() : null))
      .then(d => setDays(d?.days ?? []))
      .finally(() => setCalendarLoading(false))
  }, [merchantId, selectedRoomId, from, to])

  useEffect(() => {
    setCheckIn(null)
    setCheckOut(null)
    setRangeError('')
  }, [selectedRoomId])

  const daysByDate = useMemo(
    () => Object.fromEntries(days.map(d => [d.date, d])),
    [days],
  )

  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  const staySummary = useMemo(() => {
    if (!checkIn || !checkOut || !selectedRoom) return null
    const stay = computeStayPricing(selectedRoom, checkIn, checkOut)
    if (!stay) return null
    return { nights: stay.nights, rate: stay.averageNightly, total: stay.total, breakdown: stay.breakdown }
  }, [checkIn, checkOut, selectedRoom])

  const handleDateClick = (dateStr: string, available: boolean) => {
    if (isPastDate(dateStr) || !available) return
    setRangeError('')

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateStr)
      setCheckOut(null)
      return
    }

    if (dateStr <= checkIn) {
      setCheckIn(dateStr)
      setCheckOut(null)
      return
    }

    const nights = nightsBetween(checkIn, dateStr)
    for (let i = 0; i < nights; i++) {
      const d = new Date(`${checkIn}T12:00:00`)
      d.setDate(d.getDate() + i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const info = daysByDate[key]
      if (info && !info.available) {
        setRangeError(`Nuit indisponible le ${key.split('-').reverse().join('/')}`)
        return
      }
    }

    setCheckOut(dateStr)
  }

  const handleReserve = () => {
    if (!selectedRoom) return
    if (!checkIn || !checkOut) {
      setRangeError('Sélectionnez votre date d\'arrivée et de départ sur le calendrier')
      return
    }
    if (nightsBetween(checkIn, checkOut) <= 0) {
      setRangeError('La date de départ doit être après l\'arrivée')
      return
    }
    const minStay = getMinStayNights(selectedRoom)
    const stay = computeStayPricing(selectedRoom, checkIn, checkOut)
    if (stay && stay.nights < minStay) {
      setRangeError(`Séjour minimum : ${minStay} nuit${minStay > 1 ? 's' : ''}`)
      return
    }
    openBookingWithPrefill({
      serviceId: selectedRoom.id,
      roomType: selectedRoom.name,
      checkIn,
      checkOut,
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
        <BedDouble size={40} className="text-slate-200 mx-auto mb-4" />
        <p className="font-bold text-slate-700 mb-1">Chambres bientôt disponibles</p>
        <button
          type="button"
          onClick={() => openBookingWithPrefill({})}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm"
        >
          <Calendar size={16} /> Demander une réservation
        </button>
      </div>
    )
  }

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const calendarCells: Array<{ key: string; day?: number; date?: string }> = []
  for (let i = 0; i < startWeekday; i++) {
    calendarCells.push({ key: `pad-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    calendarCells.push({ key: date, day: d, date })
  }

  return (
    <div className="space-y-8">
      {/* Chambres — défilement horizontal */}
      <div>
        <h3 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2">
          <BedDouble size={18} className="text-brand-500" />
          Nos chambres
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-1 px-1">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              selected={selectedRoomId === room.id}
              onSelect={() => setSelectedRoomId(room.id)}
            />
          ))}
        </div>
      </div>

      {selectedRoomId && (
        <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-brand-500" />
              {MONTH_NAMES[month]} {year}
              {selectedRoom && (
                <span className="text-sm font-semibold text-slate-500 hidden sm:inline">
                  — {selectedRoom.name}
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                aria-label="Mois précédent"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
                aria-label="Mois suivant"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Résumé sélection */}
          <div className="mb-4 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Votre séjour
            </p>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className={`font-semibold ${checkIn ? 'text-slate-900' : 'text-slate-400'}`}>
                Arrivée : {checkIn ? new Date(`${checkIn}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
              </span>
              <span className="text-slate-300 hidden sm:inline">→</span>
              <span className={`font-semibold ${checkOut ? 'text-slate-900' : 'text-slate-400'}`}>
                Départ : {checkOut ? new Date(`${checkOut}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'}
              </span>
              {staySummary && (
                <span className="font-bold text-brand-700 ml-auto">
                  {staySummary.nights} nuit{staySummary.nights > 1 ? 's' : ''} · {formatPrice(staySummary.total)}
                </span>
              )}
            </div>
            {!checkOut && checkIn && (
              <p className="text-xs text-brand-600 mt-2">Choisissez votre date de départ</p>
            )}
            {!checkIn && (
              <p className="text-xs text-slate-400 mt-2">Cliquez sur une date d&apos;arrivée, puis sur une date de départ</p>
            )}
          </div>

          {calendarLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-[10px] font-bold text-slate-400 uppercase mb-2">
                {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(w => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
                {calendarCells.map(cell => {
                  if (!cell.day || !cell.date) {
                    return <div key={cell.key} className="aspect-square" />
                  }
                  const info = daysByDate[cell.date]
                  const available = info?.available ?? false
                  const rate = info?.nightly_rate ?? selectedRoom?.nightly_rate ?? selectedRoom?.price
                  const isPast = isPastDate(cell.date)
                  const inStay = isNightInStay(cell.date, checkIn, checkOut)
                  const isCheckIn = cell.date === checkIn
                  const isCheckOut = cell.date === checkOut

                  return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={isPast || !available}
                      onClick={() => handleDateClick(cell.date!, available)}
                      className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-[11px] sm:text-xs font-bold border transition-colors ${
                        isPast
                          ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-default'
                          : !available
                          ? 'bg-red-50/80 text-red-400 border-red-100 cursor-not-allowed'
                          : inStay
                          ? 'bg-brand-500 text-white border-brand-500'
                          : isCheckOut
                          ? 'bg-brand-100 text-brand-900 border-brand-300 ring-2 ring-brand-200'
                          : isCheckIn
                          ? 'bg-brand-600 text-white border-brand-600 ring-2 ring-brand-200'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-100 hover:border-emerald-300 cursor-pointer'
                      }`}
                      title={cell.date}
                    >
                      <span>{cell.day}</span>
                      {!isPast && available && rate != null && rate > 0 && !inStay && (
                        <span className="text-[8px] sm:text-[9px] font-semibold opacity-80 mt-0.5">
                          {(rate / 1000).toFixed(0)}k
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-400 mt-4">
                Vert = disponible · sélectionnez arrivée puis départ
              </p>
            </>
          )}

          {rangeError && (
            <p className="text-sm text-red-600 font-medium mt-3">{rangeError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            {(checkIn || checkOut) && (
              <button
                type="button"
                onClick={() => { setCheckIn(null); setCheckOut(null); setRangeError('') }}
                className="px-4 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Effacer les dates
              </button>
            )}
            <button
              type="button"
              onClick={handleReserve}
              className="flex-1 sm:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Réserver{staySummary ? ` · ${formatPrice(staySummary.total)}` : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RoomCard({
  room,
  selected,
  onSelect,
}: {
  room: MerchantServiceConfig
  selected: boolean
  onSelect: () => void
}) {
  const rate = room.nightly_rate ?? room.price
  const images = room.image_urls ?? []
  const chips = [
    ...(room.amenities ?? []).slice(0, 3).map(amenityLabel),
    ...(room.highlights ?? []).slice(0, 2).map(highlightLabel),
  ]

  return (
    <article
      className={`snap-start shrink-0 w-[min(100%,320px)] sm:w-[300px] flex flex-col bg-white border-2 rounded-2xl overflow-hidden transition-all ${
        selected
          ? 'border-brand-500 shadow-md ring-2 ring-brand-100'
          : 'border-slate-100 hover:border-slate-300'
      }`}
    >
      <div className="p-3 pb-0">
        <ImageCarousel
          images={images}
          alt={room.name}
          aspectClass="aspect-[4/3]"
        />
      </div>
      <button
        type="button"
        onClick={onSelect}
        className="text-left p-4 pt-3 flex-1 flex flex-col"
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h3 className="font-extrabold text-slate-900 truncate">{room.name}</h3>
            {(room.property_type || room.unit_type) && (
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                {[propertyTypeLabel(room.property_type), unitTypeLabel(room.unit_type)].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <BedDouble size={18} className={selected ? 'text-brand-500 shrink-0' : 'text-slate-300 shrink-0'} />
        </div>
        {room.description && (
          <p className="text-sm text-slate-500 mb-2 line-clamp-2">{room.description}</p>
        )}
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-sm mt-auto">
          {rate != null && (
            <span className="font-extrabold text-slate-900">
              {formatPrice(rate)} <span className="font-normal text-slate-500">/ nuit</span>
            </span>
          )}
          {room.capacity != null && (
            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold text-xs">
              <Users size={12} /> {room.capacity} pers.
            </span>
          )}
        </div>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {chips.map(c => (
              <span key={c} className="text-[9px] font-bold uppercase tracking-wide bg-slate-50 text-slate-500 px-1.5 py-0.5 rounded-full">
                {c}
              </span>
            ))}
          </div>
        )}
        {selected && (
          <span className="mt-2 text-[10px] font-bold uppercase text-brand-600">Sélectionnée pour le calendrier</span>
        )}
      </button>
    </article>
  )
}
