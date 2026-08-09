import { StyleSheet, Text, View } from 'react-native'
import type { OrderStatus } from '@laplasse/api-client'
import { ORDER_STATUS_LABELS, isActiveOrderStatus } from '@/src/lib/orderUtils'
import { colors, fonts } from '@/src/theme'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const active = isActiveOrderStatus(status)
  return (
    <View style={[styles.badge, active ? styles.active : styles.inactive]}>
      <Text style={[styles.text, active ? styles.activeText : styles.inactiveText]}>
        {ORDER_STATUS_LABELS[status] ?? status}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  active: { backgroundColor: colors.brand100 },
  inactive: { backgroundColor: colors.border },
  text: { fontFamily: fonts.semibold, fontSize: 12 },
  activeText: { color: colors.brand800 },
  inactiveText: { color: colors.textMuted },
})
