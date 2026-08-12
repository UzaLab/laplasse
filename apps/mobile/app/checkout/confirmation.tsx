import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { CheckoutOrderSummary } from '@/src/components/checkout/CheckoutOrderSummary'
import { CheckoutWizardShell } from '@/src/components/checkout/CheckoutWizardShell'
import { PrimaryButton } from '@/src/components/ui'
import { clearCheckoutConfirmation, getCheckoutConfirmation } from '@/src/lib/checkoutSession'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function CheckoutConfirmationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { status, orderIds } = useLocalSearchParams<{ status?: string; orderIds?: string }>()
  const [confirmation, setConfirmation] = useState<Awaited<ReturnType<typeof getCheckoutConfirmation>>>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      if (status !== 'success' && status !== 'failure') {
        router.replace('/cart')
        return
      }
      const stored = await getCheckoutConfirmation()
      if (!stored || stored.status !== status) {
        router.replace('/cart')
        return
      }
      if (orderIds) {
        const ids = orderIds.split(',').filter(Boolean)
        if (!ids.every(id => stored.orderIds.includes(id))) {
          router.replace('/cart')
          return
        }
      }
      setConfirmation(stored)
      setReady(true)
    })()
  }, [status, orderIds, router])

  if (!ready || !confirmation) {
    return (
      <CheckoutWizardShell step={4}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand500} />
        </View>
      </CheckoutWizardShell>
    )
  }

  const success = confirmation.status === 'success'
  const cartSnapshot = {
    id: 'snapshot',
    items: confirmation.cartSnapshot.items,
    subtotal: confirmation.cartSnapshot.subtotal,
    currency: confirmation.cartSnapshot.currency,
    item_count: confirmation.cartSnapshot.item_count,
    merchant: confirmation.cartSnapshot.merchant,
    merchants: confirmation.cartSnapshot.merchants,
    merchant_count: confirmation.cartSnapshot.merchant_count,
  }

  return (
    <CheckoutWizardShell step={4}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: layout.bottomNavHeight + insets.bottom + 24 },
        ]}
      >
        <View style={[styles.iconWrap, success ? styles.iconSuccess : styles.iconFailure]}>
          <Ionicons
            name={success ? 'checkmark-circle' : 'close-circle'}
            size={48}
            color={success ? colors.emerald700 : colors.danger}
          />
        </View>
        <Text style={styles.title}>
          {success ? 'Commande confirmée !' : 'Paiement échoué'}
        </Text>
        <Text style={styles.subtitle}>
          {success
            ? `Réf. ${confirmation.references.join(', ')}`
            : 'Vous pouvez réessayer depuis vos commandes.'}
        </Text>

        <CheckoutOrderSummary
          cart={cartSnapshot}
          promoDiscount={confirmation.discountAmount ?? 0}
          deliveryFee={confirmation.deliveryFee ?? 0}
        />

        <Text style={styles.total}>
          Total · {formatPrice(confirmation.total, confirmation.currency)}
        </Text>

        {success && confirmation.orderIds[0] ? (
          <PrimaryButton
            label="Voir ma commande"
            onPress={() => router.replace(`/orders/${confirmation.orderIds[0]}` as never)}
          />
        ) : (
          <PrimaryButton label="Retour au panier" onPress={() => router.replace('/cart')} />
        )}

        <Pressable
          onPress={async () => {
            await clearCheckoutConfirmation()
            router.replace('/(tabs)/orders')
          }}
        >
          <Text style={styles.link}>Mes commandes</Text>
        </Pressable>
      </ScrollView>
    </CheckoutWizardShell>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.gutter, gap: 16 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  iconSuccess: { backgroundColor: colors.emerald50 },
  iconFailure: { backgroundColor: '#fef2f2' },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  total: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  link: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700, textAlign: 'center', paddingVertical: 12 },
})
