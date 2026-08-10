import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatPrice } from '@laplasse/shared-config'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'
import { EmptyState, LoadingState, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function CartScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)
  const cart = useCartStore(s => s.cart)
  const loading = useCartStore(s => s.loading)
  const loadCart = useCartStore(s => s.loadCart)
  const updateQuantity = useCartStore(s => s.updateQuantity)

  useEffect(() => {
    if (isAuthenticated) void loadCart()
  }, [isAuthenticated, loadCart])

  if (!hydrated) {
    return (
      <PublicScreenShell showBottomNav={false}>
        <PublicTopBar showCart={false} />
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <PublicScreenShell>
        <PublicTopBar showCart={false} />
        <View style={styles.center}>
          <Text style={styles.title}>Panier</Text>
          <EmptyState title="Connectez-vous" subtitle="Votre panier est disponible après connexion." />
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </View>
      </PublicScreenShell>
    )
  }

  if (loading && !cart) {
    return (
      <PublicScreenShell showBottomNav={false}>
        <PublicTopBar showCart={false} />
        <LoadingState />
      </PublicScreenShell>
    )
  }

  const items = cart?.items ?? []
  const footerPad = layout.bottomNavHeight + insets.bottom + 72

  return (
    <PublicScreenShell>
      <PublicTopBar showCart={false} />
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: footerPad }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Panier</Text>
            {cart ? (
              <Text style={styles.subtotal}>
                Sous-total · {formatPrice(cart.subtotal, cart.currency)}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState title="Panier vide" subtitle="Parcourez les boutiques pour ajouter des articles." />
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemPrice}>{formatPrice(item.line_total, cart?.currency)}</Text>
            <View style={styles.qtyRow}>
              <SecondaryButton label="−" onPress={() => void updateQuantity(item.id, item.quantity - 1)} />
              <Text style={styles.qty}>{item.quantity}</Text>
              <SecondaryButton label="+" onPress={() => void updateQuantity(item.id, item.quantity + 1)} />
            </View>
          </View>
        )}
      />
      {items.length > 0 ? (
        <View style={[styles.footer, { paddingBottom: layout.bottomNavHeight + insets.bottom + 12 }]}>
          <PrimaryButton label="Commander" onPress={() => router.push('/checkout')} />
        </View>
      ) : null}
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, padding: spacing.gutter, justifyContent: 'center' },
  header: { paddingHorizontal: spacing.gutter, paddingTop: 8, paddingBottom: 12 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.text,
  },
  subtotal: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
  list: { paddingHorizontal: spacing.gutter },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.text,
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.brand700,
    marginTop: 4,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  qty: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    minWidth: 24,
    textAlign: 'center',
    color: colors.text,
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
