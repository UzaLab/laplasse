import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppHeader } from '@/src/components/AppHeader'
import { CompactProductCard } from '@/src/components/CompactProductCard'
import { NearbyCard } from '@/src/components/NearbyCard'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, layout, spacing } from '@/src/theme'

type Tab = 'all' | 'merchants' | 'products'

export default function SearchResultsView({
  initialQuery,
  initialCategory,
  filtersOpen = false,
  onClear,
}: {
  initialQuery: string
  initialCategory?: string
  filtersOpen?: boolean
  onClear: () => void
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState(initialQuery)
  const [submitted, setSubmitted] = useState(initialQuery)
  const [tab, setTab] = useState<Tab>('all')

  const searchQuery = useQuery({
    queryKey: ['search', submitted, tab, initialCategory],
    queryFn: () =>
      getApiClient().unifiedSearchAdvanced({
        q: submitted,
        type: tab === 'all' ? 'all' : tab,
        limit: 20,
        category: initialCategory || undefined,
      }),
    enabled: submitted.length >= 2,
  })

  const goToMap = () => {
    onClear()
    router.replace('/(tabs)/search')
  }

  const merchants = searchQuery.data?.merchants.data ?? []
  const products = searchQuery.data?.products.data ?? []

  return (
    <View style={styles.root}>
      <View style={{ paddingTop: insets.top }}>
        <AppHeader showMenu={false} />
      </View>
      <View style={styles.searchWrap}>
        <SearchAutocomplete
          initialQuery={query}
          autoFocus={filtersOpen || !initialQuery}
          onSubmit={q => {
            setQuery(q)
            setSubmitted(q)
          }}
        />
        <Pressable onPress={goToMap} hitSlop={8}>
          <Text style={styles.backLink}>← Carte</Text>
        </Pressable>
      </View>

      {filtersOpen && submitted.length < 2 ? (
        <View style={styles.filtersHint}>
          <Text style={styles.filtersHintTitle}>Recherche avancée</Text>
          <Text style={styles.filtersHintText}>
            Saisissez au moins 2 caractères pour explorer établissements et produits.
          </Text>
        </View>
      ) : null}

      <View style={styles.tabs}>
        {(['all', 'merchants', 'products'] as Tab[]).map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'all' ? 'Tout' : t === 'merchants' ? 'Établissements' : 'Produits'}
            </Text>
          </Pressable>
        ))}
      </View>

      {submitted.length < 2 ? (
        filtersOpen ? null : <EmptyState title="Recherchez un établissement ou un produit" />
      ) : searchQuery.isLoading ? (
        <LoadingState />
      ) : tab === 'products' ? (
        <FlatList
          data={products}
          keyExtractor={p => p.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="Aucun produit" />}
          renderItem={({ item }) => (
            <CompactProductCard
              product={{ ...item, merchant: item.merchant }}
              onPress={() => router.push(`/m/${item.merchant.slug}/p/${item.slug}`)}
            />
          )}
        />
      ) : tab === 'merchants' ? (
        <FlatList
          data={merchants}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="Aucun établissement" />}
          renderItem={({ item }) => (
            <View style={styles.merchantItem}>
              <NearbyCard merchant={item} onPress={() => router.push(`/m/${item.slug}`)} />
            </View>
          )}
        />
      ) : merchants.length === 0 && products.length === 0 ? (
        <EmptyState title="Aucun résultat" subtitle={`Pour « ${submitted} »`} />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {merchants.map(m => (
            <View key={m.id} style={styles.merchantItem}>
              <NearbyCard merchant={m} onPress={() => router.push(`/m/${m.slug}`)} />
            </View>
          ))}
          {products.map(p => (
            <CompactProductCard
              key={p.id}
              product={{ ...p, merchant: p.merchant }}
              onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: { paddingHorizontal: spacing.gutter, paddingBottom: 4 },
  backLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.brand700,
    marginTop: 8,
    marginBottom: 4,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: spacing.gutter,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.brand50, borderColor: colors.brand200 },
  tabText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: colors.brand800 },
  filtersHint: {
    marginHorizontal: spacing.gutter,
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
  list: { paddingHorizontal: spacing.gutter, paddingBottom: layout.bottomNavHeight + 16 },
  merchantItem: { marginBottom: 12 },
  productRow: { gap: 12, marginBottom: 12 },
})
