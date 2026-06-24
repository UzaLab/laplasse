import { create } from 'zustand'
import { useEffect, useState } from 'react'
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
  setGuestCartLines,
  updateGuestCartLineByLocalId,
} from '@/lib/guestCart'
import { sanitizeGuestCartLines } from '@/lib/guestCartSanitize'
import { useAuthStore } from '@/stores/authStore'
import { notify } from '@/lib/notify'

function isAuthenticatedNow() {
  return useAuthStore.getState().isAuthenticated
}

async function loadGuestCartPreview(): Promise<{ cart: Cart | null; error?: string }> {
  const { cart } = await sanitizeGuestCartLines()
  return { cart }
}

interface CartState {
  cart: Cart | null
  loading: boolean
  guestHydrated: boolean
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
  guestHydrated: false,
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
        const { cart: guestCart, removed } = await sanitizeGuestCartLines()
        if (removed > 0 && guestCart) {
          notify.info(`${removed} article${removed > 1 ? 's' : ''} retiré${removed > 1 ? 's' : ''} (indisponible${removed > 1 ? 's' : ''})`)
        }
        set({ cart: guestCart, guestHydrated: true })
        return
      }

      set({ guestHydrated: true })
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
      set({ loading: false, guestHydrated: true })
    }
  },

  setCart: cart => set({ cart }),

  reset: () => set({ cart: null, drawerOpen: false, guestHydrated: false }),

  addItem: async (productId, quantity, options) => {
    if (!isAuthenticatedNow()) {
      const snapshot = getGuestCartLines()
      addGuestCartLine({
        productId,
        quantity,
        variantId: options?.variantId,
      })

      let { cart: guestCart, error } = await fetchGuestCartPreview(getGuestCartLines())
      if (!guestCart) {
        const sanitized = await sanitizeGuestCartLines()
        guestCart = sanitized.cart
        if (sanitized.removed > 0 && guestCart) {
          notify.info(`${sanitized.removed} ancien${sanitized.removed > 1 ? 's' : ''} article${sanitized.removed > 1 ? 's' : ''} retiré${sanitized.removed > 1 ? 's' : ''}`)
        }
      }

      if (guestCart) {
        set({ cart: guestCart, guestHydrated: true })
        if (options?.openDrawer !== false) set({ drawerOpen: true })
        notify.success('Ajouté au panier')
        return {}
      }

      setGuestCartLines(snapshot)
      const message = error ?? 'Impossible d\'ajouter au panier'
      notify.error(message)
      return { error: message }
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
      const { cart: guestCart } = await loadGuestCartPreview()
      set({ cart: guestCart, updatingItemId: null, guestHydrated: true })
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
  const cart = useCartStore(s => s.cart)
  const guestHydrated = useCartStore(s => s.guestHydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return 0

  if (isAuthenticated) {
    return cart?.item_count ?? 0
  }

  if (guestHydrated) {
    return cart?.item_count ?? 0
  }

  return 0
}

export { clearGuestCart }
