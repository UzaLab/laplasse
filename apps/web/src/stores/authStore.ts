import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean
  activeMerchantId: string | null

  setAuth: (user: AuthUser, access_token: string, refresh_token: string) => void
  logout: () => void
  updateUser: (user: Partial<AuthUser>) => void
  setActiveMerchant: (id: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,
      activeMerchantId: null,

      setAuth: (user, access_token, refresh_token) =>
        set((state) => ({
          user,
          access_token,
          refresh_token,
          isAuthenticated: true,
          activeMerchantId:
            user.merchants?.[0]?.id ?? state.activeMerchantId ?? null,
        })),

      logout: () =>
        set({
          user: null,
          access_token: null,
          refresh_token: null,
          isAuthenticated: false,
          activeMerchantId: null,
        }),

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
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
        activeMerchantId: state.activeMerchantId,
      }),
    },
  ),
)
