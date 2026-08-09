import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { NearbyCard } from '@/src/components/NearbyCard'
import { CompactProductCard } from '@/src/components/CompactProductCard'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, spacing } from '@/src/theme'

type Tab = 'all' | 'merchants' | 'products'

export default function SearchScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ q?: string; category?: string }>()
  const [query, setQuery] = useState(params.q ?? '')
  const [submitted, setSubmitted] = useState(params.q ?? '')
  const [tab, setTab] = useState<Tab>('all')

  useEffect(() => {
    if (params.q && params.q !== submitted) {
      setQuery(params.q)
      setSubmitted(params.q)
    }
  }, [params.q])

  const searchQuery = useQuery({
    queryKey: ['search', submitted, tab, params.category],
    queryFn: () =>
      getApiClient().unifiedSearchAdvanced({
        q: submitted,
        type: tab === 'all' ? 'all' : tab,
        limit: 20,
        category: params.category,
      }),
    enabled: submitted.length >= 2,
  })

  const merchants = searchQuery.data?.merchants.data ?? []
  const products = searchQuery.data?.products.data ?? []

  return (
    <View style={styles.root}>
      <View style={styles.searchWrap}>
        <SearchAutocomplete
          initialQuery={query}
          autoFocus={!submitted}
          onSubmit={q => {
            setQuery(q)
            setSubmitted(q)
          }}
        />
      </View>

      {submitted.length >= 2 ? (
        <>
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

          {searchQuery.isLoading ? (
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
                  product={{
                    ...item,
                    merchant: item.merchant,
                  }}
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
                  <NearbyCard
                    merchant={item}
                    onPress={() => router.push(`/m/${item.slug}`)}
                  />
                </View>
              )}
            />
          ) : merchants.length === 0 && products.length === 0 ? (
            <EmptyState title="Aucun résultat" subtitle={`Pour « ${submitted} »`} />
          ) : (
            <FlatList
              data={[
                ...merchants.map(m => ({ kind: 'merchant' as const, item: m })),
                ...products.map(p => ({ kind: 'product' as const, item: p })),
              ]}
              keyExtractor={(row, i) => `${row.kind}-${row.item.id}-${i}`}
              contentContainerStyle={styles.list}
              renderItem={({ item: row }) =>
                row.kind === 'merchant' ? (
                  <View style={styles.merchantItem}>
                    <NearbyCard
                      merchant={row.item}
                      onPress={() => router.push(`/m/${row.item.slug}`)}
                    />
                  </View>
                ) : (
                  <CompactProductCard
                    product={{ ...row.item, merchant: row.item.merchant }}
                    onPress={() =>
                      router.push(`/m/${row.item.merchant.slug}/p/${row.item.slug}`)
                    }
                  />
                )
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          title="Recherchez sur LaPlasse"
          subtitle="Établissements, produits, services… Les suggestions Meilisearch s'affichent pendant la saisie."
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  searchWrap: { padding: spacing.gutter, paddingBottom: 8 },
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
  tabActive: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand200,
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextActive: { color: colors.brand800 },
  list: { paddingHorizontal: spacing.gutter, paddingBottom: 24 },
  merchantItem: { marginBottom: 12 },
  productRow: { gap: 12, marginBottom: 12 },
})
