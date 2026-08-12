import { create } from 'zustand'
import type { Cart } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { addGuestCartLine, clearGuestCart, getGuestCartLines, setGuestCartLines, updateGuestCartLineByLocalId } from '@/src/lib/guestCart'
import { sanitizeGuestCartLines } from '@/src/lib/guestCartSanitize'
import { useAuthStore } from '@/src/stores/authStore'

function isAuthenticatedNow() {
  return useAuthStore.getState().isAuthenticated
}

interface CartState {
  cart: Cart | null
  loading: boolean
  guestHydrated: boolean
  updatingItemId: string | null
  loadCart: () => Promise<void>
  setCart: (cart: Cart | null) => void
  reset: () => void
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<{ error?: string }>
  addMenuItem: (menuItemId: string, quantity?: number, optionIds?: string[]) => Promise<{ error?: string }>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
  clear: () => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  guestHydrated: false,
  updatingItemId: null,

  loadCart: async () => {
    set({ loading: true })
    try {
      if (!isAuthenticatedNow()) {
        const { cart: guestCart } = await sanitizeGuestCartLines()
        set({ cart: guestCart, guestHydrated: true })
        return
      }
      set({ guestHydrated: true })
      const cart = await getApiClient().getCart()
      set({ cart })
    } catch {
      set({ cart: null })
    } finally {
      set({ loading: false, guestHydrated: true })
    }
  },

  setCart: cart => set({ cart }),

  reset: () => set({ cart: null, guestHydrated: false, updatingItemId: null }),

  addItem: async (productId, quantity = 1, variantId) => {
    if (!isAuthenticatedNow()) {
      const snapshot = await getGuestCartLines()
      await addGuestCartLine({ productId, quantity, variantId })
      try {
        const cart = await getApiClient().previewGuestCart(await getGuestCartLines())
        set({ cart, guestHydrated: true })
        return {}
      } catch {
        await setGuestCartLines(snapshot)
        return { error: 'Impossible d\'ajouter au panier' }
      }
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
    if (!isAuthenticatedNow()) {
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
    set({ updatingItemId: itemId })

    if (!isAuthenticatedNow()) {
      await updateGuestCartLineByLocalId(itemId, quantity)
      const { cart: guestCart } = await sanitizeGuestCartLines()
      set({ cart: guestCart, updatingItemId: null, guestHydrated: true })
      return
    }

    try {
      const cart = await getApiClient().updateCartItem(itemId, quantity)
      set({ cart })
    } catch {
      // keep current cart on error
    } finally {
      set({ updatingItemId: null })
    }
  },

  removeItem: async itemId => {
    await get().updateQuantity(itemId, 0)
  },

  clear: async () => {
    if (isAuthenticatedNow()) {
      await getApiClient().clearCart().catch(() => {})
    } else {
      await clearGuestCart()
    }
    set({ cart: null })
  },
}))

export { clearGuestCart }
