import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import type { AuthUser } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { tokenStorage } from '@/src/lib/tokenStorage'

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
  register: (input: { email: string; password: string; full_name: string; phone: string }) => Promise<{ error?: string }>
  logout: () => Promise<void>
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
        SecureStore.getItemAsync(ACCESS_KEY),
        SecureStore.getItemAsync(REFRESH_KEY),
      ])
      if (!accessToken || !refreshToken) {
        set({ hydrated: true, isAuthenticated: false })
        return
      }
      set({ accessToken, refreshToken, isAuthenticated: true })
      tokenStorage.setTokens(accessToken, refreshToken)
      const user = await getApiClient().getMe()
      set({ user, hydrated: true, isAuthenticated: true })
    } catch {
      await get().clearTokens()
      set({ hydrated: true, isAuthenticated: false })
    }
  },

  setTokens: async (accessToken, refreshToken) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
    ])
    tokenStorage.setTokens(accessToken, refreshToken)
    set({ accessToken, refreshToken, isAuthenticated: true })
  },

  clearTokens: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
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
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Inscription impossible' }
    } finally {
      set({ loading: false })
    }
  },

  logout: async () => {
    const refreshToken = get().refreshToken
    try {
      if (refreshToken) await getApiClient().logout(refreshToken)
    } catch {
      // ignore
    }
    await get().clearTokens()
  },
}))
