import { useQuery } from '@tanstack/react-query'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts } from '@/src/theme'

export function OrderDeliveryEtaBanner({
  orderId,
  enabled,
}: {
  orderId: string
  enabled: boolean
}) {
  const etaQuery = useQuery({
    queryKey: ['order-eta', orderId],
    queryFn: () => getApiClient().getOrderEta(orderId),
    enabled,
    refetchInterval: 8_000,
  })

  if (!enabled) return null

  if (etaQuery.isLoading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={colors.brand500} />
        <Text style={styles.loadingText}>Calcul de l&apos;horaire…</Text>
      </View>
    )
  }

  const eta = etaQuery.data
  if (!eta || (!eta.eta_minutes && !eta.prep_remaining_minutes)) return null

  const arrivalTime = eta.eta_arrival_at
    ? new Date(eta.eta_arrival_at).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <View style={styles.box}>
      <Ionicons name="time-outline" size={22} color={colors.emerald700} />
      <View style={styles.content}>
        {eta.prep_remaining_minutes > 0 ? (
          <Text style={styles.primary}>
            Préparation · ~{eta.prep_remaining_minutes} min restantes
          </Text>
        ) : null}
        {eta.eta_minutes > 0 ? (
          <Text style={eta.prep_remaining_minutes > 0 ? styles.secondary : styles.primary}>
            {eta.prep_remaining_minutes > 0 ? 'Arrivée estimée' : 'Livraison estimée'}
            {' '}
            {arrivalTime ? `vers ${arrivalTime}` : `dans ~${eta.eta_minutes} min`}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  loadingText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 14,
  },
  content: { flex: 1, gap: 2 },
  primary: { fontFamily: fonts.semibold, fontSize: 14, color: colors.slate900 },
  secondary: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
})
