import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'
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
import { cashChangeDue } from '@/src/lib/foodCashTender'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, spacing } from '@/src/theme'

export default function PaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [session, setSession] = useState<Awaited<ReturnType<typeof getCheckoutSession>>>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cashExact, setCashExact] = useState(false)
  const [cashTenderInput, setCashTenderInput] = useState('')

  const isFoodFlow = session?.flow === 'food'
  const checkoutFlow = isFoodFlow ? 'food' : 'marketplace'

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
  }, [router])

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/(auth)/login')
  }, [hydrated, isAuthenticated, router])

  useEffect(() => {
    if (!session || !isFoodFlow) return
    setCashTenderInput('')
    setCashExact(false)
  }, [session?.checkoutResult.total, isFoodFlow])

  const cashTenderAmount = useMemo(() => {
    if (cashExact || !cashTenderInput.trim()) return null
    const parsed = Number(cashTenderInput.replace(/\s/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }, [cashExact, cashTenderInput])

  const cashTenderReady =
    !isFoodFlow
    || cashExact
    || (cashTenderAmount != null && cashTenderAmount >= (session?.checkoutResult.total ?? 0))

  async function confirm(method: 'success' | 'failure') {
    if (!session) return
    if (method === 'success' && isFoodFlow && !cashTenderReady) {
      Alert.alert('Paiement', 'Indiquez le montant exact ou saisissez le montant que vous présenterez.')
      return
    }
    const paymentIds = session.checkoutResult.orders.map(o => o.paymentId).filter(Boolean)
    if (!paymentIds.length) {
      Alert.alert('Paiement', 'Aucun paiement en attente')
      return
    }
    const cashTender =
      isFoodFlow && method === 'success'
        ? { exact: cashExact, tenderAmount: cashExact ? undefined : (cashTenderAmount ?? undefined) }
        : undefined

    setLoading(true)
    try {
      const result =
        paymentIds.length > 1
          ? await getApiClient().confirmBatchOrderPayments(paymentIds, method, cashTender)
          : await getApiClient().confirmOrderPayment(paymentIds[0], method, cashTender)

      const confirmation = buildCheckoutConfirmation(session, method === 'success' ? 'success' : 'failure')
      await saveCheckoutConfirmation(confirmation)
      await clearCheckoutSession()

      router.replace({
        pathname: '/checkout/confirmation',
        params: {
          status: confirmation.status,
          orderIds: confirmation.orderIds.join(','),
          ...(isFoodFlow ? { flow: 'food' } : {}),
        },
      } as never)

      if (method === 'failure') Alert.alert('Paiement refusé', result.message)
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Paiement impossible')
    } finally {
      setLoading(false)
    }
  }

  if (!ready || !session) {
    return (
      <CheckoutWizardShell step={3} flow={checkoutFlow}>
        <View style={styles.loader}>
          <ActivityIndicator color={isFoodFlow ? '#ea580c' : colors.brand500} />
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

  const changeDue = cashTenderAmount != null ? cashChangeDue(cashTenderAmount, session.checkoutResult.total) : 0

  return (
    <CheckoutWizardShell step={3} flow={checkoutFlow}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.iconWrap, isFoodFlow && styles.iconWrapFood]}>
          <Ionicons
            name={isFoodFlow ? 'cash-outline' : 'phone-portrait-outline'}
            size={36}
            color={isFoodFlow ? '#ea580c' : colors.brand600}
          />
        </View>
        <Text style={styles.title}>
          {isFoodFlow ? 'Paiement à la livraison' : 'Paiement Mobile Money'}
        </Text>
        <Text style={styles.subtitle}>
          {isFoodFlow
            ? `Préparez le montant en espèces\nTotal · ${formatPrice(session.checkoutResult.total, session.checkoutResult.currency)}`
            : `Wave · Orange Money · MTN MoMo\nTotal · ${formatPrice(session.checkoutResult.total, session.checkoutResult.currency)}`}
        </Text>

        {isFoodFlow ? (
          <View style={styles.cashBlock}>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>J'ai le montant exact</Text>
              <Switch
                value={cashExact}
                onValueChange={value => {
                  setCashExact(value)
                  if (value) setCashTenderInput('')
                }}
                trackColor={{ true: '#fb923c' }}
              />
            </View>
            {!cashExact ? (
              <>
                <Text style={styles.cashHint}>Montant que je présenterai (FCFA) *</Text>
                <TextInput
                  value={cashTenderInput}
                  onChangeText={setCashTenderInput}
                  placeholder="Ex : 10000"
                  placeholderTextColor={colors.textLight}
                  keyboardType="numeric"
                  style={styles.cashInput}
                />
                {cashTenderAmount != null && cashTenderAmount < session.checkoutResult.total ? (
                  <Text style={styles.cashError}>Montant insuffisant pour couvrir la commande.</Text>
                ) : null}
                {cashTenderAmount != null && changeDue > 0 ? (
                  <Text style={styles.changeHint}>
                    Monnaie à rendre : {formatPrice(changeDue, session.checkoutResult.currency)}
                  </Text>
                ) : null}
              </>
            ) : null}
          </View>
        ) : null}

        <CheckoutOrderSummary
          cart={cartSnapshot}
          promoDiscount={session.discountAmount ?? 0}
          deliveryFee={session.deliveryFee ?? 0}
          deliveryQuotes={session.deliveryQuotes ?? []}
        />

        <PrimaryButton
          label={isFoodFlow ? 'Confirmer la commande' : 'Confirmer le paiement'}
          onPress={() => void confirm('success')}
          loading={loading}
          disabled={isFoodFlow && !cashTenderReady}
        />
        {!isFoodFlow ? (
          <SecondaryButton label="Simuler un échec" onPress={() => void confirm('failure')} />
        ) : null}
        {!isFoodFlow ? (
          <Text style={styles.hint}>Préprod : simulateur instantané côté API.</Text>
        ) : null}
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
  iconWrapFood: { backgroundColor: '#ffedd5' },
  title: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  cashBlock: {
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 16,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  cashHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  cashInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surfaceContainerLow,
  },
  cashError: { fontFamily: fonts.medium, fontSize: 12, color: '#dc2626' },
  changeHint: { fontFamily: fonts.semibold, fontSize: 13, color: '#15803d' },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight, textAlign: 'center' },
})
