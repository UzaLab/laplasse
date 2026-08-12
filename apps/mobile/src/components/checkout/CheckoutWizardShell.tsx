import type { ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { CheckoutSteps } from '@/src/components/checkout/CheckoutSteps'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'

export function CheckoutWizardShell({
  step,
  children,
  footer,
}: {
  step: 1 | 2 | 3 | 4
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <PublicScreenShell activeRoute="marketplace">
      <PublicTopBar showCart={false} />
      <CheckoutSteps current={step} />
      <View style={styles.body}>{children}</View>
      {footer}
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  body: { flex: 1 },
})
