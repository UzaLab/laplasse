import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { FlatList, StyleSheet, Text } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import { EmptyState, LoadingState, PrimaryButton, Screen, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

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
      <Screen>
        <Title>Commandes</Title>
        <EmptyState title="Connectez-vous" subtitle="Retrouvez ici l'historique de vos commandes." />
        <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
      </Screen>
    )
  }

  if (ordersQuery.isLoading) return <LoadingState />

  const orders = ordersQuery.data?.data ?? []

  return (
    <Screen padded={false}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Title>Commandes</Title>}
        ListEmptyComponent={<EmptyState title="Aucune commande" />}
        renderItem={({ item }) => (
          <Text style={styles.order}>
            #{item.id.slice(-6)} · {item.status} · {formatPrice(item.total, item.currency)}
          </Text>
        )}
      />
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12 },
  order: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
})
