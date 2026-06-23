import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authUrl } from '@/lib/authClient'
import { invalidateAuthSession, type SessionStatus } from '@/lib/authSession'
import { getShopsForMerchant, type ShopSummary } from '@/lib/shopApi'

export interface MerchantSummary {
  id: string
  business_name: string
  slug: string
  verification_status: string
  subscription_plan?: string
  organization_id?: string | null
  category_slug?: string
}

export interface OrganizationSummary {
  id: string
  name: string
  type: string
  logo?: string | null
}

export interface CourierSummary {
  id: string
  status: string
  city: string
  country: string
  phone?: string
  vehicle: string
  plate_number?: string | null
  is_online?: boolean
  current_latitude?: number | null
  current_longitude?: number | null
  last_location_at?: string | null
  rating_avg?: number
  rating_count?: number
  completed_jobs?: number
}

export interface LogisticsPartnerSummary {
  id: string
  legal_name: string
  trade_name: string | null
  slug: string
  city: string
  country: string
  phone: string
  verification: string
  is_active: boolean
  onboarding_step?: number
  logo?: string | null
  _count?: { couriers: number; contracts: number }
}

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar: string | null
  phone?: string | null
  role: string
  merchants?: MerchantSummary[]
  shops?: ShopSummary[]
  organization?: OrganizationSummary | null
  courier_profile?: CourierSummary | null
  logistics_partner?: LogisticsPartnerSummary | null
}

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
  activeMerchantId: string | null
  activeShopId: string | null
  sessionStatus: SessionStatus

  setAuth: (user: AuthUser) => void
  setSessionStatus: (status: SessionStatus) => void
  logout: () => void
  logoutRemote: () => Promise<void>
  updateUser: (user: Partial<AuthUser>) => void
  setActiveMerchant: (id: string) => void
  setActiveShop: (id: string | null) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      activeMerchantId: null,
      activeShopId: null,
      sessionStatus: 'idle',

      setAuth: (user) =>
        set((state) => {
          const activeMerchantId =
            user.merchants?.[0]?.id ?? state.activeMerchantId ?? null
          const linkedShops = getShopsForMerchant(user.shops, activeMerchantId)
          const independentShops = (user.shops ?? []).filter(s => !s.merchant_id)
          // Prioritise merchant-linked shop; fall back to independent shop
          const firstShop = linkedShops[0] ?? independentShops[0] ?? null
          return {
            user,
            isAuthenticated: true,
            sessionStatus: 'authenticated',
            activeMerchantId,
            activeShopId: firstShop?.id ?? state.activeShopId ?? null,
          }
        }),

      setSessionStatus: (sessionStatus) => set({ sessionStatus }),

      logout: () => {
        invalidateAuthSession()
        set({
          user: null,
          isAuthenticated: false,
          activeMerchantId: null,
          activeShopId: null,
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
          activeShopId: null,
          sessionStatus: 'anonymous',
        })
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),

      setActiveMerchant: (id) =>
        set((state) => {
          const linkedShops = getShopsForMerchant(state.user?.shops, id)
          return {
            activeMerchantId: id,
            activeShopId: linkedShops[0]?.id ?? null,
          }
        }),
      setActiveShop: (id) => set({ activeShopId: id }),
    }),
    {
      name: 'laplasse-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        activeMerchantId: state.activeMerchantId,
        activeShopId: state.activeShopId,
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
