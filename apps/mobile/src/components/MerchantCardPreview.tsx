import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { AppImage } from '@/src/components/ui/AppImage'
import { colors, fonts } from '@/src/theme'

export function MerchantCardPreview({
  merchant,
  onPressProduct,
  onPressVertical,
}: {
  merchant: Pick<ApiMerchant, 'slug' | 'has_marketplace' | 'featured_product' | 'featured_vertical'>
  onPressProduct: (merchantSlug: string, productSlug: string) => void
  onPressVertical: (merchantSlug: string, tab: string) => void
}) {
  if (merchant.has_marketplace && merchant.featured_product) {
    const product = merchant.featured_product
    return (
      <Pressable
        onPress={() => onPressProduct(merchant.slug, product.slug)}
        style={({ pressed }) => [styles.snippet, pressed && styles.pressed]}
      >
        <AppImage uri={product.image} style={styles.thumb} fallbackLetter={product.name.slice(0, 1)} />
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Ionicons name="storefront-outline" size={11} color={colors.primary} />
            <Text style={styles.badge}>En vitrine</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
          <Text style={styles.price}>{product.price}</Text>
        </View>
        <View style={styles.action}>
          <Ionicons name="add" size={16} color={colors.onBackground} />
        </View>
      </Pressable>
    )
  }

  if (merchant.featured_vertical) {
    const item = merchant.featured_vertical
    const icon =
      item.kind === 'menu'
        ? 'restaurant-outline'
        : item.kind === 'room'
          ? 'bed-outline'
          : item.kind === 'consultation'
            ? 'medkit-outline'
            : 'sparkles-outline'

    return (
      <Pressable
        onPress={() => onPressVertical(merchant.slug, item.tab)}
        style={({ pressed }) => [styles.snippet, pressed && styles.pressed]}
      >
        <AppImage uri={item.image} style={styles.thumb} fallbackLetter={item.name.slice(0, 1)} />
        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Ionicons name={icon} size={11} color={colors.primary} />
            <Text style={styles.badge}>{item.badge}</Text>
          </View>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {(item.price || item.meta) ? (
            <Text style={styles.price} numberOfLines={1}>
              {[item.price, item.meta].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>
        <View style={styles.action}>
          <Ionicons name="arrow-up-outline" size={14} color={colors.onBackground} />
        </View>
      </Pressable>
    )
  }

  return null
}

const styles = StyleSheet.create({
  snippet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.92 },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.border,
  },
  body: { flex: 1, minWidth: 0 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  badge: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: { fontFamily: fonts.bold, fontSize: 13, color: colors.onBackground },
  price: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary, marginTop: 2 },
  action: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: colors.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
})
