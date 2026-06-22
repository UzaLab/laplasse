const STORAGE_KEY = 'lp_guest_key'

export function getGuestKey(): string {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem(STORAGE_KEY)
  if (!key) {
    key = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(STORAGE_KEY, key)
  }
  return key
}
