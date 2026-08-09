import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { AppHeader } from '@/src/components/AppHeader'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { EmptyState, LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { formatOrderRef, getSellerName } from '@/src/lib/orderUtils'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function OrdersScreen() {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => getApiClient().getMyOrders(),
    enabled: isAuthenticated,
  })

  if (!hydrated) return <LoadingState />

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <AppHeader />
        <View style={styles.center}>
          <EmptyState title="Connectez-vous" subtitle="Retrouvez ici l'historique de vos commandes." />
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    )
  }

  if (ordersQuery.isLoading) return <LoadingState />

  const orders = ordersQuery.data ?? []

  return (
    <View style={styles.root}>
      <AppHeader />
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={ordersQuery.isFetching} onRefresh={() => void ordersQuery.refetch()} />
        }
        ListHeaderComponent={<Text style={styles.title}>Mes commandes</Text>}
        ListEmptyComponent={<EmptyState title="Aucune commande" subtitle="Vos achats apparaîtront ici." />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.orderCard}
            onPress={() => router.push(`/orders/${item.id}` as never)}
          >
            <View style={styles.orderTop}>
              <Text style={styles.orderRef}>{formatOrderRef(item.id)}</Text>
              <OrderStatusBadge status={item.status} />
            </View>
            <Text style={styles.seller}>{getSellerName(item)}</Text>
            <View style={styles.orderBottom}>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </Text>
              <Text style={styles.total}>{formatPrice(item.total, item.currency)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textLight} style={styles.chevron} />
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, padding: spacing.gutter, justifyContent: 'center' },
  list: { padding: spacing.gutter, paddingBottom: layout.bottomNavInset + 24, gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, marginBottom: 16 },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  orderRef: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  seller: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: fonts.regular, fontSize: 13, color: colors.textLight },
  total: { fontFamily: fonts.bold, fontSize: 15, color: colors.brand700 },
  chevron: { position: 'absolute', right: 16, top: '50%' },
})
