'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { formatPrice } from '@/lib/marketplaceApi'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

interface DayCell {
  date: string
  available: boolean
  nightly_rate: number | null
}

interface Props {
  merchantId: string
}

export function HotelRoomCalendar({ merchantId }: Props) {
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<DayCell[]>([])
  const [nightlyRate, setNightlyRate] = useState<number | null>(null)
  const [roomName, setRoomName] = useState<string | null>(null)

  const range = useMemo(() => {
    const from = new Date()
    const to = new Date()
    to.setDate(to.getDate() + 14)
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    }
  }, [])

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const qs = new URLSearchParams({ from: range.from, to: range.to })
        const res = await fetch(
          `${API}/bookings/merchant/${merchantId}/room-calendar?${qs}`,
        )
        if (res.ok) {
          const data = await res.json()
          setDays(data.days ?? [])
          setNightlyRate(data.room_service?.nightly_rate ?? null)
          setRoomName(data.room_service?.name ?? null)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [merchantId, range.from, range.to])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 size={22} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (days.length === 0) return null

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm mb-6">
      <h3 className="font-extrabold text-slate-900 mb-1">Disponibilités chambres</h3>
      {roomName && nightlyRate != null && (
        <p className="text-sm text-slate-500 mb-4">
          {roomName} — à partir de {formatPrice(nightlyRate, 'XOF')} / nuit
        </p>
      )}
      <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
        {days.map(day => {
          const d = new Date(`${day.date}T12:00:00`)
          return (
            <div
              key={day.date}
              className={`rounded-lg py-2 px-1 font-bold ${
                day.available
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                  : 'bg-slate-50 text-slate-400 border border-slate-100'
              }`}
              title={day.date}
            >
              <div className="text-[10px] uppercase opacity-70">
                {d.toLocaleDateString('fr-FR', { weekday: 'short' })}
              </div>
              <div>{d.getDate()}</div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-slate-400 mt-3">
        Prochaines 2 semaines — vert = disponible
      </p>
    </div>
  )
}
