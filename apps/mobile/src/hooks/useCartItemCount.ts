import { useEffect, useState } from 'react'
import { useCartStore } from '@/src/stores/cartStore'
import { useAuthStore } from '@/src/stores/authStore'

export function useCartItemCount(): number {
  const cart = useCartStore(s => s.cart)
  const guestHydrated = useCartStore(s => s.guestHydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return 0
  if (isAuthenticated || guestHydrated) {
    return cart?.item_count ?? 0
  }
  return 0
}
