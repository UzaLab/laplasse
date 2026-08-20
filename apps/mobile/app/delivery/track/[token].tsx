import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { DeliveryTrackMap } from '@/src/components/delivery/DeliveryTrackMap'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, spacing } from '@/src/theme'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente d\'assignation',
  ASSIGNED: 'Coursier assigné',
  PICKED_UP: 'Colis récupéré',
  IN_TRANSIT: 'En route',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
  FAILED: 'Échec',
}

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'FAILED'])

function formatArrivalTime(iso: string | null | undefined): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function DeliveryTrackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()

  const trackQuery = useQuery({
    queryKey: ['delivery-track', token],
    queryFn: () => getApiClient().getDeliveryTrack(String(token)),
    enabled: !!token,
    refetchInterval: (query: { state: { data?: { status?: string } } }) => {
      const status = query.state.data?.status
      if (!status || TERMINAL_STATUSES.has(status)) return false
      if (status === 'IN_TRANSIT' || status === 'PICKED_UP') return 4_000
      return 8_000
    },
  })

  if (trackQuery.isLoading) return <LoadingState />

  const data = trackQuery.data
  if (!data) {
    return (
      <View style={styles.center}>
        <EmptyState title="Suivi indisponible" subtitle="Ce lien de suivi est invalide ou expiré." />
      </View>
    )
  }

  const statusLabel = STATUS_LABELS[data.status] ?? data.status
  const isActive = !TERMINAL_STATUSES.has(data.status)
  const arrivalTime = formatArrivalTime(data.eta_arrival_at)

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="bicycle" size={32} color={colors.brand600} />
        <Text style={styles.status}>{statusLabel}</Text>
        {isActive && data.eta_minutes != null ? (
          <Text style={styles.eta}>
            Arrivée estimée
            {arrivalTime ? ` vers ${arrivalTime}` : ''}
            {' '}
            · ~{data.eta_minutes} min
          </Text>
        ) : null}
        {isActive && (data.prep_remaining_minutes ?? 0) > 0 ? (
          <Text style={styles.etaSecondary}>
            Préparation · ~{data.prep_remaining_minutes} min restantes
          </Text>
        ) : null}
      </View>

      <DeliveryTrackMap
        status={data.status}
        courierLatitude={data.courier_latitude}
        courierLongitude={data.courier_longitude}
        dropoffLatitude={data.dropoff_latitude}
        dropoffLongitude={data.dropoff_longitude}
        dropoffAddress={data.dropoff_address}
      />

      {data.delivery_code ? (
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Code de livraison</Text>
          <Text style={styles.codeValue}>{data.delivery_code}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Commande · {data.order.shop.name}</Text>
        {data.dropoff_address ? (
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={colors.textMuted} />
            <Text style={styles.meta}>{data.dropoff_address}</Text>
          </View>
        ) : null}
      </View>

      {data.courier ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Coursier</Text>
          <Text style={styles.courierName}>{data.courier.full_name}</Text>
          {data.courier.vehicle ? (
            <Text style={styles.meta}>{data.courier.vehicle}</Text>
          ) : null}
          {data.courier.phone ? (
            <Pressable
              style={styles.callBtn}
              onPress={() => void Linking.openURL(`tel:${data.courier!.phone}`)}
            >
              <Ionicons name="call" size={16} color="#fff" />
              <Text style={styles.callText}>Appeler le coursier</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.gutter, gap: 16, paddingBottom: 40 },
  center: { flex: 1, padding: spacing.gutter, justifyContent: 'center' },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  status: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text, marginTop: 8 },
  eta: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brand700,
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  etaSecondary: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  codeCard: {
    backgroundColor: colors.slate900,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  codeLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.textLight },
  codeValue: { fontFamily: fonts.extrabold, fontSize: 28, color: '#fff', letterSpacing: 4, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  meta: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  courierName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: colors.brand600,
    paddingVertical: 12,
    borderRadius: 12,
  },
  callText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
})
