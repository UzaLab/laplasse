'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarClock,
  CheckCircle2,
  Copy,
  Loader2,
  Moon,
  Save,
  Sun,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { notify } from '@/lib/notify'

export interface HourEntry {
  day: number
  open_time: string
  close_time: string
  is_closed: boolean
}

const DAYS = [
  { day: 1, label: 'Lundi', short: 'Lun' },
  { day: 2, label: 'Mardi', short: 'Mar' },
  { day: 3, label: 'Mercredi', short: 'Mer' },
  { day: 4, label: 'Jeudi', short: 'Jeu' },
  { day: 5, label: 'Vendredi', short: 'Ven' },
  { day: 6, label: 'Samedi', short: 'Sam' },
  { day: 0, label: 'Dimanche', short: 'Dim' },
] as const

const DEFAULT_HOURS: HourEntry[] = DAYS.map(d => ({
  day: d.day,
  open_time: '08:00',
  close_time: '22:00',
  is_closed: false,
}))

const INPUT =
  'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 transition-all disabled:bg-slate-50 disabled:text-slate-400'

function countOpenDays(hours: HourEntry[]) {
  return hours.filter(h => !h.is_closed).length
}

function formatTimeLabel(value: string) {
  return value.replace(':', 'h')
}

export function MerchantHoursPanel() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromOnboarding = searchParams.get('from') === 'onboarding'
  const { activeMerchantId } = useAuthStore()

  const [hours, setHours] = useState<HourEntry[]>(DEFAULT_HOURS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const today = new Date().getDay()
  const openDaysCount = useMemo(() => countOpenDays(hours), [hours])
  const todayEntry = hours.find(h => h.day === today)

  const fetchHours = useCallback(async () => {
    setLoading(true)
    const res = await merchantApiFetch('/merchants/me/hours', activeMerchantId)
    if (res.ok) {
      const data = await res.json() as HourEntry[]
      if (data.length > 0) {
        const merged = DAYS.map(d => {
          const existing = data.find(h => h.day === d.day)
          return existing
            ? {
                day: d.day,
                open_time: existing.open_time ?? '08:00',
                close_time: existing.close_time ?? '22:00',
                is_closed: existing.is_closed,
              }
            : { day: d.day, open_time: '08:00', close_time: '22:00', is_closed: true }
        })
        setHours(merged)
      } else {
        setHours(DEFAULT_HOURS)
      }
      setDirty(false)
    }
    setLoading(false)
  }, [activeMerchantId])

  useEffect(() => {
    void fetchHours()
  }, [fetchHours])

  const updateDay = (day: number, field: keyof HourEntry, value: string | boolean) => {
    setDirty(true)
    setHours(prev => prev.map(h => (h.day === day ? { ...h, [field]: value } : h)))
  }

  const applyWeekdayPreset = () => {
    setDirty(true)
    setHours(prev =>
      prev.map(h => {
        if (h.day >= 1 && h.day <= 5) {
          return { ...h, open_time: '08:00', close_time: '22:00', is_closed: false }
        }
        if (h.day === 0) return { ...h, is_closed: true }
        return h
      }),
    )
    notify.info('Préréglage appliqué', 'Lun–Ven 8h–22h, week-end à ajuster.')
  }

  const copyMondayToAll = () => {
    const monday = hours.find(h => h.day === 1)
    if (!monday) return
    setDirty(true)
    setHours(prev =>
      prev.map(h => ({
        ...h,
        open_time: monday.open_time,
        close_time: monday.close_time,
        is_closed: monday.is_closed,
      })),
    )
    notify.info('Horaires du lundi copiés sur toute la semaine')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (openDaysCount === 0) {
      notify.error('Indiquez au moins un jour d\'ouverture')
      return
    }

    setSaving(true)
    const res = await merchantApiFetch('/merchants/me/hours', activeMerchantId, {
      method: 'PATCH',
      body: JSON.stringify({ hours }),
    })

    if (res.ok) {
      const saved = await res.json() as HourEntry[]
      if (saved.length > 0) {
        const merged = DAYS.map(d => {
          const existing = saved.find(h => h.day === d.day)
          return existing
            ? {
                day: d.day,
                open_time: existing.open_time ?? '08:00',
                close_time: existing.close_time ?? '22:00',
                is_closed: existing.is_closed,
              }
            : { day: d.day, open_time: '08:00', close_time: '22:00', is_closed: true }
        })
        setHours(merged)
      }
      setDirty(false)
      notify.success(
        'Horaires enregistrés',
        openDaysCount === 7
          ? 'Ouvert 7 j/7 — visible sur votre fiche publique.'
          : `${openDaysCount} jour${openDaysCount > 1 ? 's' : ''} ouvert${openDaysCount > 1 ? 's' : ''} — pris en compte dans votre onboarding.`,
      )
      if (fromOnboarding) {
        router.push('/merchant/onboarding')
      }
    } else {
      const data = await res.json().catch(() => ({}))
      notify.error(data.message ?? 'Erreur lors de la sauvegarde')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
              <CalendarClock size={20} className="text-amber-600" />
            </span>
            Horaires d&apos;ouverture
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-xl">
            Affichés sur votre fiche publique et utilisés pour indiquer si vous êtes ouvert maintenant.
          </p>
        </div>
        <button
          type="submit"
          form="hours-form"
          disabled={saving || !dirty}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold rounded-full text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 shrink-0 self-start"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>

      {fromOnboarding && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
          Étape onboarding — enregistrez au moins un jour ouvert pour valider cette étape, puis revenez au parcours.
          {' '}
          <Link href="/merchant/onboarding" className="font-bold underline">
            Retour au parcours
          </Link>
        </div>
      )}

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Jours ouverts</p>
          <p className="text-2xl font-extrabold text-slate-900">{openDaysCount}<span className="text-base font-medium text-slate-400">/7</span></p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Aujourd&apos;hui</p>
          <p className="text-sm font-bold text-slate-900 mt-1">
            {todayEntry?.is_closed ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500">
                <Moon size={14} /> Fermé
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <Sun size={14} />
                {formatTimeLabel(todayEntry?.open_time ?? '08:00')} – {formatTimeLabel(todayEntry?.close_time ?? '22:00')}
              </span>
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Statut</p>
          <p className="text-sm font-bold mt-1 flex items-center gap-1.5">
            {dirty ? (
              <span className="text-amber-700">Modifications non enregistrées</span>
            ) : openDaysCount > 0 ? (
              <span className="text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 size={14} /> En ligne
              </span>
            ) : (
              <span className="text-slate-500">À compléter</span>
            )}
          </p>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={applyWeekdayPreset}
          className="text-xs font-bold px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
        >
          Lun–Ven 8h–22h
        </button>
        <button
          type="button"
          onClick={copyMondayToAll}
          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:text-brand-700 transition-colors"
        >
          <Copy size={13} /> Copier le lundi sur toute la semaine
        </button>
      </div>

      <form id="hours-form" onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-[140px_1fr_1fr_100px] gap-4 px-6 py-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Jour</span>
            <span>Ouverture</span>
            <span>Fermeture</span>
            <span className="text-right">Fermé</span>
          </div>

          <ul className="divide-y divide-slate-100">
            {DAYS.map(({ day, label, short }) => {
              const entry = hours.find(h => h.day === day)!
              const isToday = today === day
              return (
                <li
                  key={day}
                  className={`px-4 md:px-6 py-4 md:py-3 transition-colors ${
                    isToday ? 'bg-brand-50/40' : 'bg-white'
                  }`}
                >
                  <div className="md:grid md:grid-cols-[140px_1fr_1fr_100px] md:gap-4 md:items-center">
                    <div className="flex items-center justify-between md:block mb-3 md:mb-0">
                      <div>
                        <span className={`font-bold text-sm ${isToday ? 'text-brand-800' : 'text-slate-900'}`}>
                          <span className="md:hidden">{short}</span>
                          <span className="hidden md:inline">{label}</span>
                        </span>
                        {isToday && (
                          <span className="ml-2 text-[10px] font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                            Aujourd&apos;hui
                          </span>
                        )}
                      </div>
                      <label className="md:hidden flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={entry.is_closed}
                          onChange={e => updateDay(day, 'is_closed', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-brand-500/20"
                        />
                        <span className="text-xs font-semibold text-slate-500">Fermé</span>
                      </label>
                    </div>

                    {!entry.is_closed ? (
                      <div className="grid grid-cols-2 gap-3 md:contents">
                        <div>
                          <label className="md:sr-only text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                            Ouverture
                          </label>
                          <input
                            type="time"
                            value={entry.open_time}
                            onChange={e => updateDay(day, 'open_time', e.target.value)}
                            className={INPUT}
                          />
                        </div>
                        <div>
                          <label className="md:sr-only text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                            Fermeture
                          </label>
                          <input
                            type="time"
                            value={entry.close_time}
                            onChange={e => updateDay(day, 'close_time', e.target.value)}
                            className={INPUT}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="md:col-span-2 flex items-center gap-2 text-sm text-slate-400 py-2">
                        <Moon size={14} />
                        Fermé toute la journée
                      </div>
                    )}

                    <label className="hidden md:flex items-center justify-end gap-2 cursor-pointer">
                      <span className="text-xs font-semibold text-slate-500">Fermé</span>
                      <input
                        type="checkbox"
                        checked={entry.is_closed}
                        onChange={e => updateDay(day, 'is_closed', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-brand-500/20"
                      />
                    </label>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex-1 py-3.5 bg-slate-900 text-white font-extrabold rounded-full hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={18} className="animate-spin" /> Enregistrement…</> : <><Save size={18} /> Enregistrer les horaires</>}
          </button>
          {fromOnboarding && (
            <Link
              href="/merchant/onboarding"
              className="py-3.5 px-6 border-2 border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors text-center text-sm"
              style={{ textDecoration: 'none' }}
            >
              Retour onboarding
            </Link>
          )}
        </div>
      </form>
    </div>
  )
}
