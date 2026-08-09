import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import { LoadingState, PrimaryButton, Screen, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors } from '@/src/theme'

export default function ProductScreen() {
  const { slug, productSlug } = useLocalSearchParams<{ slug: string; productSlug: string }>()
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addItem = useCartStore(s => s.addItem)
  const [adding, setAdding] = useState(false)

  const productQuery = useQuery({
    queryKey: ['product', slug, productSlug],
    queryFn: () => getApiClient().getProduct(String(slug), String(productSlug)),
    enabled: !!slug && !!productSlug,
  })

  if (productQuery.isLoading) return <LoadingState />

  const product = productQuery.data
  if (!product) {
    return (
      <Screen>
        <Title>Produit introuvable</Title>
      </Screen>
    )
  }

  async function onAddToCart() {
    if (!product) return
    if (!isAuthenticated) {
      router.push('/(auth)/login')
      return
    }
    setAdding(true)
    const variantId = product.variants?.[0]?.id
    const result = await addItem(product.id, 1, variantId)
    setAdding(false)
    if (result.error) {
      Alert.alert('Panier', result.error)
      return
    }
    Alert.alert('Panier', 'Article ajouté', [
      { text: 'Continuer' },
      { text: 'Voir le panier', onPress: () => router.push('/cart') },
    ])
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.content}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={styles.body}>
          <Title>{product.name}</Title>
          <Text style={styles.price}>{formatPrice(product.price, product.currency)}</Text>
          {product.short_description ? (
            <Text style={styles.desc}>{product.short_description}</Text>
          ) : null}
          {product.description ? (
            <Text style={styles.desc}>{product.description}</Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton label="Ajouter au panier" onPress={() => void onAddToCart()} loading={adding} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  image: { width: '100%', height: 280 },
  imageFallback: { backgroundColor: colors.border },
  body: { padding: 16 },
  price: { fontSize: 20, fontWeight: '700', color: colors.primary, marginBottom: 12 },
  desc: { fontSize: 15, color: colors.textMuted, lineHeight: 22, marginBottom: 8 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
})
