'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useCartStore } from '@/stores/cartStore'
import { isSessionResolved } from '@/lib/authSession'

/** Charge ou réinitialise le panier selon l'état de session auth. */
export function CartSync() {
  const sessionStatus = useAuthStore(s => s.sessionStatus)
  const loadCart = useCartStore(s => s.loadCart)
  const reset = useCartStore(s => s.reset)

  useEffect(() => {
    if (!isSessionResolved(sessionStatus)) return
    if (sessionStatus === 'authenticated') {
      void loadCart()
    } else {
      reset()
    }
  }, [sessionStatus, loadCart, reset])

  return null
}
