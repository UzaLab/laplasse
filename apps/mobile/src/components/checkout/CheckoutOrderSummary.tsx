import { StyleSheet, Text, View } from 'react-native'
import type { Cart, DeliveryQuoteItem } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { colors, fonts, homeLayout } from '@/src/theme'

export function CheckoutOrderSummary({
  cart,
  promoDiscount = 0,
  deliveryFee = 0,
  showDeliveryPlaceholder = false,
  deliveryQuotes = [],
}: {
  cart: Cart
  promoDiscount?: number
  deliveryFee?: number
  showDeliveryPlaceholder?: boolean
  deliveryQuotes?: DeliveryQuoteItem[]
}) {
  const estimatedTotal = Math.max(0, cart.subtotal - promoDiscount + deliveryFee)
  const itemLabel = cart.item_count > 1 ? `${cart.item_count} articles` : '1 article'

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Résumé de la commande</Text>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Sous-total ({itemLabel})</Text>
        <Text style={styles.rowValue}>{formatPrice(cart.subtotal, cart.currency)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.rowLabel}>TVA (18%)</Text>
        <Text style={styles.rowValue}>Inclus</Text>
      </View>
      {promoDiscount > 0 ? (
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Réduction promo</Text>
          <Text style={[styles.rowValue, styles.discount]}>− {formatPrice(promoDiscount, cart.currency)}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Text style={styles.rowLabel}>Frais de livraison</Text>
        {showDeliveryPlaceholder ? (
          <Text style={styles.badge}>Étape livraison</Text>
        ) : deliveryFee > 0 ? (
          <Text style={styles.rowValue}>{formatPrice(deliveryFee, cart.currency)}</Text>
        ) : (
          <Text style={styles.rowValue}>Gratuit</Text>
        )}
      </View>

      {deliveryQuotes.length > 0 ? (
        <View style={styles.quotes}>
          {deliveryQuotes.map(q => (
            <Text key={q.shop_id} style={styles.quoteLine}>
              {q.shop_name} · {q.available ? formatPrice(q.fee, cart.currency) : (q.message ?? 'Indisponible')}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.divider} />
      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total estimé</Text>
        <Text style={styles.totalValue}>{formatPrice(estimatedTotal, cart.currency)}</Text>
      </View>
      {showDeliveryPlaceholder ? (
        <Text style={styles.hint}>Hors frais de livraison jusqu&apos;à l&apos;étape 2</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 10,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  rowLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, flex: 1 },
  rowValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  discount: { color: colors.emerald700 },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  quotes: { gap: 4, marginTop: 4 },
  quoteLine: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  totalLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  totalValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight, marginTop: 4 },
})
