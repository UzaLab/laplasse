import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getDefaultCity } from '@laplasse/shared-config'
import type { ApiMerchant } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState, useEffect } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { HomeTopBar } from '@/src/components/HomeTopBar'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import {
  SearchResultsFiltersSheet,
  type SearchResultsFilters,
} from '@/src/components/SearchResultsFiltersSheet'
import { SearchResultsMenuCard } from '@/src/components/SearchResultsMenuCard'
import { SearchResultsMerchantCard } from '@/src/components/SearchResultsMerchantCard'
import { SearchResultsProductCard } from '@/src/components/SearchResultsProductCard'
import { SearchResultsShopCard } from '@/src/components/SearchResultsShopCard'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { getApiClient } from '@/src/lib/api'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

type Tab = 'merchants' | 'products' | 'menus' | 'shops'

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

function merchantHref(merchant: ApiMerchant): `/m/${string}` | `/restauration/${string}` {
  const slug = merchant.category?.slug ?? ''
  if (isFoodCategorySlug(slug)) return `/restauration/${merchant.slug}`
  return `/m/${merchant.slug}`
}

function pickDefaultTab(totals: Record<Tab, number>): Tab {
  const priority: Tab[] = ['products', 'merchants', 'menus', 'shops']
  return priority.find(tab => totals[tab] > 0) ?? 'merchants'
}

function applyCategoryFilter(merchants: ApiMerchant[], categories: string[]) {
  if (categories.length === 0) return merchants
  return merchants.filter(m => categories.includes(m.category.slug))
}

export default function SearchResultsView({
  initialQuery,
  initialCategory,
  filtersOpen: initialFiltersOpen = false,
  onClear,
}: {
  initialQuery: string
  initialCategory?: string
  filtersOpen?: boolean
  onClear: () => void
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [query, setQuery] = useState(initialQuery)
  const [tab, setTab] = useState<Tab>('merchants')
  const autoTabQueryRef = useRef<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(initialFiltersOpen)
  const [filters, setFilters] = useState<SearchResultsFilters>(() => ({
    categories: initialCategory ? initialCategory.split(',').filter(Boolean) : [],
    sort: 'trust_score',
  }))

  const debouncedQuery = useDebouncedValue(query, 350)
  const pageSize = 12

  const categoryFilter = filters.categories.length === 1 ? filters.categories[0] : undefined

  const searchQuery = useInfiniteQuery({
    queryKey: [
      'search',
      debouncedQuery,
      city,
      filters.sort,
      categoryFilter,
      countryCode,
    ],
    queryFn: ({ pageParam = 0 }) =>
      getApiClient().unifiedSearchAdvanced({
        q: debouncedQuery,
        type: 'all',
        limit: pageSize,
        offset: pageParam,
        city,
        category: categoryFilter,
        sort: filters.sort,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const next = lastPageParam + pageSize
      const merchantsHasMore = next < lastPage.merchants.meta.total
      const productsHasMore = next < lastPage.products.meta.total
      const menusHasMore = next < (lastPage.menus?.meta.total ?? 0)
      return merchantsHasMore || productsHasMore || menusHasMore ? next : undefined
    },
    enabled: debouncedQuery.length >= 2,
  })

  const searchPages = searchQuery.data?.pages ?? []
  const searchData = searchPages[0]

  const merchants = useMemo(() => {
    const merged = searchPages.flatMap(page => page.merchants.data)
    return applyCategoryFilter(merged, filters.categories)
  }, [searchPages, filters.categories])

  const products = useMemo(() => {
    const merged = searchPages.flatMap(page => page.products.data)
    if (filters.categories.length === 0) return merged
    return merged.filter(p => {
      const slug = (p as { category?: { slug?: string } }).category?.slug
      return slug != null && filters.categories.includes(slug)
    })
  }, [searchPages, filters.categories])

  const menus = useMemo(
    () => searchPages.flatMap(page => page.menus?.data ?? []),
    [searchPages],
  )

  const shops = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>()
    for (const product of products) {
      const slug = product.merchant.slug
      if (!slug || map.has(slug)) continue
      map.set(slug, { name: product.merchant.business_name, slug })
    }
    return Array.from(map.values())
  }, [products])

  const canLoadMore = tab === 'merchants'
    ? merchants.length < (searchData?.merchants.meta.total ?? 0)
    : tab === 'products'
      ? products.length < (searchData?.products.meta.total ?? 0)
      : tab === 'menus'
        ? menus.length < (searchData?.menus?.meta.total ?? 0)
        : false

  const trendingQuery = useQuery({
    queryKey: ['search-trending', city, countryCode],
    queryFn: () => getApiClient().getFeaturedMerchants(city, 6, countryCode),
    enabled:
      debouncedQuery.length >= 2
      && searchQuery.isSuccess
      && merchants.length === 0,
    staleTime: 60_000,
  })

  const merchantTotal = filters.categories.length > 1
    ? merchants.length
    : (searchData?.merchants.meta.total ?? 0)
  const productTotal = searchData?.products.meta.total ?? 0
  const menuTotal = searchData?.menus?.meta.total ?? 0
  const shopTotal = shops.length
  const globalTotal = merchantTotal + productTotal + menuTotal + shopTotal

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => {
    if (searchQuery.isLoading || !searchData || debouncedQuery.length < 2) return
    if (autoTabQueryRef.current === debouncedQuery) return

    const nextTab = pickDefaultTab({
      merchants: merchantTotal,
      products: productTotal,
      menus: menuTotal,
      shops: shopTotal,
    })
    setTab(nextTab)
    autoTabQueryRef.current = debouncedQuery
  }, [
    debouncedQuery,
    searchQuery.isLoading,
    searchData,
    merchantTotal,
    productTotal,
    menuTotal,
    shopTotal,
  ])

  const loadMore = () => {
    if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
      void searchQuery.fetchNextPage()
    }
  }

  const loadMoreLock = useRef(false)

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
    const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 160
    if (
      nearBottom
      && canLoadMore
      && searchQuery.hasNextPage
      && !searchQuery.isFetchingNextPage
      && !loadMoreLock.current
    ) {
      loadMoreLock.current = true
      void searchQuery.fetchNextPage().finally(() => {
        loadMoreLock.current = false
      })
    }
  }
  const activeTotal = tab === 'merchants'
    ? merchantTotal
    : tab === 'products'
      ? productTotal
      : tab === 'menus'
        ? menuTotal
        : shopTotal
  const hasFilters = filters.categories.length > 0 || filters.sort !== 'trust_score'
  const listBottomPad = layout.bottomNavHeight + insets.bottom + 16
  const productColWidth = (Dimensions.get('window').width - homeLayout.gutter * 2 - 12) / 2

  const scrollTopPad = insets.top + homeLayout.topBarHeight + 8

  if (debouncedQuery.length < 2 && !initialFiltersOpen) {
    return (
      <View style={styles.root}>
        <HomeTopBar
          onOpenMenu={() => setDrawerOpen(true)}
          isAuthenticated={isAuthenticated}
          avatarLabel={greetingName(user?.full_name, user?.email)}
        />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <View style={{ paddingTop: scrollTopPad, flex: 1 }}>
          <EmptyState title="Recherchez sur LaPlasse" subtitle="Établissements, plats, boutiques, produits…" />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <HomeTopBar
        onOpenMenu={() => setDrawerOpen(true)}
        isAuthenticated={isAuthenticated}
        avatarLabel={greetingName(user?.full_name, user?.email)}
      />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: scrollTopPad, paddingBottom: listBottomPad }]}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        <View style={styles.searchField}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Établissements, plats, boutiques, produits…"
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            returnKeyType="search"
            autoFocus={initialFiltersOpen || !!initialQuery}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        {initialFiltersOpen && debouncedQuery.length < 2 ? (
          <View style={styles.filtersHint}>
            <Text style={styles.filtersHintTitle}>Recherche avancée</Text>
            <Text style={styles.filtersHintText}>
              Saisissez au moins 2 caractères pour explorer établissements, plats, boutiques et produits.
            </Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll}
          contentContainerStyle={styles.tabs}
        >
          <Pressable onPress={() => setTab('merchants')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'merchants' && styles.tabTextActive]}>
              Établissements
            </Text>
            <View style={[styles.tabBadge, tab === 'merchants' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'merchants' && styles.tabBadgeTextActive]}>
                {merchantTotal}
              </Text>
            </View>
            {tab === 'merchants' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
          <Pressable onPress={() => setTab('menus')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'menus' && styles.tabTextActive]}>
              Plats
            </Text>
            <View style={[styles.tabBadge, tab === 'menus' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'menus' && styles.tabBadgeTextActive]}>
                {menuTotal}
              </Text>
            </View>
            {tab === 'menus' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
          <Pressable onPress={() => setTab('shops')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'shops' && styles.tabTextActive]}>
              Boutiques
            </Text>
            <View style={[styles.tabBadge, tab === 'shops' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'shops' && styles.tabBadgeTextActive]}>
                {shopTotal}
              </Text>
            </View>
            {tab === 'shops' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
          <Pressable onPress={() => setTab('products')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'products' && styles.tabTextActive]}>
              Produits
            </Text>
            <View style={[styles.tabBadge, tab === 'products' && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, tab === 'products' && styles.tabBadgeTextActive]}>
                {productTotal}
              </Text>
            </View>
            {tab === 'products' ? <View style={styles.tabIndicator} /> : null}
          </Pressable>
        </ScrollView>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {searchQuery.isFetching && merchants.length === 0 && products.length === 0 && menus.length === 0
              ? 'Recherche en cours…'
              : globalTotal !== activeTotal
                ? `${globalTotal} résultat${globalTotal > 1 ? 's' : ''} au total · ${activeTotal} dans cet onglet`
                : `${activeTotal} résultat${activeTotal > 1 ? 's' : ''} pour « ${debouncedQuery} »`}
          </Text>
          <Pressable onPress={() => setFiltersOpen(true)} style={styles.filterBtn}>
            <Ionicons name="options-outline" size={16} color={hasFilters ? colors.brand700 : colors.textMuted} />
            <Text style={[styles.filterBtnText, hasFilters && styles.filterBtnTextActive]}>Filtres</Text>
            {hasFilters ? <View style={styles.filterDot} /> : null}
          </Pressable>
        </View>

        {searchQuery.isLoading ? (
          <LoadingState />
        ) : searchQuery.isError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              Le moteur de recherche est momentanément indisponible.
            </Text>
          </View>
        ) : tab === 'merchants' ? (
          <>
            {merchants.length === 0 ? (
              <>
                <EmptyState title="Aucun établissement" subtitle={`Pour « ${debouncedQuery} »`} />
                {productTotal > 0 ? (
                  <Pressable onPress={() => setTab('products')} style={styles.emptyCta}>
                    <Text style={styles.emptyCtaText}>
                      Voir {productTotal} produit{productTotal > 1 ? 's' : ''} →
                    </Text>
                  </Pressable>
                ) : null}
              </>
            ) : (
              <View style={styles.merchantList}>
                {merchants.map(m => (
                  <SearchResultsMerchantCard
                    key={m.id}
                    merchant={m}
                    onPress={() => router.push(merchantHref(m) as never)}
                  />
                ))}
              </View>
            )}

            {canLoadMore ? (
              <Pressable
                onPress={loadMore}
                style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.85 }]}
              >
                {searchQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.brand600} />
                ) : (
                  <Text style={styles.loadMoreText}>Voir plus d&apos;établissements</Text>
                )}
              </Pressable>
            ) : null}

            {debouncedQuery && products.length > 0 ? (
              <View style={styles.crossSell}>
                <View style={styles.crossSellHeader}>
                  <View style={styles.crossSellTitles}>
                    <Text style={styles.crossSellTitle}>Populaires en produits</Text>
                    <Text style={styles.crossSellSub}>Articles liés à « {debouncedQuery} »</Text>
                  </View>
                  <Pressable onPress={() => setTab('products')}>
                    <Text style={styles.crossSellLink}>Tout voir →</Text>
                  </Pressable>
                </View>
                <View style={styles.productRow}>
                  {products.slice(0, 2).map(p => (
                    <SearchResultsProductCard
                      key={p.id}
                      product={p}
                      width={productColWidth}
                      onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            {merchants.length === 0 && (trendingQuery.data?.length ?? 0) > 0 ? (
              <View style={styles.crossSell}>
                <Text style={styles.crossSellTitle}>Populaires à {city}</Text>
                <View style={styles.merchantList}>
                  {trendingQuery.data!.map(m => (
                    <SearchResultsMerchantCard
                      key={m.id}
                      merchant={m}
                      onPress={() => router.push(merchantHref(m) as never)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : tab === 'menus' ? (
          <>
            {menus.length === 0 ? (
              <EmptyState title="Aucun plat" subtitle={`Pour « ${debouncedQuery} »`} />
            ) : (
              <View style={styles.merchantList}>
                {menus.map(item => (
                  <SearchResultsMenuCard
                    key={item.id}
                    item={item}
                    onPress={() => router.push(`/restauration/${item.merchant.slug}`)}
                  />
                ))}
              </View>
            )}
            {canLoadMore ? (
              <Pressable
                onPress={loadMore}
                style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.85 }]}
              >
                {searchQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.brand600} />
                ) : (
                  <Text style={styles.loadMoreText}>Voir plus de plats</Text>
                )}
              </Pressable>
            ) : null}
          </>
        ) : tab === 'shops' ? (
          shops.length === 0 ? (
            <EmptyState title="Aucune boutique" subtitle={`Pour « ${debouncedQuery} »`} />
          ) : (
            <View style={styles.merchantList}>
              {shops.map(shop => (
                <SearchResultsShopCard
                  key={shop.slug}
                  name={shop.name}
                  onPress={() => router.push(`/m/${shop.slug}/boutique`)}
                />
              ))}
            </View>
          )
        ) : products.length === 0 ? (
          <EmptyState title="Aucun produit" subtitle={`Pour « ${debouncedQuery} »`} />
        ) : (
          <View style={styles.productGrid}>
            {Array.from({ length: Math.ceil(products.length / 2) }, (_, rowIndex) => {
              const row = products.slice(rowIndex * 2, rowIndex * 2 + 2)
              return (
                <View key={row.map(p => p.id).join('-')} style={styles.productRow}>
                  {row.map(p => (
                    <SearchResultsProductCard
                      key={p.id}
                      product={p}
                      width={productColWidth}
                      onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
                    />
                  ))}
                  {row.length === 1 ? <View style={{ width: productColWidth }} /> : null}
                </View>
              )
            })}
            {canLoadMore ? (
              <Pressable
                onPress={loadMore}
                style={({ pressed }) => [styles.loadMoreBtn, pressed && { opacity: 0.85 }]}
              >
                {searchQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.brand600} />
                ) : (
                  <Text style={styles.loadMoreText}>Voir plus de produits</Text>
                )}
              </Pressable>
            ) : null}
            {searchQuery.isFetching && !searchQuery.isFetchingNextPage ? (
              <ActivityIndicator color={colors.brand600} style={{ marginTop: 16 }} />
            ) : null}
          </View>
        )}
      </ScrollView>

      <SearchResultsFiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onChange={next => {
          setFilters(next)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: homeLayout.gutter },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 12,
  },
  tabsScroll: {
    marginTop: 12,
    marginBottom: 12,
    marginHorizontal: -homeLayout.gutter,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: homeLayout.gutter,
    gap: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    paddingHorizontal: 10,
    gap: 6,
    position: 'relative',
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.brand700 },
  tabBadge: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
  },
  tabBadgeActive: { backgroundColor: colors.brand100 },
  tabBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tabBadgeTextActive: { color: colors.brand800 },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: colors.brand600,
    borderRadius: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  metaText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  filterBtnTextActive: { color: colors.brand700 },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand500,
  },
  filtersHint: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  filtersHintTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  filtersHintText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  merchantList: { gap: 16 },
  productGrid: { gap: 12 },
  productRow: { gap: 12, marginBottom: 12 },
  crossSell: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    gap: 16,
  },
  crossSellHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  crossSellTitles: { flex: 1 },
  crossSellTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 4,
  },
  crossSellSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  crossSellLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand700,
  },
  errorBanner: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.brand800,
  },
  loadMoreBtn: {
    marginTop: 16,
    marginBottom: 8,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadMoreText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
  },
  emptyCta: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyCtaText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
  },
})
