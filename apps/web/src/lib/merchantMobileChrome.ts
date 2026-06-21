/** Coordination barre d'actions mobile ↔ paniers / formulaires fixés en bas */

export const MERCHANT_BOTTOM_DOCK_EVENT = 'laplasse:merchant-bottom-dock'

export type MerchantBottomDockDetail = {
  active: boolean
  source?: string
}

export function setMerchantBottomDock(active: boolean, source?: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent<MerchantBottomDockDetail>(MERCHANT_BOTTOM_DOCK_EVENT, {
      detail: { active, source },
    }),
  )
}
