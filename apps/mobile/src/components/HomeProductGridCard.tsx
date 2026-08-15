import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { formatPrice } from '@laplasse/shared-config'
import type { FeaturedProduct } from '@laplasse/api-client'
import { ProductCardAddControl } from '@/src/components/ProductCardAddControl'
import { colors, fonts, homeLayout } from '@/src/theme'

export function HomeProductGridCard({
  product,
  onPress,
}: {
  product: FeaturedProduct
  onPress: () => void
}) {
  const displayPrice = product.promo_price ?? product.price

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {product.image_url ? (
        <AppImage uri={product.image_url} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.shop} numberOfLines={1}>{product.merchant.business_name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
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
  price: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    color: colors.primary,
    flex: 1,
  },
})
