import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { CheckoutOrderSummary } from '@/src/components/checkout/CheckoutOrderSummary'
import { CheckoutWizardShell } from '@/src/components/checkout/CheckoutWizardShell'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import {
  buildCheckoutConfirmation,
  clearCheckoutSession,
  getCheckoutSession,
  saveCheckoutConfirmation,
} from '@/src/lib/checkoutSession'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function PaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [session, setSession] = useState<Awaited<ReturnType<typeof getCheckoutSession>>>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    void (async () => {
      const stored = await getCheckoutSession()
      if (!stored) {
        router.replace('/checkout')
        return
      }
      setSession(stored)
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/(auth)/login')
    }
  }, [hydrated, isAuthenticated, router])

  async function confirm(method: 'success' | 'failure') {
    if (!session) return
    const paymentIds = session.checkoutResult.orders.map(o => o.paymentId).filter(Boolean)
    if (!paymentIds.length) {
      Alert.alert('Paiement', 'Aucun paiement en attente')
      return
    }
    setLoading(true)
    try {
      const result =
        paymentIds.length > 1
          ? await getApiClient().confirmBatchOrderPayments(paymentIds, method)
          : await getApiClient().confirmOrderPayment(paymentIds[0], method)

      const confirmation = buildCheckoutConfirmation(session, method === 'success' ? 'success' : 'failure')
      await saveCheckoutConfirmation(confirmation)
      await clearCheckoutSession()

      router.replace({
        pathname: '/checkout/confirmation',
        params: { status: confirmation.status, orderIds: confirmation.orderIds.join(',') },
      } as never)

      if (method === 'failure') {
        Alert.alert('Paiement refusé', result.message)
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Paiement impossible')
    } finally {
      setLoading(false)
    }
  }

  if (!ready || !session) {
    return (
      <CheckoutWizardShell step={3}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand500} />
        </View>
      </CheckoutWizardShell>
    )
  }

  const cartSnapshot = {
    id: 'snapshot',
    items: session.cartSnapshot.items,
    subtotal: session.cartSnapshot.subtotal,
    currency: session.cartSnapshot.currency,
    item_count: session.cartSnapshot.item_count,
    merchant: session.cartSnapshot.merchant,
    merchants: session.cartSnapshot.merchants,
    merchant_count: session.cartSnapshot.merchant_count,
  }

  return (
    <CheckoutWizardShell step={3}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: layout.bottomNavHeight + insets.bottom + 24 },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="phone-portrait-outline" size={36} color={colors.brand600} />
        </View>
        <Text style={styles.title}>Paiement Mobile Money</Text>
        <Text style={styles.subtitle}>
          Wave · Orange Money · MTN MoMo{'\n'}
          Total · {formatPrice(session.checkoutResult.total, session.checkoutResult.currency)}
        </Text>

        <CheckoutOrderSummary
          cart={cartSnapshot}
          promoDiscount={session.discountAmount ?? 0}
          deliveryFee={session.deliveryFee ?? 0}
          deliveryQuotes={session.deliveryQuotes ?? []}
        />

        <PrimaryButton label="Confirmer le paiement" onPress={() => void confirm('success')} loading={loading} />
        <SecondaryButton label="Simuler un échec" onPress={() => void confirm('failure')} />
        <Text style={styles.hint}>Préprod : simulateur instantané côté API.</Text>
      </ScrollView>
    </CheckoutWizardShell>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.gutter, gap: 16 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight, textAlign: 'center' },
})
