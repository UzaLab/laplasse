import { Pressable, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import type { ApiProductSearchHit } from '@laplasse/api-client'
import { AppImage } from '@/src/components/ui/AppImage'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function SearchResultsProductCard({
  product,
  onPress,
  width,
}: {
  product: ApiProductSearchHit
  onPress: () => void
  width?: number
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width != null ? { width } : styles.flex,
        pressed && styles.pressed,
      ]}
    >
      <AppImage uri={product.image_url} style={styles.image} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
        <Text style={styles.merchant} numberOfLines={1}>{product.merchant.business_name}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card - 4,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  flex: { flex: 1 },
  pressed: { opacity: 0.92 },
  image: { width: '100%', height: 120 },
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
