import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { MerchantCard } from '@/src/components/MerchantCard'
import { ProductCard } from '@/src/components/ProductCard'
import { EmptyState, FieldInput, LoadingState, Screen, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors } from '@/src/theme'

export default function SearchScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')

  const searchQuery = useQuery({
    queryKey: ['search', submitted],
    queryFn: () => getApiClient().unifiedSearch(submitted),
    enabled: submitted.length >= 2,
  })

  return (
    <Screen>
      <Title>Recherche</Title>
      <FieldInput
        placeholder="Restaurants, produits, boutiques…"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => setSubmitted(query.trim())}
        returnKeyType="search"
      />

      {submitted.length < 2 ? (
        <EmptyState title="Tapez au moins 2 caractères" />
      ) : searchQuery.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={[
            ...(searchQuery.data?.merchants.data.map(m => ({ type: 'merchant' as const, item: m })) ?? []),
            ...(searchQuery.data?.products.data.map(p => ({ type: 'product' as const, item: p })) ?? []),
          ]}
          keyExtractor={(row, index) => `${row.type}-${'id' in row.item ? row.item.id : index}`}
          renderItem={({ item: row }) =>
            row.type === 'merchant' ? (
              <MerchantCard
                merchant={row.item}
                onPress={() => router.push(`/m/${row.item.slug}`)}
              />
            ) : (
              <ProductCard
                product={{
                  id: row.item.id,
                  name: row.item.name,
                  slug: row.item.slug,
                  price: row.item.price,
                  currency: row.item.currency,
                  image_url: row.item.image_url,
                  merchant: {
                    id: '',
                    business_name: row.item.merchant.business_name,
                    slug: row.item.merchant.slug,
                  },
                }}
                onPress={() => router.push(`/m/${row.item.merchant.slug}/p/${row.item.slug}`)}
              />
            )
          }
          ListEmptyComponent={<EmptyState title="Aucun résultat" />}
          contentContainerStyle={styles.list}
        />
      )}
    </Screen>
  )
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24 },
})
