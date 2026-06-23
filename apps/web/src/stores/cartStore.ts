import { create } from 'zustand'
import {
  addCartItem,
  fetchGuestCartPreview,
  updateCartItemQuantity,
  type Cart,
} from '@/lib/marketplaceApi'
import { authApiFetch } from '@/lib/authFetch'
import {
  addGuestCartLine,
  clearGuestCart,
  getGuestCartLines,
  guestCartItemCount,
  updateGuestCartLineByLocalId,
} from '@/lib/guestCart'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'

function isAuthenticatedNow() {
  return useAuthStore.getState().isAuthenticated
}

async function loadGuestCartPreview(): Promise<Cart | null> {
  const lines = getGuestCartLines()
  if (!lines.length) return null
  return fetchGuestCartPreview(lines)
}

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
  addMenuItem: (
    menuItemId: string,
    quantity: number,
    options?: { openDrawer?: boolean; optionIds?: string[] },
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
      if (!isAuthenticatedNow()) {
        const guestCart = await loadGuestCartPreview()
        set({ cart: guestCart })
        return
      }

      const res = await authApiFetch('/cart')
      if (res.ok) {
        set({ cart: await res.json() as Cart })
      } else if (res.status === 503) {
        notify.error('Impossible de charger le panier', 'Vérifiez votre connexion.')
        set({ cart: null })
      }
    } catch {
      notify.error('Impossible de charger le panier')
      set({ cart: null })
    } finally {
      set({ loading: false })
    }
  },

  setCart: cart => set({ cart }),

  reset: () => set({ cart: null, drawerOpen: false }),

  addItem: async (productId, quantity, options) => {
    if (!isAuthenticatedNow()) {
      addGuestCartLine({
        productId,
        quantity,
        variantId: options?.variantId,
      })
      const guestCart = await loadGuestCartPreview()
      if (guestCart) {
        set({ cart: guestCart })
        if (options?.openDrawer !== false) set({ drawerOpen: true })
        notify.success('Ajouté au panier')
        return {}
      }
      notify.error('Impossible d\'ajouter au panier')
      return { error: 'Impossible d\'ajouter au panier' }
    }

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

  addMenuItem: async (menuItemId, quantity, options) => {
    if (!isAuthenticatedNow()) {
      notify.error('Connectez-vous pour commander au restaurant')
      return { error: 'Authentification requise' }
    }

    const res = await authApiFetch('/cart/menu-items', {
      method: 'POST',
      body: JSON.stringify({
        menuItemId,
        quantity,
        optionIds: options?.optionIds ?? [],
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Erreur panier' }))
      const error = (err as { message?: string }).message ?? 'Erreur panier'
      notify.error(error)
      return { error }
    }
    const cart = (await res.json()) as Cart
    set({ cart })
    if (options?.openDrawer !== false) set({ drawerOpen: true })
    notify.success('Ajouté à la commande')
    return {}
  },

  updateQuantity: async (itemId, quantity) => {
    set({ updatingItemId: itemId })

    if (!isAuthenticatedNow()) {
      updateGuestCartLineByLocalId(itemId, quantity)
      const guestCart = await loadGuestCartPreview()
      set({ cart: guestCart, updatingItemId: null })
      if (quantity === 0) notify.success('Article retiré du panier')
      return
    }

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
  const authCount = useCartStore(s => s.cart?.item_count ?? 0)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  if (isAuthenticated) return authCount
  return guestCartItemCount()
}

export { clearGuestCart }
