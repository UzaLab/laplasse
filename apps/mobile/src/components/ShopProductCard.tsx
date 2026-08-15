import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { MarketplaceProduct } from '@laplasse/api-client'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { ProductCardAddControl } from '@/src/components/ProductCardAddControl'
import { resolveProductQuickAdd } from '@/src/lib/productAddMeta'
import { colors, fonts, homeLayout } from '@/src/theme'

export function ShopProductCard({
  product,
  onPress,
  showBestSeller = false,
}: {
  product: MarketplaceProduct
  onPress: () => void
  showBestSeller?: boolean
}) {
  const displayPrice =
    'promo_price' in product && product.promo_price != null
      ? (product as MarketplaceProduct & { promo_price?: number }).promo_price!
      : product.price
  const { needsVariant, variantId } = resolveProductQuickAdd(product)

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {showBestSeller ? (
        <View style={styles.bestSellerBadge}>
          <Text style={styles.bestSellerText}>BEST-SELLER</Text>
        </View>
      ) : null}
      {product.image_url ? (
        <AppImage uri={product.image_url} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
          <ProductCardAddControl
            productId={product.id}
            variantId={variantId}
            needsVariant={needsVariant}
            onNeedsVariant={onPress}
          />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surfaceBright,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: 'rgba(216, 195, 173, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  pressed: { opacity: 0.95 },
  bestSellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestSellerText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.onPrimaryContainer,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  image: { width: '100%', aspectRatio: 1 },
  imageFallback: { backgroundColor: colors.surfaceContainerLow },
  body: { padding: 12, flex: 1, justifyContent: 'space-between' },
  name: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 22,
    color: colors.onBackground,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  price: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
    flex: 1,
  },
})
