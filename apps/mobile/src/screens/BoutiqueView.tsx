import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchantDetail, ApiShopPublic, MarketplaceProduct } from '@laplasse/api-client'
import {
  MarketplaceFiltersSheet,
  type MarketplaceFilterState,
} from '@/src/components/MarketplaceFiltersSheet'
import { ShopProductCard } from '@/src/components/ShopProductCard'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { LoadingState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { getApiClient } from '@/src/lib/api'
import { resolveBoutique } from '@/src/lib/boutiqueResolve'
import { buildProductCategoryTree, computeMaxProductPrice, deriveCategoriesFromProducts } from '@/src/lib/marketplace'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

interface BoutiqueDisplayData {
  name: string
  slug: string
  logo?: string | null
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  location?: { city?: string | null; district?: string | null } | null
}

function merchantToDisplay(m: ApiMerchantDetail): BoutiqueDisplayData {
  return {
    name: m.business_name,
    slug: m.slug,
    logo: m.logo,
    cover_image: m.cover_image,
    phone: m.phone,
    whatsapp: m.whatsapp,
    location: m.location,
  }
}

function shopToDisplay(s: ApiShopPublic): BoutiqueDisplayData {
  return {
    name: s.name,
    slug: s.slug,
    logo: s.logo,
    cover_image: s.cover_image,
    phone: s.phone,
    whatsapp: s.whatsapp,
    location: s.city ? { city: s.city, district: s.district } : null,
  }
}

type SortOption = 'recommended' | 'newest' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommandés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
]

function sortProducts(products: MarketplaceProduct[], sort: SortOption): MarketplaceProduct[] {
  const copy = [...products]
  switch (sort) {
    case 'price_asc': return copy.sort((a, b) => a.price - b.price)
    case 'price_desc': return copy.sort((a, b) => b.price - a.price)
    case 'newest': return copy.reverse()
    default: return copy
  }
}

export function BoutiqueView({ slug }: { slug: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [selectedCollection, setSelectedCollection] = useState('')
  const [sort, setSort] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState<MarketplaceFilterState>(() => ({
    sort: 'newest',
    selectedCategory: '',
    selectedCondition: '',
    selectedOrigin: '',
    selectedMerchants: [],
    priceFilter: 100_000,
  }))

  // Scroll-direction FAB visibility
  const scrollY = useRef(0)
  const fabVisible = useRef(true)
  const fabOpacity = useRef(new Animated.Value(1)).current

  const showFab = useCallback(() => {
    if (fabVisible.current) return
    fabVisible.current = true
    Animated.spring(fabOpacity, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start()
  }, [fabOpacity])

  const hideFab = useCallback(() => {
    if (!fabVisible.current) return
    fabVisible.current = false
    Animated.spring(fabOpacity, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start()
  }, [fabOpacity])

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const newY = e.nativeEvent.contentOffset.y
    const delta = newY - scrollY.current
    if (newY < 80) showFab()
    else if (delta > 10) hideFab()
    else if (delta < -10) showFab()
    scrollY.current = newY
  }, [showFab, hideFab])

  // Resolve merchant or shop by slug
  const resolveQuery = useQuery({
    queryKey: ['boutique-resolve', slug],
    queryFn: async () => {
      const resolved = await resolveBoutique(slug)
      if (!resolved) throw new Error('not found')
      return resolved
    },
  })

  const shopSlug = resolveQuery.data?.shopSlug ?? slug
  const merchantSlug = resolveQuery.data?.merchant?.slug

  const categoriesQuery = useQuery({
    queryKey: ['shop-categories', shopSlug],
    queryFn: () => getApiClient().getShopProductCategories(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const collectionsQuery = useQuery({
    queryKey: ['shop-collections', shopSlug],
    queryFn: () => getApiClient().getShopCollections(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const trustQuery = useQuery({
    queryKey: ['shop-trust', shopSlug],
    queryFn: () => getApiClient().getShopTrustScore(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const catalogQuery = useQuery({
    queryKey: ['shop-catalog', shopSlug, merchantSlug],
    queryFn: async () => {
      const api = getApiClient()
      try {
        const list = await api.getShopProducts(shopSlug, {})
        if (list.length > 0 || !merchantSlug) return list
      } catch {
        // Fall back to merchant products endpoint
      }
      if (merchantSlug) {
        const res = await api.getMerchantProducts(merchantSlug, 100, 0)
        return res.data
      }
      return []
    },
    enabled: !!resolveQuery.data,
  })

  const productsQuery = useQuery({
    queryKey: ['shop-products', shopSlug, merchantSlug, debouncedSearch, filters.selectedCategory, selectedCollection],
    queryFn: async () => {
      const api = getApiClient()
      try {
        const products = await api.getShopProducts(shopSlug, {
          q: debouncedSearch || undefined,
          category: filters.selectedCategory || undefined,
          collection: selectedCollection || undefined,
        })
        if (products.length > 0 || !merchantSlug) return products
      } catch {
        // Fall back to merchant products endpoint
      }
      if (merchantSlug) {
        const res = await api.getMerchantProducts(merchantSlug, 100, 0)
        let list = res.data
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase()
          list = list.filter(p => p.name.toLowerCase().includes(q))
        }
        return list
      }
      return []
    },
    enabled: !!resolveQuery.data,
  })

  const merchant: BoutiqueDisplayData | undefined = resolveQuery.data
    ? resolveQuery.data.merchant
      ? merchantToDisplay(resolveQuery.data.merchant)
      : shopToDisplay(resolveQuery.data.shop!)
    : undefined
  const products: MarketplaceProduct[] = productsQuery.data ?? []
  const catalogProducts: MarketplaceProduct[] = catalogQuery.data ?? []
  const collections = collectionsQuery.data ?? []

  const priceCeiling = useMemo(
    () => computeMaxProductPrice(catalogProducts.map(p => p.price)),
    [catalogProducts],
  )

  useEffect(() => {
    setFilters(prev => ({ ...prev, priceFilter: priceCeiling }))
  }, [priceCeiling])

  const filtered = useMemo<MarketplaceProduct[]>(() => {
    const list = products.filter(p => p.price <= filters.priceFilter)
    return sortProducts(list, sort)
  }, [products, filters.priceFilter, sort])

  const categoryTree = useMemo(() => {
    const apiCategories = categoriesQuery.data ?? []
    const source =
      apiCategories.length > 0
        ? apiCategories
        : deriveCategoriesFromProducts(catalogProducts)
    return buildProductCategoryTree(source)
  }, [categoriesQuery.data, catalogProducts])

  const activeFilterCount = [
    search.trim(),
    filters.selectedCategory,
    selectedCollection,
    filters.priceFilter < priceCeiling ? 'price' : '',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setSelectedCollection('')
    setFilters(prev => ({
      ...prev,
      selectedCategory: '',
      priceFilter: priceCeiling,
    }))
  }

  if (resolveQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (resolveQuery.isError || !merchant) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <View style={styles.notFound}>
          <Ionicons name="storefront-outline" size={48} color={colors.brand200} />
          <Text style={styles.notFoundText}>Boutique introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>← Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  const locationLabel = [merchant.location?.district, merchant.location?.city]
    .filter(Boolean)
    .join(', ')
  const contactPhone = merchant.whatsapp ?? merchant.phone
  const trust = trustQuery.data

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: layout.bottomNavInset + 24 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* ─── Hero ─── */}
          <View style={styles.hero}>
            {merchant.cover_image ? (
              <AppImage uri={merchant.cover_image} style={styles.cover} fallbackLetter={merchant.name.slice(0, 1)} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroOverlay} />
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { top: insets.top + 8 }]}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.heroContent}>
              <View style={styles.logoWrap}>
                {merchant.logo ? (
                  <AppImage uri={merchant.logo} style={styles.logo} fallbackLetter={merchant.name.slice(0, 1)} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Ionicons name="storefront" size={28} color={colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.heroText}>
                <View style={styles.officialBadge}>
                  <Ionicons name="storefront" size={12} color="#fff" />
                  <Text style={styles.officialBadgeText}>Boutique Officielle</Text>
                </View>
                <View style={styles.nameRow}>
                  <Text style={styles.shopName} numberOfLines={2}>{merchant.name}</Text>
                  {trust && trust.badge && trust.badge !== 'new' ? (
                    <Ionicons
                      name={trust.badge === 'trusted' ? 'checkmark-circle' : 'shield-checkmark'}
                      size={16}
                      color={trust.badge === 'trusted' ? '#a7f3d0' : 'rgba(255,255,255,0.85)'}
                      style={styles.trustIcon}
                    />
                  ) : null}
                </View>
                {locationLabel ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.brand500} />
                    <Text style={styles.location}>{locationLabel}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* ─── Sort strip (PWA mobile) ─── */}
          <View style={styles.sortCard}>
            <Text style={styles.sortCardLabel}>Trier par :</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sortChips}
            >
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
                >
                  <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ─── Product grid ─── */}
          {productsQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.brand500} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="bag-outline" size={40} color={colors.brand200} />
              <Text style={styles.empty}>Aucun produit ne correspond à vos filtres.</Text>
              {activeFilterCount > 0 ? (
                <Pressable onPress={resetFilters} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(product => (
                <View key={product.id} style={styles.gridCell}>
                  <ShopProductCard
                    product={product}
                    onPress={() => router.push(`/m/${merchantSlug ?? merchant.slug}/p/${product.slug}`)}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ─── Contact block ─── */}
          <View style={styles.contactBlock}>
            <Ionicons name="headset-outline" size={32} color={colors.brand500} />
            <Text style={styles.contactTitle}>Une question ?</Text>
            <Text style={styles.contactBody}>
              Contactez directement la boutique pour toute demande spécifique.
            </Text>
            {contactPhone ? (
              <Pressable
                style={styles.contactBtn}
                onPress={() =>
                  merchant.whatsapp
                    ? openWhatsApp(contactPhone, `Bonjour ${merchant.name},`)
                    : void Linking.openURL(`tel:${contactPhone}`)
                }
              >
                <Text style={styles.contactBtnText}>Contacter le vendeur</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {!filtersOpen ? (
          <Animated.View
            style={[
              styles.fabWrap,
              {
                bottom: layout.fabBottomGap,
                opacity: fabOpacity,
                transform: [{ translateY: fabOpacity.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
              },
            ]}
            pointerEvents={fabVisible.current ? 'auto' : 'none'}
          >
            <Pressable onPress={() => setFiltersOpen(true)} style={styles.fab}>
              <Ionicons name="options-outline" size={18} color="#fff" />
              <Text style={styles.fabText}>Filtres</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.fabBadge}>
                  <Text style={styles.fabBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        ) : null}

        <MarketplaceFiltersSheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          onChange={setFilters}
          categories={categoryTree}
          merchants={[]}
          priceCeiling={priceCeiling}
          showSort={false}
          showMarketplaceExtras={false}
          productSearch={search}
          onProductSearchChange={setSearch}
          collections={collections}
          selectedCollection={selectedCollection}
          onCollectionChange={setSelectedCollection}
          onReset={resetFilters}
          resultCount={filtered.length}
          categoriesLoading={categoriesQuery.isLoading || catalogQuery.isLoading}
        />
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 0 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  notFoundText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // Hero
  hero: { minHeight: 260, height: 280, position: 'relative', backgroundColor: colors.slate900 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.slate900 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'flex-end', gap: 16,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: '#fff', padding: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 6,
  },
  logo: { width: '100%', height: '100%', borderRadius: 14 },
  logoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  heroText: { flex: 1 },
  officialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: colors.brand500,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6,
  },
  officialBadgeText: {
    fontFamily: fonts.bold, fontSize: 10, color: '#fff',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  shopName: { fontFamily: fonts.extrabold, fontSize: 22, color: '#fff', flexShrink: 1 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 2,
    maxWidth: '100%',
  },
  trustIcon: { flexShrink: 0, marginLeft: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.85)', flex: 1 },

  // Sort card (PWA)
  sortCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortCardLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, flexShrink: 0 },
  sortChips: { gap: 6, paddingRight: 8 },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surfaceContainerLow,
  },
  sortChipActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  sortChipText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
  sortChipTextActive: { color: colors.brand700 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  gridCell: { width: '47%' },
  emptyWrap: { alignItems: 'center', padding: 32, gap: 12 },
  empty: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  resetBtn: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand200,
  },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // Contact
  contactBlock: {
    marginHorizontal: 16, marginTop: 20, marginBottom: 8, padding: 20,
    borderRadius: homeLayout.radiusXl,
    backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand100,
    alignItems: 'center', gap: 8,
  },
  contactTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  contactBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  contactBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brand200,
  },
  contactBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // FAB
  fabWrap: { position: 'absolute', left: layout.fabHorizontalGutter, right: layout.fabHorizontalGutter },
  fab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.slate900, paddingVertical: 14, borderRadius: 999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16,
    elevation: 8,
  },
  fabText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
  fabBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.brand500,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  fabBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
})
