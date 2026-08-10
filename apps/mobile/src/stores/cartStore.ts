import { create } from 'zustand'
import type { Cart } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'

interface CartState {
  cart: Cart | null
  loading: boolean
  loadCart: () => Promise<void>
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<{ error?: string }>
  addMenuItem: (menuItemId: string, quantity?: number, optionIds?: string[]) => Promise<{ error?: string }>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clear: () => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,

  loadCart: async () => {
    if (!useAuthStore.getState().isAuthenticated) {
      set({ cart: null })
      return
    }
    set({ loading: true })
    try {
      const cart = await getApiClient().getCart()
      set({ cart })
    } catch {
      set({ cart: null })
    } finally {
      set({ loading: false })
    }
  },

  addItem: async (productId, quantity = 1, variantId) => {
    if (!useAuthStore.getState().isAuthenticated) {
      return { error: 'Connectez-vous pour ajouter au panier' }
    }
    set({ loading: true })
    try {
      const cart = await getApiClient().addCartItem(productId, quantity, variantId)
      set({ cart })
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Ajout impossible' }
    } finally {
      set({ loading: false })
    }
  },

  addMenuItem: async (menuItemId, quantity = 1, optionIds = []) => {
    if (!useAuthStore.getState().isAuthenticated) {
      return { error: 'Connectez-vous pour commander au restaurant' }
    }
    set({ loading: true })
    try {
      const cart = await getApiClient().addMenuItemToCart(menuItemId, quantity, optionIds)
      set({ cart })
      return {}
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Ajout impossible' }
    } finally {
      set({ loading: false })
    }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ loading: true })
    try {
      const cart = await getApiClient().updateCartItem(itemId, quantity)
      set({ cart })
    } finally {
      set({ loading: false })
    }
  },

  clear: async () => {
    await getApiClient().clearCart().catch(() => {})
    set({ cart: null })
  },
}))
