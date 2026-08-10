import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { EmptyState, LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  formatOrderRef,
  getSellerName,
  getSellerPhone,
  isActiveOrderStatus,
} from '@/src/lib/orderUtils'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii, spacing } from '@/src/theme'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => getApiClient().getOrder(String(id)),
    enabled: isAuthenticated && !!id,
    refetchInterval: query => {
      const order = query.state.data
      if (!order || !isActiveOrderStatus(order.status)) return false
      if (order.delivery_type !== 'DELIVERY') return false
      return 12_000
    },
  })

  const etaQuery = useQuery({
    queryKey: ['order-eta', id],
    queryFn: () => getApiClient().getOrderEta(String(id)),
    enabled: !!orderQuery.data && isActiveOrderStatus(orderQuery.data.status),
    refetchInterval: 8_000,
  })

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <EmptyState title="Connectez-vous" />
        <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
      </View>
    )
  }

  if (orderQuery.isLoading) return <LoadingState />

  const order = orderQuery.data
  if (!order) {
    return (
      <View style={styles.center}>
        <EmptyState title="Commande introuvable" />
        <PrimaryButton label="Retour" onPress={() => router.back()} />
      </View>
    )
  }

  const seller = getSellerName(order)
  const phone = getSellerPhone(order)
  const trackingToken = order.delivery_job?.tracking_token
  const showTrack =
    order.delivery_type === 'DELIVERY' &&
    trackingToken &&
    isActiveOrderStatus(order.status)

  const pendingPayment = order.status === 'PENDING' && order.payment?.status === 'PENDING'

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Text style={styles.ref}>{formatOrderRef(order.id)}</Text>
        <OrderStatusBadge status={order.status} />
        <Text style={styles.date}>
          {new Date(order.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        <Text style={styles.seller}>{seller}</Text>
        {etaQuery.data?.eta_minutes != null ? (
          <Text style={styles.eta}>Arrivée estimée · ~{etaQuery.data.eta_minutes} min</Text>
        ) : null}
      </View>

      {pendingPayment && order.payment?.id ? (
        <PrimaryButton
          label="Payer (Mobile Money)"
          onPress={() =>
            router.push({
              pathname: '/payment' as never,
              params: { paymentId: order.payment!.id!, orderId: order.id },
            })
          }
        />
      ) : null}

      {showTrack ? (
        <PrimaryButton
          label="Suivre la livraison"
          onPress={() => router.push(`/delivery/track/${trackingToken}` as never)}
        />
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Articles</Text>
        {(order.items ?? []).map(item => (
          <View key={item.id} style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.variant_name ? (
                <Text style={styles.itemVariant}>{item.variant_name}</Text>
              ) : null}
              <Text style={styles.itemQty}>× {item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>
              {formatPrice(item.line_total, order.currency)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Livraison</Text>
        <Text style={styles.meta}>
          {order.delivery_type === 'DELIVERY' ? 'Livraison' : 'Retrait sur place'}
        </Text>
        {order.delivery_address ? (
          <Text style={styles.meta}>{order.delivery_address}</Text>
        ) : null}
        {order.customer_phone ? (
          <Text style={styles.meta}>Tél. {order.customer_phone}</Text>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.total, order.currency)}</Text>
        </View>
        {order.payment?.reference ? (
          <Text style={styles.meta}>Réf. paiement · {order.payment.reference}</Text>
        ) : null}
      </View>

      {phone ? (
        <View style={styles.actions}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => openWhatsApp(phone, `Bonjour, question sur ${formatOrderRef(order.id)}`)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
            <Text style={styles.actionText}>WhatsApp vendeur</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={() => void Linking.openURL(`tel:${phone}`)}>
            <Ionicons name="call-outline" size={18} color={colors.text} />
            <Text style={styles.actionText}>Appeler</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.gutter, gap: 16, paddingBottom: 40 },
  center: { flex: 1, padding: spacing.gutter, justifyContent: 'center' },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  ref: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  date: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  seller: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  eta: { fontFamily: fonts.medium, fontSize: 14, color: colors.brand700 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemName: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  itemVariant: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  itemQty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textLight, marginTop: 2 },
  itemPrice: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.brand700 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
})
