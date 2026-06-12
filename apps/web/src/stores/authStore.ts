import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authUrl } from '@/lib/authClient'
import { invalidateAuthSession, type SessionStatus } from '@/lib/authSession'

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
  sessionStatus: SessionStatus

  setAuth: (user: AuthUser) => void
  setSessionStatus: (status: SessionStatus) => void
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
      sessionStatus: 'idle',

      setAuth: (user) =>
        set((state) => ({
          user,
          isAuthenticated: true,
          sessionStatus: 'authenticated',
          activeMerchantId:
            user.merchants?.[0]?.id ?? state.activeMerchantId ?? null,
        })),

      setSessionStatus: (sessionStatus) => set({ sessionStatus }),

      logout: () => {
        invalidateAuthSession()
        set({
          user: null,
          isAuthenticated: false,
          activeMerchantId: null,
          sessionStatus: 'anonymous',
        })
      },

      logoutRemote: async () => {
        try {
          await fetch(authUrl('/auth/logout'), {
            method: 'POST',
            credentials: 'include',
          })
        } catch {
          // Réseau indisponible — on efface quand même l'état local
        }
        invalidateAuthSession()
        set({
          user: null,
          isAuthenticated: false,
          activeMerchantId: null,
          sessionStatus: 'anonymous',
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
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (state.isAuthenticated && state.user) {
          state.sessionStatus = 'idle'
        } else {
          state.sessionStatus = 'anonymous'
        }
      },
    },
  ),
)

/** @deprecated Utiliser ensureAuthSession depuis @/lib/authSession */
export { ensureAuthSession as bootstrapAuthSession } from '@/lib/authSession'
