import type { Order } from '@laplasse/api-client'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import {
  DELIVERY_DISPUTE_REASONS,
  DELIVERY_DISPUTE_STATUS_LABELS,
  ORDER_RETURN_REASON_LABELS,
  ORDER_RETURN_STATUS_LABELS,
} from '@/src/lib/orderSav'
import type { OrderReturnReason } from '@laplasse/api-client'
import { colors, fonts, radii } from '@/src/theme'

export function SavStatusBanner({ order }: { order: Order }) {
  const items: ReactNode[] = []

  if (order.return_request) {
    const rr = order.return_request
    const tone =
      rr.status === 'APPROVED' || rr.status === 'REFUNDED'
        ? styles.success
        : rr.status === 'REJECTED'
          ? styles.error
          : styles.pending

    items.push(
      <View key="return" style={[styles.banner, tone]}>
        <Text style={styles.title}>Retour / SAV</Text>
        <Text style={styles.body}>
          {ORDER_RETURN_STATUS_LABELS[rr.status]}
          {' · '}
          {ORDER_RETURN_REASON_LABELS[rr.reason as OrderReturnReason] ?? rr.reason}
        </Text>
        {rr.merchant_note ? (
          <Text style={styles.note}>Réponse marchand : {rr.merchant_note}</Text>
        ) : null}
      </View>,
    )
  }

  if (order.delivery_dispute) {
    const dd = order.delivery_dispute
    const tone =
      dd.status === 'RESOLVED'
        ? styles.success
        : dd.status === 'DISMISSED'
          ? styles.neutral
          : styles.pending
    const reasonLabel =
      DELIVERY_DISPUTE_REASONS.find(r => r.value === dd.reason)?.label ?? dd.reason

    items.push(
      <View key="dispute" style={[styles.banner, tone]}>
        <Text style={styles.title}>Litige livraison</Text>
        <Text style={styles.body}>
          {DELIVERY_DISPUTE_STATUS_LABELS[dd.status]}
          {' · '}
          {reasonLabel}
        </Text>
        {dd.admin_note ? (
          <Text style={styles.note}>Réponse : {dd.admin_note}</Text>
        ) : null}
      </View>,
    )
  }

  if (items.length === 0) return null

  return <View style={styles.wrap}>{items}</View>
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  banner: {
    borderRadius: radii.card - 4,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  pending: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand200,
  },
  success: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  error: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  neutral: {
    backgroundColor: colors.surfaceContainerLow,
    borderColor: colors.border,
  },
  title: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  body: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  note: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
})
