import { create } from 'zustand'
import {
  addCartItem,
  fetchCart,
  updateCartItemQuantity,
  type Cart,
} from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'

interface CartState {
  cart: Cart | null
  loading: boolean
  updatingItemId: string | null
  drawerOpen: boolean

  openDrawer: () => void
  closeDrawer: () => void
  loadCart: () => Promise<void>
  setCart: (cart: Cart | null) => void
  reset: () => void
  addItem: (
    productId: string,
    quantity: number,
    options?: { variantId?: string; openDrawer?: boolean },
  ) => Promise<{ error?: string }>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeItem: (itemId: string) => Promise<void>
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  loading: false,
  updatingItemId: null,
  drawerOpen: false,

  openDrawer: () => {
    set({ drawerOpen: true })
    const { cart, loading } = get()
    if (cart === null && !loading) {
      void get().loadCart()
    }
  },

  closeDrawer: () => set({ drawerOpen: false }),

  loadCart: async () => {
    set({ loading: true })
    try {
      const cart = await fetchCart()
      set({ cart })
    } catch {
      set({ cart: null })
    } finally {
      set({ loading: false })
    }
  },

  setCart: cart => set({ cart }),

  reset: () => set({ cart: null, drawerOpen: false }),

  addItem: async (productId, quantity, options) => {
    const { cart: next, error } = await addCartItem(productId, quantity, options?.variantId)
    if (next) {
      set({ cart: next })
      if (options?.openDrawer !== false) set({ drawerOpen: true })
      notify.success('Ajouté au panier')
    } else if (error) {
      notify.error(error)
    }
    return { error }
  },

  updateQuantity: async (itemId, quantity) => {
    set({ updatingItemId: itemId })
    const { cart: next, error } = await updateCartItemQuantity(itemId, quantity)
    if (next) {
      set({ cart: next })
      if (quantity === 0) notify.success('Article retiré du panier')
    } else if (error) {
      notify.error(error)
    }
    set({ updatingItemId: null })
  },

  removeItem: async itemId => {
    await get().updateQuantity(itemId, 0)
  },
}))

export function useCartItemCount() {
  return useCartStore(s => s.cart?.item_count ?? 0)
}
