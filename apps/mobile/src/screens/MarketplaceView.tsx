import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type { MarketplaceCatalogProduct } from '@laplasse/api-client'
import { MarketplaceCategoryCarousel } from '@/src/components/MarketplaceCategoryCarousel'
import {
  MarketplaceFiltersSheet,
  type MarketplaceFilterState,
} from '@/src/components/MarketplaceFiltersSheet'
import { MarketplaceProductGridCard } from '@/src/components/MarketplaceProductGridCard'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { NetworkErrorBanner } from '@/src/components/NetworkErrorBanner'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { SpotlightShopsRow } from '@/src/components/SpotlightShopsRow'
import { EmptyState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { useCartItemCount } from '@/src/hooks/useCartItemCount'
import { getApiClient } from '@/src/lib/api'
import { computePriceCeiling } from '@/src/lib/marketplace'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout, spacing } from '@/src/theme'

const PAGE_SIZE = 24
const TOP_BAR_HEIGHT = homeLayout.topBarHeight

export function MarketplaceView() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const user = useAuthStore(s => s.user)
  const cartCount = useCartItemCount()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [products, setProducts] = useState<MarketplaceCatalogProduct[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [priceCeiling, setPriceCeiling] = useState(100_000)

  // FAB scroll-direction visibility
  const scrollY = useRef(0)
  const fabVisible = useRef(true)
  const fabOpacity = useRef(new Animated.Value(1)).current

  const showFab = useCallback(() => {
    if (fabVisible.current) return
    fabVisible.current = true
    Animated.spring(fabOpacity, {
      toValue: 1,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start()
  }, [fabOpacity])

  const hideFab = useCallback(() => {
    if (!fabVisible.current) return
    fabVisible.current = false
    Animated.spring(fabOpacity, {
      toValue: 0,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start()
  }, [fabOpacity])

  const [filters, setFilters] = useState<MarketplaceFilterState>(() => ({
    sort: 'newest',
    selectedCategory: '',
    selectedCondition: '',
    selectedOrigin: '',
    selectedMerchants: [],
    priceFilter: 100_000,
  }))

  const categoriesQuery = useQuery({
    queryKey: ['marketplace-categories', countryCode],
    queryFn: () => getApiClient().getMarketplaceProductCategories(countryCode),
  })

  const metaQuery = useQuery({
    queryKey: ['marketplace-meta'],
    queryFn: async () => {
      const api = getApiClient()
      const [merchants, spotlight] = await Promise.all([
        api.getMarketplaceShops(50),
        api.getMarketplaceSpotlight(),
      ])
      return { merchants, spotlight }
    },
  })

  const catalogKey = [
    'marketplace-catalog',
    debouncedSearch,
    filters.sort,
    filters.selectedCategory,
    filters.selectedCondition,
    filters.selectedOrigin,
    filters.selectedMerchants.join(','),
  ]

  const catalogQuery = useQuery({
    queryKey: catalogKey,
    queryFn: async () => {
      const api = getApiClient()
      const merchant =
        filters.selectedMerchants.length === 1 ? filters.selectedMerchants[0] : undefined
      return api.getMarketplaceProductsPage({
        q: debouncedSearch || undefined,
        merchant,
        category: filters.selectedCategory || undefined,
        condition: filters.selectedCondition || undefined,
        origin: filters.selectedOrigin || undefined,
        sort: filters.sort === 'newest' ? undefined : filters.sort,
        limit: PAGE_SIZE,
        offset: 0,
      })
    },
  })

  useEffect(() => {
    if (!catalogQuery.data) return
    setProducts(catalogQuery.data.data)
    setHasMore(catalogQuery.data.meta.hasMore)
    setPage(0)
    if (catalogQuery.data.data.length > 0) {
      const ceiling = computePriceCeiling(catalogQuery.data.data.map(p => p.price))
      setPriceCeiling(ceiling)
      setFilters(prev =>
        prev.priceFilter === 100_000 ? { ...prev, priceFilter: ceiling } : prev,
      )
    }
  }, [catalogQuery.data])

  const filtered = useMemo(() => {
    let list = products.filter(p => p.price <= filters.priceFilter)
    if (filters.selectedMerchants.length > 1) {
      list = list.filter(p => filters.selectedMerchants.includes(p.merchant.slug))
    }
    return list
  }, [products, filters.priceFilter, filters.selectedMerchants])

  const mobileFilterCount = useMemo(() => {
    let count = 0
    if (filters.selectedMerchants.length > 0) count += 1
    if (filters.selectedCondition) count += 1
    if (filters.selectedOrigin) count += 1
    if (filters.priceFilter < priceCeiling) count += 1
    if (filters.sort !== 'newest') count += 1
    return count
  }, [filters, priceCeiling])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || filters.selectedMerchants.length > 1) return
    setLoadingMore(true)
    try {
      const api = getApiClient()
      const merchant =
        filters.selectedMerchants.length === 1 ? filters.selectedMerchants[0] : undefined
      const nextPage = page + 1
      const result = await api.getMarketplaceProductsPage({
        q: debouncedSearch || undefined,
        merchant,
        category: filters.selectedCategory || undefined,
        condition: filters.selectedCondition || undefined,
        origin: filters.selectedOrigin || undefined,
        sort: filters.sort === 'newest' ? undefined : filters.sort,
        limit: PAGE_SIZE,
        offset: nextPage * PAGE_SIZE,
      })
      setProducts(prev => [...prev, ...result.data])
      setHasMore(result.meta.hasMore)
      setPage(nextPage)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, filters, debouncedSearch, page])

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
      const newY = contentOffset.y
      const delta = newY - scrollY.current
      if (newY < 80) {
        showFab()
      } else if (delta > 10) {
        hideFab()
      } else if (delta < -10) {
        showFab()
      }
      scrollY.current = newY

      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200
      if (nearBottom && hasMore && !loadingMore && filters.selectedMerchants.length <= 1) {
        void loadMore()
      }
    },
    [showFab, hideFab, hasMore, loadingMore, filters.selectedMerchants.length, loadMore],
  )

  const resetFilters = () => {
    setSearch('')
    setFilters({
      sort: 'newest',
      selectedCategory: '',
      selectedCondition: '',
      selectedOrigin: '',
      selectedMerchants: [],
      priceFilter: priceCeiling,
    })
  }

  const categories = categoriesQuery.data ?? []
  const spotlight = metaQuery.data?.spotlight ?? []
  const merchants = metaQuery.data?.merchants ?? []
  const initial = (user?.full_name ?? user?.email ?? 'V').slice(0, 1).toUpperCase()
  const topPad = insets.top + TOP_BAR_HEIGHT

  return (
    <View style={styles.root}>
      {/* ─── Top bar (same style as Home) ─── */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <Pressable
            onPress={() => router.push('/(tabs)/search')}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Rechercher"
          >
            <Ionicons name="search-outline" size={22} color={colors.textMuted} />
          </Pressable>

          <Text style={styles.brand}>LaPlasse</Text>

          <View style={styles.topBarRight}>
            <Pressable
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Panier"
            >
              <Ionicons name="bag-handle-outline" size={22} color={colors.textMuted} />
              {cartCount > 0 ? (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
            >
              {isAuthenticated ? (
                <Text style={styles.avatarText}>{initial}</Text>
              ) : (
                <Ionicons name="person-outline" size={18} color={colors.brand700} />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad,
            paddingBottom: layout.fabBottomGap + 56,
          },
        ]}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.searchWrap}>
          <SearchAutocomplete
            placeholder="Rechercher un produit…"
            productsOnly
            value={search}
            onValueChange={setSearch}
          />
        </View>

        <MarketplaceCategoryCarousel
          categories={categories}
          selectedSlug={filters.selectedCategory}
          onSelect={slug => setFilters(prev => ({ ...prev, selectedCategory: slug }))}
        />

        {spotlight.length > 0 ? (
          <View style={styles.spotlightSection}>
            <Text style={styles.sectionTitle}>À la une</Text>
            <SpotlightShopsRow
              shops={spotlight}
              onPressShop={slug => router.push(`/m/${slug}/boutique`)}
            />
          </View>
        ) : null}

        {catalogQuery.isLoading && products.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.brand500} size="large" />
          </View>
        ) : catalogQuery.isError ? (
          <NetworkErrorBanner
            message="Impossible de charger le catalogue."
            onRetry={() => void catalogQuery.refetch()}
            loading={catalogQuery.isFetching}
          />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <EmptyState
              title="Aucun produit"
              subtitle={
                search.trim() || mobileFilterCount > 0 || filters.selectedCategory
                  ? 'Aucun produit ne correspond à vos critères.'
                  : 'Le catalogue est vide pour le moment.'
              }
            />
            {search.trim() || mobileFilterCount > 0 ? (
              <Pressable onPress={resetFilters} style={styles.resetBtn}>
                <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {filtered.map(product => (
                <View key={product.id} style={styles.gridCell}>
                  <MarketplaceProductGridCard
                    product={product}
                    onPress={() => router.push(`/m/${product.merchant.slug}/p/${product.slug}`)}
                  />
                </View>
              ))}
            </View>
            {hasMore && filters.selectedMerchants.length <= 1 ? (
              <Pressable
                onPress={() => void loadMore()}
                disabled={loadingMore}
                style={styles.loadMoreBtn}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.textMuted} />
                ) : (
                  <Text style={styles.loadMoreText}>Voir plus de produits</Text>
                )}
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* ─── Floating filters FAB (scroll-direction visibility) ─── */}
      <Animated.View
        style={[
          styles.filtersFabWrap,
          {
            bottom: layout.fabBottomGap,
            opacity: fabOpacity,
            transform: [{ translateY: fabOpacity.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          },
        ]}
        pointerEvents={fabVisible.current ? 'auto' : 'none'}
      >
        <Pressable
          onPress={() => setFiltersOpen(true)}
          style={styles.filtersFab}
        >
          <Ionicons name="options-outline" size={18} color="#fff" />
          <Text style={styles.filtersFabText}>Filtres</Text>
          {mobileFilterCount > 0 ? (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{mobileFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>

      <MarketplaceFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={setFilters}
        categories={categories}
        merchants={merchants}
        priceCeiling={priceCeiling}
        onReset={resetFilters}
        resultCount={filtered.length}
      />

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(250, 250, 250, 0.96)',
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: TOP_BAR_HEIGHT,
    paddingHorizontal: homeLayout.gutter,
  },
  brand: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.brand600,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  pressed: { opacity: 0.75 },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand100,
    borderWidth: 1,
    borderColor: colors.brand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand800 },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 2,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bold },
  content: {
    gap: 16,
  },
  searchWrap: {
    paddingHorizontal: spacing.gutter,
    paddingTop: 12,
  },
  spotlightSection: { gap: 12 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: spacing.gutter,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.gutter,
  },
  gridCell: { width: '47%' },
  loadMoreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  loadMoreText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  emptyWrap: { paddingHorizontal: spacing.gutter, alignItems: 'center', gap: 12 },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  filtersFabWrap: {
    position: 'absolute',
    left: layout.fabHorizontalGutter,
    right: layout.fabHorizontalGutter,
  },
  filtersFab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  filtersFabText: {
    fontFamily: fonts.extrabold,
    fontSize: 14,
    color: '#fff',
  },
  filtersBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filtersBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
  },
})
