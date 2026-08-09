import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CompactProductCard } from '@/src/components/CompactProductCard'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { SectionHeader } from '@/src/components/SectionHeader'
import { ShopCard } from '@/src/components/ShopCard'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, spacing } from '@/src/theme'

export default function MarketplaceScreen() {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode)

  const { data, isLoading } = useQuery({
    queryKey: ['marketplace', countryCode],
    queryFn: async () => {
      const api = getApiClient()
      const [products, spotlight, shops] = await Promise.allSettled([
        api.getMarketplaceFeatured(),
        api.getMarketplaceSpotlight(),
        api.getMarketplaceShops(24),
      ])
      const spotlightShops = spotlight.status === 'fulfilled' ? spotlight.value : []
      const fallbackShops = shops.status === 'fulfilled' ? shops.value : []
      return {
        products: products.status === 'fulfilled' ? products.value : [],
        shops: spotlightShops.length > 0 ? spotlightShops : fallbackShops,
      }
    },
  })

  if (isLoading || !data) return <LoadingState />

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Marketplace</Text>
      <Text style={styles.subtitle}>Produits et boutiques locales</Text>

      {data.products.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionPad}>
            <SectionHeader title="Nouveautés" />
          </View>
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

      {data.shops.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionPad}>
            <SectionHeader title="Boutiques" />
          </View>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 32 },
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
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionPad: { paddingHorizontal: spacing.gutter },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.gutter,
    gap: 12,
  },
  productCell: { width: '47%' },
})
