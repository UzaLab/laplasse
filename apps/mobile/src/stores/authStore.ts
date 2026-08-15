import { create } from 'zustand'
import type { AuthUser } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { secureStorage } from '@/src/lib/secureStorage'
import { tokenStorage } from '@/src/lib/tokenStorage'

function cartStore() {
  return require('@/src/stores/cartStore').useCartStore as typeof import('@/src/stores/cartStore').useCartStore
}

const ACCESS_KEY = 'laplasse_access'
const REFRESH_KEY = 'laplasse_refresh'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null
  hydrated: boolean
  loading: boolean
  isAuthenticated: boolean

  hydrate: () => Promise<void>
  setTokens: (accessToken: string, refreshToken: string) => Promise<void>
  clearTokens: () => Promise<void>
  login: (email: string, password: string) => Promise<{ error?: string }>
  loginWithOtp: (phone: string, code: string) => Promise<{ error?: string }>
  register: (input: { email: string; password: string; full_name: string; phone: string }) => Promise<{ error?: string }>
  logout: () => Promise<void>
  setUser: (user: AuthUser) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  hydrated: false,
  loading: false,
  isAuthenticated: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        secureStorage.getItem(ACCESS_KEY),
        secureStorage.getItem(REFRESH_KEY),
      ])
      if (!accessToken || !refreshToken) {
        set({ hydrated: true, isAuthenticated: false })
        void cartStore().getState().loadCart()
        return
      }
      set({ accessToken, refreshToken, isAuthenticated: true })
      tokenStorage.setTokens(accessToken, refreshToken)
      const user = await getApiClient().getMe()
      set({ user, hydrated: true, isAuthenticated: true })
      void cartStore().getState().loadCart()
    } catch {
      await get().clearTokens()
      set({ hydrated: true, isAuthenticated: false })
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      secureStorage.setItem(ACCESS_KEY, accessToken),
      secureStorage.setItem(REFRESH_KEY, refreshToken),
    ])
    tokenStorage.setTokens(accessToken, refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  clearTokens: async () => {
    await Promise.all([
      secureStorage.deleteItem(ACCESS_KEY),
      secureStorage.deleteItem(REFRESH_KEY),
    ])
    tokenStorage.clearTokens()
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
  },

  login: async (email, password) => {
    set({ loading: true })
    try {
      const data = await getApiClient().login(email, password)
      if (!data.accessToken || !data.refreshToken) {
        return { error: 'Réponse auth invalide' }
      }
      await get().setTokens(data.accessToken, data.refreshToken)
      set({ user: data.user, isAuthenticated: true })
      void cartStore().getState().loadCart()
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Connexion impossible' }
    } finally {
      set({ loading: false })
    }
  },

  register: async (input) => {
    set({ loading: true })
    try {
      const data = await getApiClient().register(input)
      if (!data.accessToken || !data.refreshToken) {
        return { error: 'Réponse auth invalide' }
      }
      await get().setTokens(data.accessToken, data.refreshToken)
      set({ user: data.user, isAuthenticated: true })
      void cartStore().getState().loadCart()
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Inscription impossible' }
    } finally {
      set({ loading: false })
    }
  },

  loginWithOtp: async (phone, code) => {
    set({ loading: true })
    try {
      const data = await getApiClient().verifyOtp(phone, code)
      if (!data.accessToken || !data.refreshToken) {
        return { error: 'Réponse auth invalide' }
      }
      await get().setTokens(data.accessToken, data.refreshToken)
      set({ user: data.user, isAuthenticated: true })
      void cartStore().getState().loadCart()
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Code OTP invalide' }
    } finally {
      set({ loading: false })
    }
  },

  setUser: user => set({ user }),

  logout: async () => {
    const refreshToken = get().refreshToken
    try {
      if (refreshToken) await getApiClient().logout(refreshToken)
    } catch {
      // ignore
    }
    await get().clearTokens()
    cartStore().getState().reset()
    void cartStore().getState().loadCart()
  },
}))
