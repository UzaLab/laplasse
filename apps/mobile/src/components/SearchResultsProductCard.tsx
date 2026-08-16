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
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    ...shadows.card,
    flex: 1,
  },
  flex: { flex: 1 },
  pressed: { opacity: 0.92 },
  image: { width: '100%', aspectRatio: 1 },
  body: { padding: 10 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
    minHeight: 32,
    lineHeight: 16,
  },
  price: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.brand700,
    marginTop: 4,
  },
})
