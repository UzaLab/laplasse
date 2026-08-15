import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { CheckoutSteps } from '@/src/components/checkout/CheckoutSteps'
import { FoodCheckoutSteps } from '@/src/components/checkout/FoodCheckoutSteps'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'

export function CheckoutWizardShell({
  step,
  children,
  footer,
  flow = 'marketplace',
}: {
  step: 1 | 2 | 3 | 4
  children: ReactNode
  footer?: ReactNode
  flow?: 'marketplace' | 'food'
}) {
  return (
    <PublicScreenShell activeRoute="marketplace" showBottomNav={false}>
      <PublicTopBar showCart={false} />
      {flow === 'food' ? <FoodCheckoutSteps current={step} /> : <CheckoutSteps current={step} />}
      <View style={styles.body}>{children}</View>
      {footer}
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
})
