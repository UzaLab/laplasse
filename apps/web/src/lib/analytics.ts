'use client'

import posthog from 'posthog-js'

export type CheckoutFunnelStep =
  | 'cart_viewed'
  | 'checkout_started'
  | 'checkout_delivery_completed'
  | 'payment_started'
  | 'payment_success'
  | 'payment_failure'

export function captureCheckoutStep(
  step: CheckoutFunnelStep,
  props?: Record<string, string | number | boolean | null | undefined>,
) {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.capture('checkout_funnel', {
    step,
    flow: 'marketplace',
    ...props,
  })
}
