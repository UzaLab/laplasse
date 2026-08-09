import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
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

export default function DeliveryTrackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()

  const trackQuery = useQuery({
    queryKey: ['delivery-track', token],
    queryFn: () => getApiClient().getDeliveryTrack(String(token)),
    enabled: !!token,
    refetchInterval: (query: { state: { data?: { status?: string } } }) => {
      const status = query.state.data?.status
      if (!status || ['DELIVERED', 'CANCELLED', 'FAILED'].includes(status)) return false
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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Ionicons name="bicycle" size={32} color={colors.brand600} />
        <Text style={styles.status}>{statusLabel}</Text>
        {data.eta_minutes != null ? (
          <Text style={styles.eta}>~{data.eta_minutes} min</Text>
        ) : null}
      </View>

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

      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={40} color={colors.textLight} />
        <Text style={styles.mapHint}>
          {data.courier_latitude && data.dropoff_latitude
            ? 'Position coursier mise à jour en temps réel'
            : 'Carte disponible sur la version web'}
        </Text>
      </View>
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
  eta: { fontFamily: fonts.medium, fontSize: 15, color: colors.brand700, marginTop: 4 },
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
  mapPlaceholder: {
    height: 160,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapHint: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24 },
})
