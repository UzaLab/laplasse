'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  buildCountrySwitchUrl,
  COUNTRY_HUB_ENTRIES,
  getCountryCode,
  getCountryLabel,
  setClientCountry,
} from '@/lib/country'
import { useLocale } from '@/providers/LocaleProvider'

const DISMISS_KEY = 'lp_country_suggest_dismiss'

function getHubEntry(code: string) {
  return COUNTRY_HUB_ENTRIES.find(e => e.code === code)
}

export function CountrySuggestionBanner() {
  const { t } = useLocale()
  const [suggested, setSuggested] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const current = getCountryCode()
    fetch('/api/geo/country-hint')
      .then(r => r.json())
      .then((data: { country?: string | null }) => {
        const detected = data.country?.toUpperCase()
        if (!detected || detected === current) return
        const dismissed = sessionStorage.getItem(`${DISMISS_KEY}_${detected}`)
        if (dismissed) return
        setSuggested(detected)
        setVisible(true)
      })
      .catch(() => {})
  }, [])

  if (!visible || !suggested) return null

  const hub = getHubEntry(suggested)
  const label = hub?.label ?? getCountryLabel(suggested)
  const flag = hub?.flag ?? '🌍'

  const dismiss = () => {
    sessionStorage.setItem(`${DISMISS_KEY}_${suggested}`, '1')
    setVisible(false)
  }

  const switchCountry = () => {
    const { pathname, search } = window.location
    const url = buildCountrySwitchUrl(suggested, pathname, search)
    if (url) {
      window.location.href = url
      return
    }
    setClientCountry(suggested)
    dismiss()
    window.location.reload()
  }

  return (
    <div
      role="status"
      className="fixed bottom-20 lg:bottom-6 left-4 right-4 z-50 mx-auto max-w-lg pointer-events-none"
    >
      <div className="pointer-events-auto bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/30 p-4 flex gap-3 items-start border border-slate-700/50">
        <span className="text-2xl leading-none shrink-0" aria-hidden>{flag}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{t('geo.suggestTitle', { country: label })}</p>
          <p className="text-xs text-slate-300 mt-0.5">{t('geo.suggestBody')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={switchCountry}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-400 text-white text-xs font-bold rounded-full transition-colors"
            >
              {t('geo.suggestSwitch', { country: label })}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="px-3 py-1.5 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              {t('geo.suggestDismiss')}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="text-slate-400 hover:text-white shrink-0 p-1"
          aria-label={t('geo.suggestDismiss')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
