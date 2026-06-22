'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import {
  buildCountrySwitchUrl,
  COUNTRY_HUB_ENTRIES,
  isRootDomainHost,
  setClientCountry,
} from '@/lib/country'

export function CountryHubModal() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<string | null>(null)

  useEffect(() => {
    setOpen(isRootDomainHost(window.location.host))
  }, [])

  const selectCountry = (code: string) => {
    if (pending) return
    setPending(code)
    setClientCountry(code)

    const { pathname, search } = window.location
    const redirectUrl = buildCountrySwitchUrl(code, pathname, search)
    if (redirectUrl) {
      window.location.assign(redirectUrl)
      return
    }

    setPending(null)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-md"
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="country-hub-title"
        className="relative w-full max-w-xl bg-white rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-brand-50 via-amber-50/80 to-white pointer-events-none" />

        <div className="relative px-6 sm:px-8 pt-8 pb-7">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-slate-900 text-brand-400 flex items-center justify-center shadow-lg shadow-slate-900/10">
              <MapPin size={20} aria-hidden />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-600">
                LaPlasse
              </p>
              <p className="text-sm font-semibold text-slate-500">
                Marketplace locale premium
              </p>
            </div>
          </div>

          <h2
            id="country-hub-title"
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2"
          >
            Où souhaitez-vous explorer ?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed mb-7 max-w-md">
            Choisissez votre pays pour accéder aux établissements, réservations
            et marketplace près de chez vous.
          </p>

          <ul className="space-y-3">
            {COUNTRY_HUB_ENTRIES.map(entry => {
              const isLoading = pending === entry.code
              return (
                <li key={entry.code}>
                  <button
                    type="button"
                    onClick={() => selectCountry(entry.code)}
                    disabled={Boolean(pending)}
                    className="group w-full flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/10 px-4 py-4 text-left transition-all disabled:opacity-60 disabled:cursor-wait"
                  >
                    <span className="text-3xl leading-none shrink-0" aria-hidden>
                      {entry.flag}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-extrabold text-slate-900 text-base">
                        {entry.label}
                      </span>
                      <span className="block text-sm text-slate-500 mt-0.5 truncate">
                        {entry.city} — {entry.tagline}
                      </span>
                    </span>
                    <span className="shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-400 group-hover:text-brand-600 group-hover:border-brand-200 flex items-center justify-center transition-colors">
                      {isLoading ? (
                        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ArrowRight size={16} aria-hidden />
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="mt-6 text-center text-xs text-slate-400">
            Votre choix sera mémorisé pour vos prochaines visites sur laplasse.tech
          </p>
        </div>
      </div>
    </div>
  )
}
