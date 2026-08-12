import { Alert, Pressable, StyleSheet, Text, View, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { FeaturedProduct } from '@laplasse/api-client'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, homeLayout } from '@/src/theme'

export function HomeProductGridCard({
  product,
  onPress,
}: {
  product: FeaturedProduct
  onPress: () => void
}) {
  const addItem = useCartStore(s => s.addItem)
  const displayPrice = product.promo_price ?? product.price

  async function onAdd(e?: { stopPropagation?: () => void }) {
    e?.stopPropagation?.()
    const result = await addItem(product.id, 1)
    if (result.error) {
      Alert.alert('Panier', result.error)
      return
    }
    Alert.alert('Panier', 'Article ajouté')
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.shop} numberOfLines={1}>{product.merchant.business_name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
          <Pressable
            onPress={() => void onAdd()}
            style={({ pressed: p }) => [styles.addBtn, p && styles.addBtnPressed]}
            hitSlop={8}
            accessibilityLabel="Ajouter au panier"
          >
            <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
          </Pressable>
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
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { opacity: 0.85 },
})
