import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppHeader } from '@/src/components/AppHeader'
import { CompactProductCard } from '@/src/components/CompactProductCard'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { SectionHeader } from '@/src/components/SectionHeader'
import { ShopCard } from '@/src/components/ShopCard'
import { LoadingState } from '@/src/components/ui'
import { NetworkErrorBanner } from '@/src/components/NetworkErrorBanner'
import { getApiClient } from '@/src/lib/api'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function MarketplaceScreen() {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode)

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['marketplace', countryCode],
    queryFn: async () => {
      const api = getApiClient()
      const [products, spotlight, shops] = await Promise.allSettled([
        api.getMarketplaceFeatured(),
        api.getMarketplaceSpotlight(),
        api.getMarketplaceShops(24),
      ])
      if (products.status === 'rejected' && spotlight.status === 'rejected') {
        throw new Error('API indisponible')
      }
      const spotlightShops = spotlight.status === 'fulfilled' ? spotlight.value : []
      const fallbackShops = shops.status === 'fulfilled' ? shops.value : []
      return {
        products: products.status === 'fulfilled' ? products.value : [],
        shops: spotlightShops.length > 0 ? spotlightShops : fallbackShops,
      }
    },
  })

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Marketplace</Text>
        <Text style={styles.subtitle}>
          Produits et boutiques locales — même catalogue que la PWA.
        </Text>

        <View style={styles.search}>
          <SearchAutocomplete
            placeholder="Rechercher un produit…"
            onSubmit={q => router.push({ pathname: '/(tabs)/search', params: { q } })}
          />
        </View>

        {isLoading ? (
          <LoadingState />
        ) : (
          <>
            {isError ? (
              <NetworkErrorBanner
                message="Impossible de charger le marketplace."
                onRetry={() => void refetch()}
                loading={isFetching}
              />
            ) : null}

            {data && data.products.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Nouveautés" />
                <View style={styles.productGrid}>
                  {data.products.map(p => (
                    <View key={p.id} style={styles.productCell}>
                      <CompactProductCard
                        product={p}
                        onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {data && data.shops.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Boutiques à découvrir" />
                <HorizontalCarousel
                  data={data.shops}
                  keyExtractor={s => s.id}
                  itemWidth={88}
                  renderItem={s => (
                    <ShopCard shop={s} onPress={() => router.push(`/m/${s.slug}`)} />
                  )}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: layout.bottomNavInset + 24 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    paddingTop: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    paddingHorizontal: spacing.gutter,
    marginBottom: 16,
  },
  search: { paddingHorizontal: spacing.gutter, marginBottom: 20 },
  section: { marginBottom: 24, paddingHorizontal: spacing.gutter },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCell: { width: '47%' },
})
