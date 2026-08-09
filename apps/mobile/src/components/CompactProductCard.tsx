import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import type { FeaturedProduct } from '@laplasse/api-client'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function CompactProductCard({
  product,
  onPress,
  width,
}: {
  product: FeaturedProduct
  onPress: () => void
  width?: number
}) {
  const displayPrice = product.promo_price ?? product.price

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width != null ? { width } : styles.cardFull,
        pressed && styles.pressed,
      ]}
    >
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
        <Text style={styles.merchant} numberOfLines={1}>{product.merchant.business_name}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardFull: { width: '100%' },
  pressed: { opacity: 0.92 },
  image: { width: '100%', height: 140 },
  imageFallback: { backgroundColor: colors.brand50 },
  body: { padding: 10 },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
    minHeight: 34,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
    marginTop: 4,
  },
  merchant: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
})
