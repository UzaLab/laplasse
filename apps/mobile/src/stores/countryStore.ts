import { create } from 'zustand'
import { DEFAULT_COUNTRY } from '@laplasse/shared-config'
import { secureStorage } from '@/src/lib/secureStorage'
import { tokenStorage } from '@/src/lib/tokenStorage'

const COUNTRY_KEY = 'laplasse_country'

interface CountryState {
  countryCode: string
  hydrated: boolean
  hydrate: () => Promise<void>
  setCountry: (code: string) => Promise<void>
}

export const useCountryStore = create<CountryState>((set) => ({
  countryCode: DEFAULT_COUNTRY,
  hydrated: false,

  hydrate: async () => {
    const stored = await secureStorage.getItem(COUNTRY_KEY)
    const code = stored?.toUpperCase() || DEFAULT_COUNTRY
    tokenStorage.setCountryCode(code)
    set({ countryCode: code, hydrated: true })
  },

  setCountry: async (code) => {
    const normalized = code.toUpperCase()
    await secureStorage.setItem(COUNTRY_KEY, normalized)
    tokenStorage.setCountryCode(normalized)
    set({ countryCode: normalized })
  },
}))
