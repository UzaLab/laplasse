'use client'

import { useState } from 'react'
import { Globe } from 'lucide-react'
import {
  buildCountrySwitchUrl,
  getCountryCode,
  setClientCountry,
  SUPPORTED_COUNTRIES,
} from '@/lib/country'
import { useT } from '@/providers/LocaleProvider'

export function CountrySwitcher() {
  const t = useT()
  const [code, setCode] = useState(() => getCountryCode())

  const handleChange = (next: string) => {
    const { pathname, search } = window.location
    const redirectUrl = buildCountrySwitchUrl(next, pathname, search)
    if (redirectUrl) {
      window.location.href = redirectUrl
      return
    }
    setClientCountry(next)
    setCode(next)
    window.location.reload()
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <Globe size={14} className="text-slate-400 shrink-0" aria-hidden />
      <select
        value={code}
        onChange={e => handleChange(e.target.value)}
        className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-1"
        aria-label={t('geo.country')}
      >
        {SUPPORTED_COUNTRIES.map(c => (
          <option key={c.code} value={c.code}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}
