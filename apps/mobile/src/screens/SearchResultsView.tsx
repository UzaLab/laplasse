import { useQuery } from '@tanstack/react-query'
import { getDefaultCity } from '@laplasse/shared-config'
import type { ApiMerchant } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
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
import { SearchResultsMerchantCard } from '@/src/components/SearchResultsMerchantCard'
import { SearchResultsProductCard } from '@/src/components/SearchResultsProductCard'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { getApiClient } from '@/src/lib/api'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

type Tab = 'merchants' | 'products'

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

function merchantHref(merchant: ApiMerchant): `/m/${string}` | `/restauration/${string}` {
  if (isFoodCategorySlug(merchant.category.slug)) return `/restauration/${merchant.slug}`
  return `/m/${merchant.slug}`
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(initialFiltersOpen)
  const [filters, setFilters] = useState<SearchResultsFilters>(() => ({
    categories: initialCategory ? initialCategory.split(',').filter(Boolean) : [],
    sort: 'trust_score',
  }))

  const debouncedQuery = useDebouncedValue(query, 350)
  const pageSize = 12

  const searchQuery = useQuery({
    queryKey: [
      'search',
      debouncedQuery,
      city,
      filters.sort,
      filters.categories.length === 1 ? filters.categories[0] : null,
    ],
    queryFn: () =>
      getApiClient().unifiedSearchAdvanced({
        q: debouncedQuery,
        type: 'all',
        limit: pageSize,
        offset: 0,
        city,
        category: filters.categories.length === 1 ? filters.categories[0] : undefined,
        sort: filters.sort,
      }),
    enabled: debouncedQuery.length >= 2,
  })

  const trendingQuery = useQuery({
    queryKey: ['search-trending', city, countryCode],
    queryFn: () => getApiClient().getFeaturedMerchants(city, 6, countryCode),
    enabled:
      debouncedQuery.length >= 2
      && searchQuery.isSuccess
      && (searchQuery.data?.merchants.data.length ?? 0) === 0,
    staleTime: 60_000,
  })

  const merchants = useMemo(
    () => applyCategoryFilter(searchQuery.data?.merchants.data ?? [], filters.categories),
    [searchQuery.data?.merchants.data, filters.categories],
  )
  const products = useMemo(() => {
    const list = searchQuery.data?.products.data ?? []
    if (filters.categories.length === 0) return list
    return list.filter(p => {
      const slug = (p as { category?: { slug?: string } }).category?.slug
      return slug != null && filters.categories.includes(slug)
    })
  }, [searchQuery.data?.products.data, filters.categories])

  const merchantTotal = filters.categories.length > 1 ? merchants.length : (searchQuery.data?.merchants.meta.total ?? 0)
  const productTotal = searchQuery.data?.products.meta.total ?? 0
  const activeTotal = tab === 'merchants' ? merchantTotal : productTotal
  const hasFilters = filters.categories.length > 0 || filters.sort !== 'trust_score'
  const listBottomPad = layout.bottomNavHeight + insets.bottom + 16
  const productColWidth = (Dimensions.get('window').width - homeLayout.gutter * 2 - 12) / 2

  const goToMap = () => {
    onClear()
    router.replace('/(tabs)/search')
  }

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
          <EmptyState title="Recherchez un établissement ou un produit" />
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
      >
        <View style={styles.searchField}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Établissements, produits, services…"
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

        <Pressable onPress={goToMap} hitSlop={8} style={styles.backLinkWrap}>
          <Text style={styles.backLink}>← Carte</Text>
        </Pressable>

        {initialFiltersOpen && debouncedQuery.length < 2 ? (
          <View style={styles.filtersHint}>
            <Text style={styles.filtersHintTitle}>Recherche avancée</Text>
            <Text style={styles.filtersHintText}>
              Saisissez au moins 2 caractères pour explorer établissements et produits.
            </Text>
          </View>
        ) : null}

        <View style={styles.tabs}>
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
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaText} numberOfLines={1}>
            {searchQuery.isFetching && merchants.length === 0 && products.length === 0
              ? 'Recherche en cours…'
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
              <EmptyState title="Aucun établissement" subtitle={`Pour « ${debouncedQuery} »`} />
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
            {searchQuery.isFetching ? (
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
  backLinkWrap: { marginTop: 8, marginBottom: 4 },
  backLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.brand700,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
    marginTop: 12,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
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
    left: '15%',
    right: '15%',
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
})
