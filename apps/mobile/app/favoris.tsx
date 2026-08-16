import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { ProductFavoriteButton } from '@/src/components/ProductFavoriteButton'
import {
  ProfileFilterTabs,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { ProfileShell } from '@/src/components/profile/ProfileShell'
import { EmptyState, LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { profileTheme } from '@/src/lib/profileTheme'
import { useAuthStore } from '@/src/stores/authStore'
import { fonts, layout } from '@/src/theme'

type Tab = 'merchants' | 'products'

export default function FavorisScreen() {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)
  const [tab, setTab] = useState<Tab>('merchants')

  const merchantsQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () => getApiClient().getFavoriteMerchants(),
    enabled: isAuthenticated,
  })

  const productsQuery = useQuery({
    queryKey: ['product-favorites'],
    queryFn: () => getApiClient().getFavoriteProducts(),
    enabled: isAuthenticated,
  })

  const filteredMerchants = useMemo(() => merchantsQuery.data ?? [], [merchantsQuery.data])
  const filteredProducts = useMemo(() => productsQuery.data ?? [], [productsQuery.data])

  if (!hydrated) {
    return (
      <ProfileShell>
        <LoadingState />
      </ProfileShell>
    )
  }

  if (!isAuthenticated) {
    return (
      <ProfileShell>
        <View style={styles.center}>
          <EmptyState title="Connectez-vous" subtitle="Retrouvez vos établissements et produits favoris." />
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </View>
      </ProfileShell>
    )
  }

  const loading = tab === 'merchants' ? merchantsQuery.isLoading : productsQuery.isLoading

  const header = (
    <View style={styles.header}>
      <ProfilePageTitle
        title="Mes favoris"
        subtitle="Retrouvez vos établissements et produits enregistrés."
      />
      <ProfileFilterTabs
        tabs={[
          { id: 'merchants' as const, label: 'Établissements' },
          { id: 'products' as const, label: 'Produits' },
        ]}
        active={tab}
        onChange={setTab}
      />
    </View>
  )

  if (loading) {
    return (
      <ProfileShell>
        {header}
        <LoadingState />
      </ProfileShell>
    )
  }

  return (
    <ProfileShell>
      {tab === 'merchants' ? (
        <FlatList
          data={filteredMerchants}
          keyExtractor={m => m.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState
              title="Aucun favori"
              subtitle="Explorez la recherche et ajoutez des établissements."
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.merchantCard}
              onPress={() => router.push(`/m/${item.slug}`)}
            >
              {item.cover_image ? (
                <AppImage uri={item.cover_image} style={styles.cover} fallbackLetter={item.business_name.slice(0, 1)} />
              ) : (
                <View style={[styles.cover, styles.coverFallback]} />
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.business_name}</Text>
                  <FavoriteButton merchantId={item.id} />
                </View>
                <Text style={styles.cardMeta}>{item.category.name}</Text>
                {item.location ? (
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={profileTheme.textMuted} />
                    <Text style={styles.cardMeta}>
                      {[item.location.district, item.location.city].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={p => p.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.list}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <EmptyState title="Aucun produit favori" subtitle="Parcourez le marketplace." />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.productCard}
              onPress={() => router.push(`/m/${item.merchant.slug}/p/${item.slug}`)}
            >
              <View style={styles.productImageWrap}>
                {item.image_url ? (
                  <AppImage uri={item.image_url} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.coverFallback]} />
                )}
                <View style={styles.productHeart}>
                  <ProductFavoriteButton productId={item.id} size={18} />
                </View>
              </View>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.productPrice}>{formatPrice(item.price, item.currency)}</Text>
            </Pressable>
          )}
        />
      )}
    </ProfileShell>
  )
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 16,
  },
  header: { gap: 16, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  list: {
    paddingHorizontal: 20,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 12,
  },
  merchantCard: {
    backgroundColor: profileTheme.surface,
    borderRadius: profileTheme.cardRadiusSm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: profileTheme.border,
  },
  cover: { width: '100%', height: 120 },
  coverFallback: { backgroundColor: profileTheme.borderLight },
  cardBody: { padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: profileTheme.text },
  cardMeta: { fontFamily: fonts.regular, fontSize: 13, color: profileTheme.textMuted, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  productRow: { gap: 12 },
  productCard: { flex: 1, maxWidth: '48%' },
  productImageWrap: { position: 'relative' },
  productImage: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  productHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
  },
  productName: { fontFamily: fonts.medium, fontSize: 14, color: profileTheme.text, marginTop: 8 },
  productPrice: { fontFamily: fonts.bold, fontSize: 14, color: profileTheme.accent, marginTop: 4 },
})
