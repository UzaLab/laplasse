'use client'

import { CartDrawer } from '@/components/layout/CartDrawer'
import { CartSync } from '@/components/layout/CartSync'

/** Panier global — monté une seule fois dans le layout racine. */
export function GlobalCartChrome() {
  return (
    <>
      <CartSync />
      <CartDrawer />
    </>
  )
}
