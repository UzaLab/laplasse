'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react'
import type { BookingDisplaySource } from '@/lib/bookingDisplay'
import {
  BOOKING_STATUS_STYLES,
  BOOKING_STATUS_LABELS,
  BOOKING_TYPE_STYLES,
  getBookingWhenDisplay,
} from '@/lib/bookingDisplay'
import { BOOKING_TYPE_LABELS, type BookingType } from '@/lib/bookingConfig'

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

function bookingSpansDay(booking: BookingDisplaySource, dayKey: string): boolean {
  const start = dateKey(booking.booked_at)
  if (booking.booking_type === 'ROOM' && booking.check_out_at) {
    const end = dateKey(booking.check_out_at)
    return dayKey >= start && dayKey < end
  }
  return start === dayKey
}

interface Props {
  bookings: BookingDisplaySource[]
  onSelect: (booking: BookingDisplaySource) => void
}

export function MerchantBookingAgenda({ bookings, onSelect }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7

  const bookingsByDay = useMemo(() => {
    const map = new Map<string, BookingDisplaySource[]>()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dayBookings = bookings.filter(b => bookingSpansDay(b, key))
      if (dayBookings.length) map.set(key, dayBookings)
    }
    return map
  }, [bookings, daysInMonth, year, month])

  const cells: Array<{ key: string; day?: number; date?: string }> = []
  for (let i = 0; i < startWeekday; i++) {
    cells.push({ key: `pad-${i}` })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ key: date, day: d, date })
  }

  const todayKey = new Date().toISOString().slice(0, 10)

  return (
    <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100">
        <button
          type="button"
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
          aria-label="Mois suivant"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/80">
        {WEEKDAYS.map(w => (
          <div key={w} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map(cell => {
          if (!cell.day || !cell.date) {
            return <div key={cell.key} className="min-h-[88px] border-b border-r border-slate-50 bg-slate-50/30" />
          }

          const dayBookings = bookingsByDay.get(cell.date) ?? []
          const isToday = cell.date === todayKey

          return (
            <div
              key={cell.key}
              className={`min-h-[88px] border-b border-r border-slate-100 p-1.5 ${
                isToday ? 'bg-amber-50/40' : ''
              }`}
            >
              <div className={`text-xs font-bold mb-1 ${isToday ? 'text-amber-600' : 'text-slate-500'}`}>
                {cell.day}
              </div>
              <div className="space-y-0.5">
                {dayBookings.slice(0, 2).map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelect(b)}
                    className={`w-full text-left px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold truncate border ${
                      BOOKING_TYPE_STYLES[b.booking_type as BookingType]
                    } ${b.status === 'PENDING' ? 'ring-1 ring-amber-300' : ''}`}
                    title={`${b.guest_name} — ${BOOKING_TYPE_LABELS[b.booking_type as BookingType]}`}
                  >
                    {b.guest_name.split(' ')[0]}
                  </button>
                ))}
                {dayBookings.length > 2 && (
                  <p className="text-[9px] font-bold text-slate-400 px-1">+{dayBookings.length - 2}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-4 sm:px-6 py-3 flex flex-wrap gap-3 text-[10px] text-slate-500 border-t border-slate-100">
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400" /> En attente
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmée
        </span>
      </div>
    </div>
  )
}

export function MerchantBookingsViewToggle({
  view,
  onChange,
}: {
  view: 'list' | 'calendar'
  onChange: (v: 'list' | 'calendar') => void
}) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-4 w-fit">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
          view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
        }`}
      >
        <List size={14} /> Liste
      </button>
      <button
        type="button"
        onClick={() => onChange('calendar')}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
          view === 'calendar' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
        }`}
      >
        <CalendarDays size={14} /> Agenda
      </button>
    </div>
  )
}
