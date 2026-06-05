import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  avatar: string | null
  role: string
  merchant?: { id: string; business_name: string; slug: string; verification_status: string } | null
}

interface AuthState {
  user: AuthUser | null
  access_token: string | null
  refresh_token: string | null
  isAuthenticated: boolean

  setAuth: (user: AuthUser, access_token: string, refresh_token: string) => void
  logout: () => void
  updateUser: (user: Partial<AuthUser>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      refresh_token: null,
      isAuthenticated: false,

      setAuth: (user, access_token, refresh_token) =>
        set({ user, access_token, refresh_token, isAuthenticated: true }),

      logout: () =>
        set({ user: null, access_token: null, refresh_token: null, isAuthenticated: false }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'laplasse-auth',
      partialize: (state) => ({
        user: state.user,
        access_token: state.access_token,
        refresh_token: state.refresh_token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
