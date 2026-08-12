import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { CartPromoApplication } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { CheckoutOrderSummary } from '@/src/components/checkout/CheckoutOrderSummary'
import { CheckoutWizardShell } from '@/src/components/checkout/CheckoutWizardShell'
import { EmptyState, PrimaryButton } from '@/src/components/ui'
import {
  clearCartPromos,
  getCartPromos,
  getTotalPromoDiscount,
  saveCartPromos,
} from '@/src/lib/cartPromo'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

const PLACEHOLDER_IMAGE = 'https://cdn.laplasse.ci/static/product-placeholder.png'

export function CartScreen() {
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

  const [promoCode, setPromoCode] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [appliedPromos, setAppliedPromos] = useState<CartPromoApplication[]>([])

  useEffect(() => {
    if (hydrated) void loadCart()
  }, [hydrated, isAuthenticated, loadCart])

  const cartShopIds = useMemo(
    () => cart?.merchants?.map(m => m.id) ?? (cart?.merchant ? [cart.merchant.id] : []),
    [cart],
  )

  useEffect(() => {
    void getCartPromos(cartShopIds).then(setAppliedPromos)
  }, [cartShopIds.join(',')])

  useEffect(() => {
    if (!cart?.items.length) {
      void clearCartPromos()
      setAppliedPromos([])
    }
  }, [cart?.items.length])

  const promoDiscount = useMemo(() => getTotalPromoDiscount(appliedPromos), [appliedPromos])

  const handleApplyPromo = useCallback(async () => {
    if (!isAuthenticated) return
    if (!promoCode.trim()) {
      Alert.alert('Promo', 'Entrez un code promo')
      return
    }
    setPromoLoading(true)
    try {
      const result = await getApiClient().applyCartPromo(promoCode.trim())
      const valid = result.applications.filter(a => a.valid)
      if (!valid.length) {
        Alert.alert('Promo', result.applications[0]?.message ?? 'Code promo invalide')
        return
      }
      const merged = [
        ...appliedPromos.filter(p => !valid.some(v => v.shop_id === p.shop_id)),
        ...valid,
      ]
      setAppliedPromos(merged)
      await saveCartPromos(merged, cartShopIds)
      Alert.alert('Promo', valid.map(v => v.message ?? 'Code appliqué').join(' · '))
    } catch (err) {
      Alert.alert('Promo', err instanceof Error ? err.message : 'Code invalide')
    } finally {
      setPromoLoading(false)
    }
  }, [appliedPromos, cartShopIds, isAuthenticated, promoCode])

  const onCheckout = () => {
    if (cart?.kind === 'food' || cart?.kind === 'mixed') {
      Alert.alert('Panier', 'Les commandes restaurant nécessitent une connexion et un parcours dédié.')
      return
    }
    router.push('/checkout')
  }

  if (!hydrated || (loading && !cart && !guestHydrated)) {
    return (
      <CheckoutWizardShell step={1}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand500} />
        </View>
      </CheckoutWizardShell>
    )
  }

  const items = cart?.items ?? []
  const footerPad = layout.bottomNavHeight + insets.bottom + 88

  return (
    <CheckoutWizardShell
      step={1}
      footer={
        items.length > 0 ? (
          <View style={[styles.footer, { paddingBottom: layout.bottomNavHeight + insets.bottom + 12 }]}>
            <PrimaryButton label="Procéder à la livraison" onPress={onCheckout} />
          </View>
        ) : null
      }
    >
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: footerPad }]}>
        <Text style={styles.title}>Panier</Text>

        {items.length === 0 ? (
          <EmptyState
            title="Panier vide"
            subtitle="Découvrez la marketplace LaPlasse."
          />
        ) : (
          <>
            {items.map(item => {
              const product = item.product
              const merchantSlug = product.merchant?.slug
              const isUpdating = updatingItemId === item.id
              return (
                <View key={item.id} style={styles.itemCard}>
                  <Pressable
                    onPress={() =>
                      merchantSlug && router.push(`/m/${merchantSlug}/p/${product.slug}`)
                    }
                  >
                    {product.image_url ? (
                      <Image source={{ uri: product.image_url }} style={styles.thumb} />
                    ) : (
                      <Image source={{ uri: PLACEHOLDER_IMAGE }} style={styles.thumb} />
                    )}
                  </Pressable>
                  <View style={styles.itemBody}>
                    {product.merchant ? (
                      <Pressable onPress={() => merchantSlug && router.push(`/m/${merchantSlug}/boutique`)}>
                        <Text style={styles.merchant}>{product.merchant.business_name}</Text>
                      </Pressable>
                    ) : null}
                    <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                    {item.variant ? (
                      <Text style={styles.variant}>{item.variant.name}</Text>
                    ) : null}
                    <Text style={styles.unitPrice}>
                      {formatPrice(item.unit_price, cart?.currency)} / unité
                    </Text>
                    <View style={styles.itemFooter}>
                      <View style={styles.qtyWrap}>
                        <Pressable
                          disabled={isUpdating}
                          onPress={() => void updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="remove" size={16} color={colors.textMuted} />
                        </Pressable>
                        <Text style={styles.qty}>{item.quantity}</Text>
                        <Pressable
                          disabled={isUpdating}
                          onPress={() => void updateQuantity(item.id, item.quantity + 1)}
                          style={styles.qtyBtn}
                        >
                          <Ionicons name="add" size={16} color={colors.textMuted} />
                        </Pressable>
                      </View>
                      <Text style={styles.lineTotal}>{formatPrice(item.line_total, cart?.currency)}</Text>
                      <Pressable
                        disabled={isUpdating}
                        onPress={() => void updateQuantity(item.id, 0)}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={20} color={colors.textLight} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              )
            })}

            <Pressable onPress={() => router.push('/(tabs)/marketplace')} style={styles.continueLink}>
              <Ionicons name="arrow-back" size={16} color={colors.brand700} />
              <Text style={styles.continueText}>Continuer mes achats</Text>
            </Pressable>

            {cart ? (
              <CheckoutOrderSummary
                cart={cart}
                promoDiscount={promoDiscount}
                showDeliveryPlaceholder
              />
            ) : null}

            {isAuthenticated ? (
              <View style={styles.promoBlock}>
                <Text style={styles.promoLabel}>Code promo</Text>
                <View style={styles.promoRow}>
                  <TextInput
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholder="Entrez votre code"
                    placeholderTextColor={colors.textLight}
                    style={styles.promoInput}
                    autoCapitalize="characters"
                  />
                  <PrimaryButton
                    label={promoLoading ? '…' : 'Appliquer'}
                    onPress={() => void handleApplyPromo()}
                    loading={promoLoading}
                  />
                </View>
              </View>
            ) : (
              <Text style={styles.guestPromoHint}>
                Connectez-vous pour utiliser un code promo
              </Text>
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
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, marginBottom: 4 },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 88, height: 88, borderRadius: 14, backgroundColor: colors.surfaceContainerLow },
  itemBody: { flex: 1, minWidth: 0 },
  merchant: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.brand700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  productName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  variant: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  unitPrice: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 2,
  },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qty: { fontFamily: fonts.bold, fontSize: 14, minWidth: 24, textAlign: 'center', color: colors.text },
  lineTotal: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, flex: 1, textAlign: 'right' },
  continueLink: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  continueText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  promoBlock: { gap: 8 },
  promoLabel: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoInput: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  guestPromoHint: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: 8,
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
