import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { formatPrice } from '@laplasse/shared-config'
import type { MarketplaceCatalogProduct } from '@laplasse/api-client'
import { ProductCardAddControl } from '@/src/components/ProductCardAddControl'
import { resolveProductQuickAdd } from '@/src/lib/productAddMeta'
import { colors, fonts, homeLayout } from '@/src/theme'

export function MarketplaceProductGridCard({
  product,
  onPress,
  showMerchantName = true,
  showAddButton = true,
}: {
  product: MarketplaceCatalogProduct
  onPress: () => void
  showMerchantName?: boolean
  showAddButton?: boolean
}) {
  const displayPrice = product.promo_price ?? product.price
  const { needsVariant, variantId } = resolveProductQuickAdd(product)

  const merchantLabel =
    product.merchant?.business_name ?? product.shop?.name ?? null

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {product.image_url ? (
        <AppImage uri={product.image_url} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback]} />
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {showMerchantName && merchantLabel ? (
          <Text style={styles.shop} numberOfLines={1}>{merchantLabel}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
          {showAddButton ? (
            <ProductCardAddControl
              productId={product.id}
              variantId={variantId}
              needsVariant={needsVariant}
              onNeedsVariant={onPress}
            />
          ) : null}
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
    fontSize: 14,
    lineHeight: 20,
    color: colors.onBackground,
    marginBottom: 4,
  },
  shop: {
    fontFamily: fonts.semibold,
    fontSize: 11,
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
    fontSize: 15,
    color: colors.primary,
    flex: 1,
  },
})
