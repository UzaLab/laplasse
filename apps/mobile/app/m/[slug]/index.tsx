import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FlatList, Image, StyleSheet, Text, View } from 'react-native'
import { ProductCard } from '@/src/components/ProductCard'
import { LoadingState, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors } from '@/src/theme'

export default function MerchantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const merchantQuery = useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => getApiClient().getMerchant(String(slug)),
    enabled: !!slug,
  })

  const productsQuery = useQuery({
    queryKey: ['merchant-products', slug],
    queryFn: () => getApiClient().getMerchantProducts(String(slug)),
    enabled: !!slug,
  })

  if (merchantQuery.isLoading) return <LoadingState />

  const merchant = merchantQuery.data
  if (!merchant) {
    return (
      <Screen>
        <Title>Boutique introuvable</Title>
      </Screen>
    )
  }

  const products = productsQuery.data?.data ?? []

  return (
    <Screen padded={false}>
      <View style={styles.hero}>
        {merchant.cover_image ? (
          <Image source={{ uri: merchant.cover_image }} style={styles.cover} />
        ) : null}
        <View style={styles.heroContent}>
          <Title>{merchant.business_name}</Title>
          <Subtitle>{merchant.category.name}</Subtitle>
          {merchant.description ? <Text style={styles.desc}>{merchant.description}</Text> : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Produits</Text>
        <FlatList
          data={products}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              onPress={() => router.push(`/m/${slug}/p/${item.slug}`)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Aucun produit disponible</Text>}
          contentContainerStyle={styles.list}
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Voir le panier" onPress={() => router.push('/cart')} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface },
  cover: { width: '100%', height: 160 },
  heroContent: { padding: 16 },
  desc: { color: colors.textMuted, marginTop: 8, lineHeight: 20 },
  section: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  list: { paddingBottom: 80 },
  empty: { color: colors.textMuted },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
})
