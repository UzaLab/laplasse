import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { formatPrice } from '@laplasse/shared-config'
import type { FeaturedProduct } from '@laplasse/api-client'
import { ProductCardAddControl } from '@/src/components/ProductCardAddControl'
import { ProductCardBadges } from '@/src/components/ProductCardBadges'
import { getProductDisplayPrices } from '@/src/lib/productPromoUtils'
import { colors, fonts, homeLayout } from '@/src/theme'

export function HomeProductGridCard({
  product,
  onPress,
  showBestSeller = false,
}: {
  product: FeaturedProduct
  onPress: () => void
  showBestSeller?: boolean
}) {
  const priceInfo = getProductDisplayPrices(product)

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.imageWrap}>
        <ProductCardBadges
          promotion={product.promotion}
          createdAt={product.created_at}
          isBestSeller={product.is_best_seller}
          salesCount={product.sales_count}
          showBestSeller={showBestSeller}
        />
        {product.image_url ? (
          <AppImage uri={product.image_url} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.shop} numberOfLines={1}>{product.merchant.business_name}</Text>
        <View style={styles.footer}>
          <View style={styles.priceCol}>
            <Text style={styles.price}>{formatPrice(priceInfo.displayPrice, product.currency)}</Text>
            {priceInfo.originalPrice != null && priceInfo.hasDiscount ? (
              <Text style={styles.originalPrice}>
                {formatPrice(priceInfo.originalPrice, product.currency)}
              </Text>
            ) : null}
          </View>
          <ProductCardAddControl productId={product.id} />
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
  imageWrap: { position: 'relative' },
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
  shop: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  priceCol: { flex: 1, gap: 2 },
  price: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
  },
  originalPrice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textLight,
    textDecorationLine: 'line-through',
  },
})
