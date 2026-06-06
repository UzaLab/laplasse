'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, Loader2, CheckCircle2, Save } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAuthReady } from '@/hooks/useAuthReady'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'

interface HourEntry {
  day: number
  open_time: string
  close_time: string
  is_closed: boolean
}

const DAYS = [
  { day: 0, label: 'Dimanche' },
  { day: 1, label: 'Lundi' },
  { day: 2, label: 'Mardi' },
  { day: 3, label: 'Mercredi' },
  { day: 4, label: 'Jeudi' },
  { day: 5, label: 'Vendredi' },
  { day: 6, label: 'Samedi' },
]

const DEFAULT_HOURS: HourEntry[] = DAYS.map(d => ({
  day: d.day,
  open_time: '08:00',
  close_time: '22:00',
  is_closed: false,
}))

export default function MerchantHoursPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId } = useAuthStore()
  const { hydrated } = useAuthReady()
  const [hours, setHours] = useState<HourEntry[]>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (hydrated && !isAuthenticated) { router.push('/login?redirect=/merchant/hours'); return }
    fetchHours()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const fetchHours = async () => {
    setLoading(true)
    const res = await merchantApiFetch('/merchants/me/hours', activeMerchantId)
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        const merged = DAYS.map(d => {
          const existing = data.find((h: HourEntry) => h.day === d.day)
          return existing
            ? { day: d.day, open_time: existing.open_time ?? '08:00', close_time: existing.close_time ?? '22:00', is_closed: existing.is_closed }
            : { day: d.day, open_time: '08:00', close_time: '22:00', is_closed: true }
        })
        setHours(merged)
      }
    }
    setLoading(false)
  }

  const updateDay = (day: number, field: keyof HourEntry, value: string | boolean) => {
    setHours(prev => prev.map(h => h.day === day ? { ...h, [field]: value } : h))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    const res = await merchantApiFetch('/merchants/me/hours', activeMerchantId, {
      method: 'PATCH',
      body: JSON.stringify({ hours }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const data = await res.json()
      setError(data.message ?? 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (hydrated && !isAuthenticated) return null

  return (
    <MerchantShell>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <Clock size={22} className="text-amber-500" /> Horaires
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Définissez vos heures d&apos;ouverture.</p>
        </div>
        {success && (
          <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold shrink-0">
            <CheckCircle2 size={16} /> Sauvegardé
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin text-slate-300" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DAYS.map(({ day, label }) => {
              const entry = hours.find(h => h.day === day)!
              const isToday = new Date().getDay() === day
              return (
                <div
                  key={day}
                  className={`bg-white border rounded-2xl p-4 transition-colors ${
                    isToday ? 'border-brand-200 shadow-sm' : 'border-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-bold text-sm ${isToday ? 'text-brand-700' : 'text-slate-900'}`}>
                      {label}
                      {isToday && <span className="ml-2 text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">Aujourd&apos;hui</span>}
                    </span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entry.is_closed}
                        onChange={e => updateDay(day, 'is_closed', e.target.checked)}
                        className="w-4 h-4 rounded accent-slate-900"
                      />
                      <span className="text-xs font-semibold text-slate-500">Fermé</span>
                    </label>
                  </div>

                  {!entry.is_closed && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Ouverture</label>
                        <input
                          type="time"
                          value={entry.open_time}
                          onChange={e => updateDay(day, 'open_time', e.target.value)}
                          className="w-full border-2 border-slate-200 focus:border-brand-400 rounded-xl px-3 py-2 text-sm outline-none transition-all"
                        />
                      </div>
                      <span className="text-slate-300 mt-4">→</span>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Fermeture</label>
                        <input
                          type="time"
                          value={entry.close_time}
                          onChange={e => updateDay(day, 'close_time', e.target.value)}
                          className="w-full border-2 border-slate-200 focus:border-brand-400 rounded-xl px-3 py-2 text-sm outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 bg-slate-900 text-white font-extrabold rounded-2xl hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
            >
              {saving ? <><Loader2 size={18} className="animate-spin" /> Sauvegarde…</> : <><Save size={18} /> Sauvegarder les horaires</>}
            </button>
          </form>
        )}
    </MerchantShell>
  )
}
