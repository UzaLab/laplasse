import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import { EmptyState, LoadingState, PrimaryButton, Screen, SecondaryButton, Title } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors } from '@/src/theme'

export default function CartScreen() {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)
  const cart = useCartStore(s => s.cart)
  const loading = useCartStore(s => s.loading)
  const loadCart = useCartStore(s => s.loadCart)
  const updateQuantity = useCartStore(s => s.updateQuantity)

  useEffect(() => {
    if (isAuthenticated) void loadCart()
  }, [isAuthenticated, loadCart])

  if (!hydrated) return <LoadingState />

  if (!isAuthenticated) {
    return (
      <Screen>
        <Title>Panier</Title>
        <EmptyState title="Connectez-vous" subtitle="Votre panier est disponible après connexion." />
        <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
      </Screen>
    )
  }

  if (loading && !cart) return <LoadingState />

  const items = cart?.items ?? []

  return (
    <Screen padded={false}>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Title>Panier</Title>
            {cart ? (
              <Text style={styles.subtotal}>
                Sous-total · {formatPrice(cart.subtotal, cart.currency)}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={<EmptyState title="Panier vide" subtitle="Parcourez les boutiques pour ajouter des articles." />}
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
        <View style={styles.footer}>
          <PrimaryButton label="Commander" onPress={() => router.push('/checkout')} />
        </View>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 16 },
  subtotal: { color: colors.textMuted, marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemName: { fontSize: 16, fontWeight: '600', color: colors.text },
  itemPrice: { color: colors.primary, marginTop: 4, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  qty: { fontSize: 16, fontWeight: '600', minWidth: 24, textAlign: 'center' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
