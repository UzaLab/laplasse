import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import type { CartItem } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { AppImage } from '@/src/components/ui/AppImage'
import { colors, fonts } from '@/src/theme'

const PLACEHOLDER_IMAGE = 'https://cdn.laplasse.ci/static/product-placeholder.png'

export function CheckoutItemCard({
  item,
  currency,
  isUpdating,
  onUpdateQuantity,
  showMerchant = true,
  modifiersAccent = false,
}: {
  item: CartItem
  currency?: string
  isUpdating: boolean
  onUpdateQuantity: (itemId: string, quantity: number) => void
  showMerchant?: boolean
  modifiersAccent?: boolean
}) {
  const router = useRouter()
  const product = item.product
  const merchantSlug = product.merchant?.slug
  const isMenuLine = item.line_kind === 'menu' || Boolean(item.menu_item_id)

  return (
    <View style={styles.itemCard}>
      <Pressable
        onPress={() => {
          if (isMenuLine && merchantSlug) {
            router.push(`/restauration/${merchantSlug}`)
            return
          }
          if (merchantSlug) router.push(`/m/${merchantSlug}/p/${product.slug}`)
        }}
      >
        <AppImage uri={product.image_url ?? PLACEHOLDER_IMAGE} style={styles.thumb} />
      </Pressable>
      <View style={styles.itemBody}>
        {showMerchant && product.merchant ? (
          <Pressable
            onPress={() => {
              if (isMenuLine && merchantSlug) {
                router.push(`/restauration/${merchantSlug}`)
                return
              }
              if (merchantSlug) router.push(`/m/${merchantSlug}/boutique`)
            }}
          >
            <Text style={styles.merchant}>{product.merchant.business_name}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        {item.modifiers_label ? (
          <Text style={[styles.modifiers, modifiersAccent && styles.modifiersFood]} numberOfLines={3}>
            {item.modifiers_label}
          </Text>
        ) : item.variant ? (
          <Text style={styles.variant}>{item.variant.name}</Text>
        ) : null}
        <Text style={styles.unitPrice}>
          {formatPrice(item.unit_price, currency)} / unité
        </Text>
        <View style={styles.itemFooter}>
          <View style={styles.qtyWrap}>
            <Pressable
              disabled={isUpdating}
              onPress={() => void onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              style={styles.qtyBtn}
            >
              <Ionicons name="remove" size={16} color={colors.textMuted} />
            </Pressable>
            <Text style={styles.qty}>{item.quantity}</Text>
            <Pressable
              disabled={isUpdating}
              onPress={() => void onUpdateQuantity(item.id, item.quantity + 1)}
              style={styles.qtyBtn}
            >
              <Ionicons name="add" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
          <Text style={styles.lineTotal}>{formatPrice(item.line_total, currency)}</Text>
          <Pressable
            disabled={isUpdating}
            onPress={() => void onUpdateQuantity(item.id, 0)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={20} color={colors.textLight} />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 88, height: 88, borderRadius: 14, backgroundColor: colors.surfaceContainerLow },
  itemBody: { flex: 1, minWidth: 0 },
  merchant: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.brand700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  productName: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  variant: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modifiers: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modifiersFood: { color: '#c2410c' },
  unitPrice: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  qtyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 2,
  },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qty: { fontFamily: fonts.bold, fontSize: 14, minWidth: 24, textAlign: 'center', color: colors.text },
  lineTotal: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.text, flex: 1, textAlign: 'right' },
})
