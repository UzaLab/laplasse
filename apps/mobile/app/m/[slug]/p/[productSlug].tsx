import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import type { ProductVariant } from '@laplasse/api-client'
import { ProductFavoriteButton } from '@/src/components/ProductFavoriteButton'
import { LoadingState, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, spacing } from '@/src/theme'

export default function ProductScreen() {
  const { slug, productSlug } = useLocalSearchParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addItem = useCartStore(s => s.addItem)
  const [adding, setAdding] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)

  const productQuery = useQuery({
    queryKey: ['product', slug, productSlug],
    queryFn: () => getApiClient().getProduct(String(slug), String(productSlug)),
    enabled: !!slug && !!productSlug,
  })

  const product = productQuery.data
  const variants = product?.variants?.filter(v => v.stock_quantity > 0) ?? []
  const activeVariant = selectedVariant ?? variants[0] ?? null

  const displayPrice = useMemo(() => {
    if (!product) return 0
    return activeVariant?.price ?? product.price
  }, [product, activeVariant])

  if (productQuery.isLoading) return <LoadingState />

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Produit introuvable</Text>
      </View>
    )
  }

  async function onAddToCart(buyNow = false) {
    if (!isAuthenticated) {
      router.push('/(auth)/login')
      return
    }
    setAdding(true)
    const result = await addItem(product!.id, 1, activeVariant?.id)
    setAdding(false)
    if (result.error) {
      Alert.alert('Panier', result.error)
      return
    }
    if (buyNow) {
      router.push('/checkout')
      return
    }
    Alert.alert('Panier', 'Article ajouté', [
      { text: 'Continuer' },
      { text: 'Voir le panier', onPress: () => router.push('/cart') },
    ])
  }

  const imageUri = activeVariant?.image_url ?? product.image_url

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imageFallback]} />
          )}
          <View style={styles.favBtn}>
            <ProductFavoriteButton productId={product.id} size={24} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>

          {variants.length > 1 ? (
            <View style={styles.variants}>
              <Text style={styles.variantLabel}>Variante</Text>
              <View style={styles.variantRow}>
                {variants.map(v => {
                  const active = activeVariant?.id === v.id
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => setSelectedVariant(v)}
                      style={[styles.variantPill, active && styles.variantPillActive]}
                    >
                      <Text style={[styles.variantText, active && styles.variantTextActive]}>
                        {v.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          ) : null}

          {product.short_description ? (
            <Text style={styles.desc}>{product.short_description}</Text>
          ) : null}
          {product.description ? (
            <Text style={styles.desc}>{product.description}</Text>
          ) : null}

          {product.stock_quantity != null && product.stock_quantity <= 5 ? (
            <Text style={styles.stockWarn}>Plus que {product.stock_quantity} en stock</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <SecondaryButton label="Ajouter" onPress={() => void onAddToCart(false)} />
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Acheter" onPress={() => void onAddToCart(true)} loading={adding} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 320 },
  imageFallback: { backgroundColor: colors.border },
  favBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999 },
  body: { padding: spacing.gutter },
  name: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  price: { fontFamily: fonts.bold, fontSize: 22, color: colors.brand700, marginTop: 8, marginBottom: 16 },
  variants: { marginBottom: 16 },
  variantLabel: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  variantPillActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  variantText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  variantTextActive: { color: '#fff' },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 8 },
  stockWarn: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger, marginTop: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
})
