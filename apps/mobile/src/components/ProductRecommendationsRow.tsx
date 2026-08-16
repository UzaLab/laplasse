import { useQuery } from '@tanstack/react-query'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { MarketplaceCatalogProduct } from '@laplasse/api-client'
import { MarketplaceProductGridCard } from '@/src/components/MarketplaceProductGridCard'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, homeLayout, spacing } from '@/src/theme'

const CARD_WIDTH = (Dimensions.get('window').width - spacing.gutter * 2 - homeLayout.stackMd) / 2

export function ProductRecommendationsRow({
  productId,
  title = 'Produits similaires',
  limit = 10,
}: {
  productId?: string
  title?: string
  limit?: number
}) {
  const router = useRouter()
  const query = useQuery({
    queryKey: ['product-recommendations', productId, limit],
    queryFn: () => getApiClient().getMarketplaceRecommendations(productId, limit),
    enabled: !!productId,
  })

  const items = (query.data ?? []).filter(p => p.id !== productId)
  if (!items.length) return null

  const pairs: MarketplaceCatalogProduct[][] = []
  for (let i = 0; i < items.length; i += 2) {
    pairs.push(items.slice(i, i + 2))
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.track}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH * 2 + homeLayout.stackMd}
      >
        {pairs.map((pair, index) => (
          <View key={`pair-${index}`} style={styles.pair}>
            {pair.map(product => (
              <View key={product.id} style={styles.cell}>
                <MarketplaceProductGridCard
                  product={product}
                  showMerchantName
                  onPress={() => router.push(`/m/${product.merchant.slug}/p/${product.slug}`)}
                />
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surface,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.text,
    paddingHorizontal: spacing.gutter,
    marginBottom: 16,
  },
  track: {
    paddingHorizontal: spacing.gutter,
    gap: homeLayout.stackMd,
  },
  pair: {
    flexDirection: 'row',
    gap: homeLayout.stackMd,
    width: CARD_WIDTH * 2 + homeLayout.stackMd,
  },
  cell: {
    width: CARD_WIDTH,
  },
})
