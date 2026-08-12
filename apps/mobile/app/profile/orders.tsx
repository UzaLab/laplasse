import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { OrderStatus } from '@laplasse/api-client'
import {
  ProfileCard,
  ProfileFilterTabs,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { formatOrderRef, getSellerName } from '@/src/lib/orderUtils'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

type Filter = 'all' | 'active' | 'delivered' | 'cancelled'

const ACTIVE: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY']
const DELIVERED: OrderStatus[] = ['DELIVERED', 'COMPLETED']
const CANCELLED: OrderStatus[] = ['CANCELLED', 'REFUNDED']

function matchesFilter(status: OrderStatus, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'active') return ACTIVE.includes(status)
  if (filter === 'delivered') return DELIVERED.includes(status)
  return CANCELLED.includes(status)
}

export default function ProfileOrdersScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => getApiClient().getMyOrders(),
  })

  const filtered = useMemo(
    () => (ordersQuery.data ?? []).filter(o => matchesFilter(o.status, filter)),
    [ordersQuery.data, filter],
  )

  if (ordersQuery.isLoading) return <LoadingState />

  return (
    <View style={styles.root}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={ordersQuery.isFetching}
            onRefresh={() => void ordersQuery.refetch()}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ProfilePageTitle
              title="Mes commandes"
              subtitle="Suivez vos achats marketplace et leur livraison."
            />
            <ProfileFilterTabs
              tabs={[
                { id: 'all' as const, label: 'Toutes' },
                { id: 'active' as const, label: 'En cours' },
                { id: 'delivered' as const, label: 'Livrées' },
                { id: 'cancelled' as const, label: 'Annulées' },
              ]}
              active={filter}
              onChange={setFilter}
            />
          </View>
        }
        ListEmptyComponent={
          <ProfileCard>
            <EmptyState
              title="Aucune commande"
              subtitle="Vos achats apparaîtront ici."
            />
            <Pressable
              style={styles.marketBtn}
              onPress={() => router.push('/(tabs)/marketplace' as never)}
            >
              <Text style={styles.marketBtnText}>Aller au marketplace</Text>
            </Pressable>
          </ProfileCard>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/orders/${item.id}` as never)}>
            <ProfileCard>
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
              <Ionicons
                name="chevron-forward"
                size={18}
                color={profileTheme.textLight}
                style={styles.chevron}
              />
            </ProfileCard>
          </Pressable>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: profileTheme.bg },
  list: {
    padding: 20,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 12,
  },
  header: { gap: 16, marginBottom: 4 },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderRef: { fontFamily: profileTheme.fonts.bold, fontSize: 16, color: profileTheme.text },
  seller: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 14,
    color: profileTheme.textMuted,
    marginBottom: 8,
  },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: profileTheme.fonts.regular, fontSize: 13, color: profileTheme.textLight },
  total: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.accent },
  chevron: { position: 'absolute', right: 16, top: '50%' },
  marketBtn: {
    marginTop: 12,
    alignSelf: 'center',
    backgroundColor: profileTheme.navActiveBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  marketBtnText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
})
