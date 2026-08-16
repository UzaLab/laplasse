import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDefaultCity } from '@laplasse/shared-config'
import type { FeaturedProduct } from '@laplasse/api-client'
import { CategoryCarousel } from '@/src/components/CategoryCarousel'
import { HomeGreeting } from '@/src/components/HomeGreeting'
import { HomeProductGridCard } from '@/src/components/HomeProductGridCard'
import { HomeTopBar } from '@/src/components/HomeTopBar'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { NearbyCard } from '@/src/components/NearbyCard'
import { NetworkErrorBanner } from '@/src/components/NetworkErrorBanner'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { SectionHeader } from '@/src/components/SectionHeader'
import { SpotlightShopsCarousel } from '@/src/components/SpotlightShopsCarousel'
import { LoadingState } from '@/src/components/ui'
import { useHomeData } from '@/src/hooks/useHomeData'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

export default function HomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { data, isLoading, isError, refetch, isFetching } = useHomeData(countryCode)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const scrollTopPad = insets.top + homeLayout.topBarHeight + 8

  if (isLoading) {
    return (
      <View style={styles.root}>
        <HomeTopBar
          onOpenMenu={() => setDrawerOpen(true)}
          isAuthenticated={isAuthenticated}
          avatarLabel={greetingName(user?.full_name, user?.email)}
        />
        <LoadingState />
      </View>
    )
  }

  const isEmpty =
    !data ||
    (data.categories.length === 0 &&
      data.merchants.length === 0 &&
      data.products.length === 0 &&
      data.shops.length === 0)

  const firstName = greetingName(user?.full_name, user?.email)
  const cityLabel = data?.city ?? getDefaultCity(countryCode)

  const productPairs: FeaturedProduct[][] = []
  if (data?.products) {
    for (let i = 0; i < data.products.length; i += 2) {
      productPairs.push(data.products.slice(i, i + 2))
    }
  }

  return (
    <View style={styles.root}>
      <HomeTopBar
        onOpenMenu={() => setDrawerOpen(true)}
        isAuthenticated={isAuthenticated}
        avatarLabel={firstName}
      />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: scrollTopPad,
            paddingBottom: layout.bottomNavHeight + insets.bottom + 4,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {(isError || isEmpty) && (
          <NetworkErrorBanner
            message={
              isEmpty
                ? 'Impossible de charger les données. Vérifiez la connexion à l’API préprod.'
                : 'Erreur réseau lors du chargement.'
            }
            onRetry={() => void refetch()}
            loading={isFetching}
          />
        )}

        <View style={styles.hero}>
          <HomeGreeting firstName={firstName} cityLabel={cityLabel} />
          <View style={styles.searchWrap}>
            <SearchAutocomplete
              appearance="home"
              suggestionsLayout="inline"
              placeholder="Établissements, plats, boutiques, produits…"
            />
          </View>
        </View>

        {data ? (
          <>
            {data.categories.length > 0 ? (
              <View style={styles.section}>
                <CategoryCarousel categories={data.categories} variant="home" />
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionHeader title="Établissements à la une" href="/(tabs)/search" />
              {data.merchants.length > 0 ? (
                <HorizontalCarousel
                  data={data.merchants}
                  keyExtractor={m => m.id}
                  itemWidth={280}
                  contentContainerStyle={styles.carouselBleed}
                  renderItem={m => (
                    <NearbyCard
                      merchant={m}
                      onPress={() => router.push(`/m/${m.slug}`)}
                      onPressProduct={(merchantSlug, productSlug) =>
                        router.push(`/m/${merchantSlug}/p/${productSlug}`)
                      }
                      onPressVertical={(merchantSlug, tab) =>
                        router.push(`/m/${merchantSlug}?tab=${tab}`)
                      }
                    />
                  )}
                />
              ) : (
                <Text style={styles.empty}>Aucun établissement disponible pour le moment.</Text>
              )}
            </View>

            {data.products.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Nouveautés Marketplace" href="/(tabs)/marketplace" />
                <View style={styles.productGrid}>
                  {productPairs.map((pair, rowIndex) => (
                    <View key={rowIndex} style={styles.productRow}>
                      {pair.map(p => (
                        <View key={p.id} style={styles.productCell}>
                          <HomeProductGridCard
                            product={p}
                            onPress={() =>
                              router.push(`/m/${p.merchant.slug}/p/${p.slug}`)
                            }
                          />
                        </View>
                      ))}
                      {pair.length === 1 ? <View style={styles.productCell} /> : null}
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            {data.shops.length > 0 ? (
              <View style={styles.section}>
                <SectionHeader title="Boutiques à découvrir" href="/(tabs)/marketplace" />
                <SpotlightShopsCarousel
                    shops={data.shops}
                    onPressShop={slug => router.push(`/m/${slug}/boutique`)}
                    contentContainerStyle={styles.carouselBleed}
                  />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: homeLayout.gutter },
  hero: { marginBottom: homeLayout.stackLg },
  searchWrap: { marginTop: homeLayout.stackMd },
  section: { marginBottom: homeLayout.stackLg },
  carouselBleed: {
    paddingHorizontal: homeLayout.gutter,
    marginHorizontal: -homeLayout.gutter,
  },
  productGrid: { gap: homeLayout.stackMd },
  productRow: { flexDirection: 'row', gap: homeLayout.stackMd },
  productCell: { flex: 1 },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 24,
  },
})
