/** Token refs partagés entre authStore et api client (évite require cycle). */

let accessToken: string | null = null
let refreshToken: string | null = null
let countryCode = 'CI'
let onUnauthorized: (() => void) | undefined

export const tokenStorage = {
  getAccessToken: () => accessToken,
  getRefreshToken: () => refreshToken,
  setTokens: (access: string, refresh: string) => {
    accessToken = access
    refreshToken = refresh
  },
  clearTokens: () => {
    accessToken = null
    refreshToken = null
  },
  getCountryCode: () => countryCode,
  setCountryCode: (code: string) => {
    countryCode = code.toUpperCase()
  },
  setOnUnauthorized: (fn: () => void) => {
    onUnauthorized = fn
  },
  notifyUnauthorized: () => onUnauthorized?.(),
}
