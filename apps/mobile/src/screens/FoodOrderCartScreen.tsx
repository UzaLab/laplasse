import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { CheckoutItemCard } from '@/src/components/checkout/CheckoutItemCard'
import { CheckoutOrderSummary } from '@/src/components/checkout/CheckoutOrderSummary'
import { CheckoutWizardShell } from '@/src/components/checkout/CheckoutWizardShell'
import { EmptyState, PrimaryButton } from '@/src/components/ui'
import { getCartKind } from '@/src/lib/cartKind'
import { foodMinOrderMessage, foodSchedulingBlockMessage } from '@/src/lib/foodOrder'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, spacing } from '@/src/theme'

export function FoodOrderCartScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)
  const cart = useCartStore(s => s.cart)
  const loading = useCartStore(s => s.loading)
  const guestHydrated = useCartStore(s => s.guestHydrated)
  const updatingItemId = useCartStore(s => s.updatingItemId)
  const loadCart = useCartStore(s => s.loadCart)
  const updateQuantity = useCartStore(s => s.updateQuantity)

  useEffect(() => {
    if (hydrated) void loadCart()
  }, [hydrated, isAuthenticated, loadCart])

  useEffect(() => {
    if (!hydrated || !cart?.items.length) return
    const kind = getCartKind(cart)
    if (kind === 'marketplace') {
      router.replace('/cart')
      return
    }
    if (kind === 'mixed') {
      notify.error('Panier incompatible', 'Retirez les articles boutique ou restaurant.')
    }
  }, [cart, hydrated, router])

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) router.replace('/(auth)/login')
  }, [hydrated, isAuthenticated, router])

  const merchantSlug = useMemo(() => {
    const item = cart?.items.find(i => i.product.merchant?.slug)
    return item?.product.merchant?.slug
  }, [cart])

  const merchantName = cart?.merchant?.business_name ?? 'Restaurant'
  const minOrderAmount = cart?.merchant?.food_min_order_amount ?? null
  const minOrderMessage = foodMinOrderMessage(minOrderAmount, cart?.subtotal ?? 0)
  const foodScheduling = cart?.food_scheduling ?? null
  const foodBlocked = foodScheduling?.blocked ?? false
  const canProceed = (cart?.items.length ?? 0) > 0 && !minOrderMessage && !foodBlocked

  const onCheckout = useCallback(() => {
    if (!canProceed) return
    router.push('/checkout')
  }, [canProceed, router])

  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => updateQuantity(itemId, quantity),
    [updateQuantity],
  )

  if (!hydrated || (loading && !cart && !guestHydrated)) {
    return (
      <CheckoutWizardShell step={1} flow="food">
        <View style={styles.loader}>
          <ActivityIndicator color="#ea580c" />
        </View>
      </CheckoutWizardShell>
    )
  }

  const items = cart?.items ?? []
  const footerPad = insets.bottom + 80

  return (
    <CheckoutWizardShell
      step={1}
      flow="food"
      footer={
        items.length > 0 ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <PrimaryButton
              label="Choisir livraison ou retrait"
              onPress={onCheckout}
              disabled={!canProceed}
            />
          </View>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: footerPad }]}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="restaurant-outline" size={20} color="#ea580c" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Ma commande</Text>
            <Text style={styles.subtitle}>{merchantName}</Text>
          </View>
        </View>

        {items.length === 0 ? (
          <EmptyState
            title="Aucun plat sélectionné"
            subtitle="Parcourez le menu d'un restaurant pour commander."
          />
        ) : (
          <>
            {items.map(item => (
              <CheckoutItemCard
                key={item.id}
                item={item}
                currency={cart?.currency}
                isUpdating={updatingItemId === item.id}
                onUpdateQuantity={handleUpdateQuantity}
                showMerchant={false}
                modifiersAccent
              />
            ))}

            {merchantSlug ? (
              <Pressable
                onPress={() => router.push(`/restauration/${merchantSlug}`)}
                style={styles.continueLink}
              >
                <Ionicons name="arrow-back" size={16} color="#ea580c" />
                <Text style={styles.continueText}>Ajouter d'autres plats</Text>
              </Pressable>
            ) : null}

            {cart ? (
              <CheckoutOrderSummary cart={cart} showDeliveryPlaceholder />
            ) : null}

            {minOrderMessage ? (
              <Text style={styles.warning}>{minOrderMessage}</Text>
            ) : null}
            {foodScheduling?.requires_preorder ? (
              <Text style={styles.info}>
                Restaurant fermé — vous choisirez votre créneau à l'étape livraison.
              </Text>
            ) : null}
            {foodBlocked ? (
              <Text style={styles.error}>{foodSchedulingBlockMessage(foodScheduling)}</Text>
            ) : null}

            {cart?.estimated_prep_minutes ? (
              <Text style={styles.prepHint}>
                Préparation estimée ~ {cart.estimated_prep_minutes} min
              </Text>
            ) : (
              <Text style={styles.prepHint}>Préparation estimée 25–45 min</Text>
            )}
          </>
        )}
      </ScrollView>
    </CheckoutWizardShell>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.gutter, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  subtitle: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 2 },
  continueLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  continueText: { fontFamily: fonts.bold, fontSize: 14, color: '#ea580c' },
  warning: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#b45309',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 12,
  },
  info: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#1d4ed8',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 12,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#b91c1c',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 12,
  },
  prepHint: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.gutter,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
