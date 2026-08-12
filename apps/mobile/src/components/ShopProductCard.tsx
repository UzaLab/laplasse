import { Alert, ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { MarketplaceProduct } from '@laplasse/api-client'
import { useCartStore } from '@/src/stores/cartStore'
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
  const addItem = useCartStore(s => s.addItem)
  const loading = useCartStore(s => s.loading)
  const displayPrice =
    'promo_price' in product && product.promo_price != null
      ? (product as MarketplaceProduct & { promo_price?: number }).promo_price!
      : product.price
  const needsVariant = product.has_variants

  async function onAdd() {
    if (needsVariant) {
      onPress()
      return
    }
    const variantId = product.variants?.[0]?.id
    const result = await addItem(product.id, 1, variantId)
    if (result.error) {
      Alert.alert('Panier', result.error)
      return
    }
    Alert.alert('Panier', 'Article ajouté')
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {showBestSeller ? (
        <View style={styles.bestSellerBadge}>
          <Text style={styles.bestSellerText}>BEST-SELLER</Text>
        </View>
      ) : null}
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
          <Pressable
            onPress={() => void onAdd()}
            style={({ pressed: p }) => [styles.addBtn, p && styles.addBtnPressed]}
            hitSlop={8}
            accessibilityLabel="Ajouter au panier"
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
            ) : (
              <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
            )}
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
