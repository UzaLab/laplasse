import { Image, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import type { MarketplaceProduct } from '@laplasse/api-client'
import { Card } from '@/src/components/ui'
import { colors, fonts } from '@/src/theme'

export function ProductCard({
  product,
  onPress,
}: {
  product: MarketplaceProduct
  onPress: () => void
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          {product.merchant ? (
            <Text style={styles.merchant}>{product.merchant.business_name}</Text>
          ) : null}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  image: { width: 72, height: 72, borderRadius: 12 },
  imageFallback: { backgroundColor: colors.border },
  content: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  price: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700, marginTop: 4 },
  merchant: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 4 },
})
