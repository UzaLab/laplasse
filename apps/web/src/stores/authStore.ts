import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authUrl, AUTH_FETCH_INIT } from '@/lib/authClient'

export interface MerchantSummary {
  id: string
  business_name: string
  slug: string
  verification_status: string
  subscription_plan?: string
  organization_id?: string | null
}

export interface OrganizationSummary {
  id: string
  name: string
  type: string
  logo?: string | null
}

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar: string | null
  role: string
  merchants?: MerchantSummary[]
  organization?: OrganizationSummary | null
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  activeMerchantId: string | null

  setAuth: (user: AuthUser) => void
  logout: () => void
  logoutRemote: () => Promise<void>
  updateUser: (user: Partial<AuthUser>) => void
  setActiveMerchant: (id: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeMerchantId: null,

      setAuth: (user) =>
        set((state) => ({
          user,
          isAuthenticated: true,
          activeMerchantId:
            user.merchants?.[0]?.id ?? state.activeMerchantId ?? null,
        })),

      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          activeMerchantId: null,
        }),

      logoutRemote: async () => {
        try {
          await fetch(authUrl('/auth/logout'), {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          // Réseau indisponible — on efface quand même l'état local
        }
        set({
          user: null,
          isAuthenticated: false,
          activeMerchantId: null,
        })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setActiveMerchant: (id) => set({ activeMerchantId: id }),
    }),
    {
      name: 'laplasse-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeMerchantId: state.activeMerchantId,
      }),
    },
  ),
)

/** Valide la session cookie auprès de l'API (refresh auto si access expiré). */
export async function bootstrapAuthSession(): Promise<AuthUser | null> {
  try {
    const res = await fetch(authUrl('/auth/me'), {
      credentials: 'include',
    })
    if (res.ok) {
      const user = (await res.json()) as AuthUser
      useAuthStore.getState().setAuth(user)
      return user
    }
    if (res.status === 401) {
      const refreshed = await fetch(authUrl('/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: AUTH_FETCH_INIT.headers,
        body: '{}',
      })
      if (refreshed.ok) {
        const meRes = await fetch(authUrl('/auth/me'), { credentials: 'include' })
        if (meRes.ok) {
          const user = (await meRes.json()) as AuthUser
          useAuthStore.getState().setAuth(user)
          return user
        }
      }
    }
  } catch {
    // Conserver l'état local en cas d'erreur réseau transitoire
    return useAuthStore.getState().user
  }

  useAuthStore.getState().logout()
  return null
}
