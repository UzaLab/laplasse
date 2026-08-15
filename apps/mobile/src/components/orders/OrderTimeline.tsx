import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { DeliveryType, OrderStatus } from '@laplasse/api-client'
import { colors, fonts } from '@/src/theme'

const BASE_FLOW_PICKUP: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Commande reçue' },
  { status: 'CONFIRMED', label: 'Confirmée par la boutique' },
  { status: 'PREPARING', label: 'En préparation' },
  { status: 'READY', label: 'Prête pour retrait' },
]

const BASE_FLOW_DELIVERY: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Commande reçue' },
  { status: 'CONFIRMED', label: 'Confirmée par la boutique' },
  { status: 'PREPARING', label: 'En préparation' },
  { status: 'READY', label: 'Prête pour expédition' },
]

const DELIVERY_EXTRA: { status: OrderStatus; label: string }[] = [
  { status: 'OUT_FOR_DELIVERY', label: 'En route vers vous' },
  { status: 'DELIVERED', label: 'Livrée' },
]

const PICKUP_END = { status: 'COMPLETED' as OrderStatus, label: 'Terminée' }

function statusIndex(flow: { status: OrderStatus }[]) {
  return Object.fromEntries(flow.map((s, i) => [s.status, i])) as Record<OrderStatus, number>
}

export function OrderTimeline({
  status,
  deliveryType = 'PICKUP',
}: {
  status: OrderStatus
  deliveryType?: DeliveryType
}) {
  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <View style={styles.cancelledBox}>
        <Ionicons name="close-circle" size={20} color={colors.danger} />
        <Text style={styles.cancelledText}>
          {status === 'REFUNDED' ? 'Commande remboursée' : 'Commande annulée'}
        </Text>
      </View>
    )
  }

  const isDelivery = deliveryType === 'DELIVERY'
  const baseFlow = isDelivery ? BASE_FLOW_DELIVERY : BASE_FLOW_PICKUP
  const flow = isDelivery
    ? [...baseFlow, ...DELIVERY_EXTRA, PICKUP_END]
    : [...baseFlow, PICKUP_END]

  const indexMap = statusIndex(flow)
  const currentIndex = indexMap[status] ?? 0

  return (
    <View style={styles.root}>
      {flow.map((step, index) => {
        const done = index < currentIndex || (status === 'COMPLETED' && step.status === 'COMPLETED')
        const active = index === currentIndex && !(status === 'COMPLETED' && step.status === 'COMPLETED')
        const upcoming = index > currentIndex
        const isDeliveryStep = step.status === 'OUT_FOR_DELIVERY' || step.status === 'DELIVERED'

        return (
          <View key={step.status} style={styles.stepRow}>
            <View style={styles.rail}>
              <View style={[
                styles.dot,
                done && styles.dotDone,
                active && styles.dotActive,
                !done && !active && styles.dotUpcoming,
              ]}>
                {done ? (
                  <Ionicons name="checkmark" size={14} color="#fff" />
                ) : active && isDeliveryStep ? (
                  <Ionicons name="car-outline" size={14} color="#fff" />
                ) : (
                  <View style={[styles.innerDot, active && styles.innerDotActive]} />
                )}
              </View>
              {index < flow.length - 1 ? (
                <View style={[styles.line, done && styles.lineDone]} />
              ) : null}
            </View>
            <View style={[styles.stepBody, upcoming && styles.stepUpcoming]}>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>
                {step.label}
              </Text>
              {active && step.status !== 'COMPLETED' ? (
                <Text style={styles.stepHint}>Étape en cours</Text>
              ) : null}
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 0 },
  cancelledBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 14,
  },
  cancelledText: { fontFamily: fonts.semibold, fontSize: 14, color: '#991b1b', flex: 1 },
  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 32 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.success, borderColor: colors.success },
  dotActive: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  dotUpcoming: { backgroundColor: colors.surface, borderColor: colors.borderStrong },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textLight,
  },
  innerDotActive: { backgroundColor: '#fff' },
  line: {
    width: 2,
    flex: 1,
    minHeight: 24,
    backgroundColor: colors.borderStrong,
    marginVertical: 4,
  },
  lineDone: { backgroundColor: '#34d399' },
  stepBody: { flex: 1, paddingBottom: 24 },
  stepUpcoming: { opacity: 0.5 },
  stepLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
  stepLabelActive: { color: colors.brand800 },
  stepHint: { fontFamily: fonts.medium, fontSize: 12, color: colors.brand700, marginTop: 2 },
})
