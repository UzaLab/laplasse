import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice, getDefaultCity } from '@laplasse/shared-config'
import type { MarketplaceProduct, ProductVariant } from '@laplasse/api-client'
import { HomeProductGridCard } from '@/src/components/HomeProductGridCard'
import { ProductFavoriteButton } from '@/src/components/ProductFavoriteButton'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  getBoutiquePath,
  resolveBoutique,
  resolveProductBoutiqueSlug,
} from '@/src/lib/boutiqueResolve'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout, spacing } from '@/src/theme'

const THUMB_SIZE = (Dimensions.get('window').width - spacing.gutter * 2 - 12 * 3) / 4

function stockLabel(product: MarketplaceProduct, variant: ProductVariant | null): string | null {
  const qty = variant?.stock_quantity ?? product.stock_quantity
  if (qty == null) return null
  if (qty <= 0) return 'Rupture de stock'
  if (qty <= 5) return `En stock (${qty})`
  return 'En stock'
}

export default function ProductScreen() {
  const { slug, productSlug } = useLocalSearchParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const cityLabel = getDefaultCity(countryCode)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addItem = useCartStore(s => s.addItem)
  const [adding, setAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [activeImage, setActiveImage] = useState(0)
  const [activeTab] = useState<'description'>('description')

  const productQuery = useQuery({
    queryKey: ['product', slug, productSlug],
    queryFn: () => getApiClient().getProduct(String(slug), String(productSlug)),
    enabled: !!slug && !!productSlug,
  })

  const boutiqueResolveQuery = useQuery({
    queryKey: ['boutique-resolve', slug],
    queryFn: () => resolveBoutique(String(slug)),
    enabled: !!slug,
  })

  const relatedQuery = useQuery({
    queryKey: ['merchant-products-related', slug, productSlug],
    queryFn: async () => {
      const res = await getApiClient().getMerchantProducts(String(slug), 8)
      return res.data.filter(p => p.slug !== productSlug)
    },
    enabled: !!slug && !!productSlug,
  })

  const product = productQuery.data
  const variants = product?.variants?.filter(v => v.stock_quantity > 0) ?? []
  const activeVariant = selectedVariant ?? variants[0] ?? null

  const images = useMemo(() => {
    if (!product) return [] as string[]
    const list = [...(product.images ?? [])]
    const main = activeVariant?.image_url ?? product.image_url
    if (main && !list.includes(main)) list.unshift(main)
    return list.length > 0 ? list : main ? [main] : []
  }, [product, activeVariant])

  const displayPrice = useMemo(() => {
    if (!product) return 0
    return activeVariant?.price ?? product.price
  }, [product, activeVariant])

  const maxQty = useMemo(() => {
    const stock = activeVariant?.stock_quantity ?? product?.stock_quantity
    return stock != null && stock > 0 ? Math.min(stock, 99) : 99
  }, [product, activeVariant])

  if (productQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <PublicTopBar />
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!product) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <PublicTopBar />
        <View style={styles.center}>
          <Text style={styles.notFound}>Produit introuvable</Text>
        </View>
      </PublicScreenShell>
    )
  }

  const stock = stockLabel(product, activeVariant)
  const outOfStock = stock === 'Rupture de stock'
  const merchant = boutiqueResolveQuery.data?.merchant
  const shopSlug = resolveProductBoutiqueSlug(product, String(slug), boutiqueResolveQuery.data)
  const boutiquePath = getBoutiquePath(shopSlug)
  const merchantName =
    product.merchant?.business_name
    ?? product.shop?.name
    ?? merchant?.business_name
    ?? boutiqueResolveQuery.data?.displayName
    ?? 'Boutique'
  const productRouteSlug = shopSlug

  async function onAddToCart(buyNow = false) {
    if (outOfStock) {
      Alert.alert('Stock', 'Ce produit n’est plus disponible.')
      return
    }
    setAdding(true)
    const result = await addItem(product!.id, quantity, activeVariant?.id)
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

  return (
    <PublicScreenShell activeRoute="marketplace">
      <PublicTopBar />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: layout.bottomNavHeight + insets.bottom + 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gallerySection}>
          <View style={styles.mainImageWrap}>
            {images[activeImage] ? (
              <Image source={{ uri: images[activeImage] }} style={styles.mainImage} />
            ) : (
              <View style={[styles.mainImage, styles.imageFallback]}>
                <Text style={styles.fallbackLetter}>{product.name.slice(0, 1)}</Text>
              </View>
            )}
            <View style={styles.favBtn}>
              <ProductFavoriteButton productId={product.id} size={24} />
            </View>
          </View>

          {images.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbsRow}
            >
              {images.slice(0, 4).map((uri, index) => {
                const active = activeImage === index
                const isMore = index === 3 && images.length > 4
                return (
                  <Pressable
                    key={`${uri}-${index}`}
                    onPress={() => setActiveImage(index)}
                    style={[styles.thumb, active && styles.thumbActive]}
                  >
                    <Image source={{ uri }} style={styles.thumbImage} />
                    {isMore ? (
                      <View style={styles.thumbMore}>
                        <Text style={styles.thumbMoreText}>+{images.length - 3}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : null}
        </View>

        <View style={styles.body}>
          <Pressable
            onPress={() => router.push(boutiquePath)}
            style={styles.merchantRow}
          >
            {merchant?.logo ? (
              <Image source={{ uri: merchant.logo }} style={styles.merchantLogo} />
            ) : (
              <View style={[styles.merchantLogo, styles.merchantLogoFallback]}>
                <Ionicons name="storefront-outline" size={14} color={colors.textMuted} />
              </View>
            )}
            <Text style={styles.merchantName}>{merchantName}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </Pressable>

          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.metaRow}>
            {stock ? (
              <View style={styles.stockRow}>
                <Ionicons
                  name={outOfStock ? 'close-circle' : 'checkmark-circle'}
                  size={16}
                  color={outOfStock ? colors.danger : colors.success}
                />
                <Text style={[styles.stockText, outOfStock && styles.stockTextDanger]}>
                  {stock}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.price}>{formatPrice(displayPrice, product.currency)}</Text>
          <Text style={styles.priceHint}>
            Taxes incluses. Frais de livraison calculés à l&apos;étape suivante.
          </Text>

          {product.short_description ? (
            <Text style={styles.shortDesc}>{product.short_description}</Text>
          ) : null}

          <View style={styles.divider} />

          {variants.length > 1 ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>VARIANTE</Text>
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

          <View style={styles.block}>
            <Text style={styles.blockLabel}>QUANTITÉ</Text>
            <View style={styles.qtyRow}>
              <Pressable
                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                style={styles.qtyBtn}
                accessibilityLabel="Diminuer la quantité"
              >
                <Ionicons name="remove" size={18} color={colors.textMuted} />
              </Pressable>
              <Text style={styles.qtyValue}>{quantity}</Text>
              <Pressable
                onPress={() => setQuantity(q => Math.min(maxQty, q + 1))}
                style={styles.qtyBtn}
                accessibilityLabel="Augmenter la quantité"
              >
                <Ionicons name="add" size={18} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => void onAddToCart(false)}
              disabled={adding || outOfStock}
              style={({ pressed }) => [
                styles.cartBtn,
                (pressed || adding || outOfStock) && styles.btnPressed,
              ]}
            >
              <Ionicons name="bag-handle-outline" size={20} color="#fff" />
              <Text style={styles.cartBtnText}>Ajouter au panier</Text>
            </Pressable>
            <Pressable
              onPress={() => void onAddToCart(true)}
              disabled={adding || outOfStock}
              style={({ pressed }) => [
                styles.buyBtn,
                (pressed || adding || outOfStock) && styles.btnPressed,
              ]}
            >
              <Text style={styles.buyBtnText}>Acheter maintenant</Text>
            </Pressable>
          </View>

          <View style={styles.perksRow}>
            <View style={styles.perkCard}>
              <View style={styles.perkIcon}>
                <Ionicons name="car-outline" size={16} color={colors.text} />
              </View>
              <View style={styles.perkBody}>
                <Text style={styles.perkTitle}>Livraison rapide</Text>
                <Text style={styles.perkText}>Partout à {cityLabel} sous 24h.</Text>
              </View>
            </View>
            <View style={[styles.perkCard, styles.perkCardBrand]}>
              <View style={styles.perkIcon}>
                <Ionicons name="storefront-outline" size={16} color={colors.brand600} />
              </View>
              <View style={styles.perkBody}>
                <Text style={styles.perkTitle}>Click & Collect</Text>
                <Text style={styles.perkText}>Retrait gratuit chez {merchantName}.</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabsSection}>
          <View style={styles.tabHeader}>
            <Pressable style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Description détaillée</Text>
            </Pressable>
          </View>
          {activeTab === 'description' && product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : (
            <Text style={styles.descriptionMuted}>Aucune description disponible.</Text>
          )}
        </View>

        {(relatedQuery.data?.length ?? 0) > 0 ? (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text style={styles.relatedTitle}>Dans la même boutique</Text>
              <Pressable onPress={() => router.push(boutiquePath)}>
                <Text style={styles.relatedLink}>Voir la boutique →</Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedRow}
            >
              {relatedQuery.data!.map(p => (
                <View key={p.id} style={styles.relatedCell}>
                  <HomeProductGridCard
                    product={{
                      id: p.id,
                      name: p.name,
                      slug: p.slug,
                      price: p.price,
                      promo_price: null,
                      currency: p.currency,
                      image_url: p.image_url ?? null,
                      merchant: {
                        business_name: merchantName,
                        slug: productRouteSlug,
                      },
                    }}
                    onPress={() => router.push(`/m/${productRouteSlug}/p/${p.slug}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  gallerySection: {
    backgroundColor: colors.surface,
    paddingBottom: 16,
  },
  mainImageWrap: {
    marginHorizontal: spacing.gutter,
    marginTop: 12,
    aspectRatio: 4 / 3,
    borderRadius: homeLayout.radiusXl,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mainImage: { width: '100%', height: '100%' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackLetter: {
    fontFamily: fonts.extrabold,
    fontSize: 48,
    color: colors.brand600,
  },
  favBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
  },
  thumbsRow: {
    paddingHorizontal: spacing.gutter,
    gap: 12,
    marginTop: 12,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: homeLayout.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  thumbActive: { borderWidth: 2, borderColor: colors.slate900 },
  thumbImage: { width: '100%', height: '100%' },
  thumbMore: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbMoreText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  body: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.gutter,
    paddingTop: 20,
    paddingBottom: 24,
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  merchantLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surfaceContainer,
  },
  merchantLogoFallback: { alignItems: 'center', justifyContent: 'center' },
  merchantName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.text,
    marginBottom: 12,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.success,
  },
  stockTextDanger: { color: colors.danger },
  price: {
    fontFamily: fonts.extrabold,
    fontSize: 32,
    color: colors.brand600,
    marginBottom: 4,
  },
  priceHint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 16,
  },
  shortDesc: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 20,
  },
  block: { marginBottom: 20 },
  blockLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: colors.text,
    marginBottom: 10,
  },
  variantRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  variantPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  variantPillActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  variantText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  variantTextActive: { color: '#fff' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    padding: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    width: 40,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  actions: { gap: 12, marginBottom: 20 },
  cartBtn: {
    height: 56,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.slate900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cartBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: '#fff',
  },
  buyBtn: {
    height: 56,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.brand50,
    borderWidth: 2,
    borderColor: colors.brand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyBtnText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.brand700,
  },
  btnPressed: { opacity: 0.85 },
  perksRow: { gap: 12 },
  perkCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  perkCardBrand: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand100,
  },
  perkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkBody: { flex: 1 },
  perkTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  perkText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  tabsSection: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.gutter,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    marginBottom: 16,
  },
  tabActive: {
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.brand500,
    marginBottom: -1,
  },
  tabActiveText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.brand600,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textMuted,
  },
  descriptionMuted: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textLight,
  },
  relatedSection: {
    backgroundColor: colors.surface,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.gutter,
    marginBottom: 16,
  },
  relatedTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.text,
  },
  relatedLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand600,
  },
  relatedRow: {
    paddingHorizontal: spacing.gutter,
    gap: homeLayout.stackMd,
  },
  relatedCell: { width: 160 },
})
