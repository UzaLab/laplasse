import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import { EmptyState, LoadingState, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { buildOrderReceiptText } from '@/src/lib/orderReceipt'
import { formatOrderRef, getSellerName } from '@/src/lib/orderUtils'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii, spacing } from '@/src/theme'

export default function OrderReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const orderQuery = useQuery({
    queryKey: ['order-receipt', id],
    queryFn: () => getApiClient().getOrder(String(id)),
    enabled: isAuthenticated && !!id,
  })

  async function shareReceipt() {
    const order = orderQuery.data
    if (!order) return
    try {
      await Share.share({
        message: buildOrderReceiptText(order),
        title: `Reçu ${formatOrderRef(order.id)}`,
      })
    } catch {
      notify.error('Partage', 'Impossible de partager le reçu.')
    }
  }

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

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.brand}>LaPlasse</Text>
        <Text style={styles.title}>Reçu de commande</Text>
        <Text style={styles.ref}>{formatOrderRef(order.id)}</Text>
      </View>

      <View style={styles.metaGrid}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Vendeur</Text>
          <Text style={styles.metaValue}>{seller}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Date</Text>
          <Text style={styles.metaValue}>
            {new Date(order.created_at).toLocaleString('fr-FR')}
          </Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Statut</Text>
          <Text style={styles.metaValue}>{order.status}</Text>
        </View>
        {order.payment?.reference ? (
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Réf. paiement</Text>
            <Text style={styles.metaValueMono}>{order.payment.reference}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.table}>
        <View style={styles.tableHead}>
          <Text style={[styles.th, styles.thArticle]}>Article</Text>
          <Text style={styles.th}>Qté</Text>
          <Text style={[styles.th, styles.thRight]}>Total</Text>
        </View>
        {(order.items ?? []).map(item => (
          <View key={item.id} style={styles.tableRow}>
            <View style={styles.tdArticle}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.variant_name ? (
                <Text style={styles.itemVariant}>{item.variant_name}</Text>
              ) : null}
            </View>
            <Text style={styles.tdQty}>{item.quantity}</Text>
            <Text style={styles.tdTotal}>{formatPrice(item.line_total, order.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Sous-total</Text>
          <Text style={styles.totalValue}>{formatPrice(order.subtotal, order.currency)}</Text>
        </View>
        {(order.discount_amount ?? 0) > 0 ? (
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.discount]}>Remise</Text>
            <Text style={[styles.totalValue, styles.discount]}>
              -{formatPrice(order.discount_amount ?? 0, order.currency)}
            </Text>
          </View>
        ) : null}
        {(order.delivery_fee ?? 0) > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Livraison</Text>
            <Text style={styles.totalValue}>
              {formatPrice(order.delivery_fee ?? 0, order.currency)}
            </Text>
          </View>
        ) : null}
        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>{formatPrice(order.total, order.currency)}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        Document généré par LaPlasse — {new Date().toLocaleDateString('fr-FR')}
      </Text>

      <PrimaryButton label="Partager le reçu" onPress={() => void shareReceipt()} />
      <SecondaryButton label="Retour à la commande" onPress={() => router.back()} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.gutter, paddingBottom: 40, gap: 16 },
  center: { flex: 1, justifyContent: 'center', padding: spacing.gutter, gap: 16 },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingBottom: 16,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text, marginTop: 4 },
  ref: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaBlock: { width: '45%', flexGrow: 1 },
  metaLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  metaValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginTop: 4 },
  metaValueMono: { fontFamily: fonts.medium, fontSize: 12, color: colors.text, marginTop: 4 },
  table: { gap: 0 },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    paddingBottom: 8,
  },
  th: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted, width: 40 },
  thArticle: { flex: 1, width: undefined },
  thRight: { textAlign: 'right', width: 88 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tdArticle: { flex: 1 },
  itemName: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  itemVariant: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  tdQty: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    width: 40,
    textAlign: 'center',
  },
  tdTotal: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    width: 88,
    textAlign: 'right',
  },
  totals: { marginLeft: 'auto', width: '100%', maxWidth: 280, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  totalValue: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  discount: { color: colors.emerald700 },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    paddingTop: 10,
    marginTop: 4,
  },
  grandLabel: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  grandValue: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.brand700 },
  footer: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    textAlign: 'center',
    marginVertical: 8,
  },
})
