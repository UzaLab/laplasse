import { useQuery } from '@tanstack/react-query'
import type { ApiMerchant } from '@laplasse/api-client'
import { getDefaultCity } from '@laplasse/shared-config'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import {
  SEARCH_MAP_CARD_SNAP,
  SearchMapMerchantCard,
} from '@/src/components/SearchMapMerchantCard'
import { SearchOsmMap } from '@/src/components/SearchOsmMap'
import { SearchRadiusControl } from '@/src/components/SearchRadiusControl'
import { LoadingState } from '@/src/components/ui'
import { useSearchMobileNearby } from '@/src/hooks/useSearchMobileNearby'
import { getApiClient } from '@/src/lib/api'
import { coordsFromCityName } from '@/src/lib/cityCoords'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

const EMPTY_MERCHANTS: ApiMerchant[] = []

export function SearchDiscoverView({ initialCategory = '' }: { initialCategory?: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [radiusOpen, setRadiusOpen] = useState(false)
  const cardsRef = useRef<ScrollView>(null)

  const bootstrapQuery = useQuery({
    queryKey: ['search-discover-bootstrap', countryCode, city],
    queryFn: async () => {
      const api = getApiClient()
      const [categories, featured] = await Promise.all([
        api.getCategories(),
        api.getFeaturedMerchants(city, 12, countryCode),
      ])
      return { categories, featured }
    },
    staleTime: 60_000,
  })

  const fallbackMerchants = useMemo(
    () => bootstrapQuery.data?.featured ?? EMPTY_MERCHANTS,
    [bootstrapQuery.data?.featured],
  )

  const {
    radiusKm,
    setRadiusKm,
    minRadiusKm,
    maxRadiusKm,
    userLocation,
    geoStatus,
    merchants: nearbyMerchants,
    loadingMerchants,
    requestGeolocation,
  } = useSearchMobileNearby(
    city,
    countryCode,
    fallbackMerchants,
  )

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory)
  }, [initialCategory])

  const mapCenter = useMemo(
    () => userLocation ?? coordsFromCityName(city, countryCode),
    [userLocation, city, countryCode],
  )

  const filtered = useMemo(() => {
    if (!selectedCategory) return nearbyMerchants
    return nearbyMerchants.filter(m => m.category.slug === selectedCategory)
  }, [nearbyMerchants, selectedCategory])

  const filteredKey = useMemo(
    () => filtered.map(m => m.id).join(','),
    [filtered],
  )

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
      return
    }
    setSelectedId(prev => {
      if (prev && filtered.some(m => m.id === prev)) return prev
      return filtered[0]!.id
    })
  }, [filteredKey])

  const scrollToMerchant = useCallback((merchantId: string) => {
    const index = filtered.findIndex(m => m.id === merchantId)
    if (index >= 0) {
      cardsRef.current?.scrollTo({ x: index * SEARCH_MAP_CARD_SNAP, animated: true })
    }
  }, [filtered])

  const handleSelectMerchant = useCallback(
    (merchantId: string) => {
      setSelectedId(merchantId)
      scrollToMerchant(merchantId)
    },
    [scrollToMerchant],
  )

  const openAdvancedSearch = () => {
    router.push({ pathname: '/(tabs)/search', params: { filters: '1' } })
  }

  if (bootstrapQuery.isLoading) {
    return (
      <View style={styles.root}>
        <LoadingState />
      </View>
    )
  }

  const categories = bootstrapQuery.data?.categories ?? []
  const cardsBottom = layout.bottomNavHeight + insets.bottom + 4

  return (
    <View style={styles.root}>
      <SearchOsmMap
        merchants={filtered}
        selectedId={selectedId}
        onSelect={handleSelectMerchant}
        center={mapCenter}
        userLocation={userLocation}
        radiusKm={userLocation ? radiusKm : undefined}
      />

      <View
        style={[styles.topOverlay, { paddingTop: insets.top + 12 }]}
        pointerEvents="box-none"
      >
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <SearchAutocomplete
              appearance="map"
              placeholder={`Rechercher à ${city}…`}
              onSubmit={q => router.push({ pathname: '/(tabs)/search', params: { q } })}
            />
          </View>
          <Pressable
            onPress={openAdvancedSearch}
            style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
            accessibilityLabel="Filtres avancés"
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </Pressable>
        </View>

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            <Pressable
              onPress={() => setSelectedCategory('')}
              style={[styles.categoryPill, !selectedCategory && styles.categoryPillActive]}
            >
              <Text
                style={[styles.categoryPillText, !selectedCategory && styles.categoryPillTextActive]}
              >
                Tout
              </Text>
            </Pressable>
            {categories.map(cat => {
              const active = selectedCategory === cat.slug
              const icon = getCategoryIcon(cat.slug, cat.icon)
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(active ? '' : cat.slug)}
                  style={[styles.categoryPill, active && styles.categoryPillActive]}
                >
                  <Ionicons
                    name={icon}
                    size={15}
                    color={active ? '#fff' : colors.brand700}
                  />
                  <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                    {cat.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>
        ) : null}
      </View>

      <View style={[styles.bottomOverlay, { bottom: cardsBottom }]} pointerEvents="box-none">
        <View style={styles.radiusRow}>
          <SearchRadiusControl
            radiusKm={radiusKm}
            minRadiusKm={minRadiusKm}
            maxRadiusKm={maxRadiusKm}
            onRadiusChange={setRadiusKm}
            open={radiusOpen}
            onOpenChange={setRadiusOpen}
            userLocation={userLocation}
            geoStatus={geoStatus}
            onRequestGeolocation={requestGeolocation}
            loadingMerchants={loadingMerchants}
          />
        </View>

        {filtered.length > 0 ? (
          <ScrollView
            ref={cardsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={SEARCH_MAP_CARD_SNAP}
            contentContainerStyle={styles.cardsRow}
          >
            {filtered.map(merchant => (
              <SearchMapMerchantCard
                key={merchant.id}
                merchant={merchant}
                active={selectedId === merchant.id}
                onPress={() => router.push(`/m/${merchant.slug}`)}
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {userLocation
                ? `Aucun établissement dans un rayon de ${radiusKm} km.`
                : 'Aucun établissement pour ce filtre.'}
            </Text>
            {userLocation && radiusKm < maxRadiusKm ? (
              <Pressable onPress={() => setRadiusKm(km => Math.min(maxRadiusKm, km + 2))}>
                <Text style={styles.emptyLink}>
                  Élargir à {Math.min(maxRadiusKm, radiusKm + 2)} km
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={openAdvancedSearch}>
              <Text style={styles.emptySecondary}>Recherche avancée →</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#eef2f6' },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    paddingHorizontal: homeLayout.gutter,
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchField: { flex: 1, minWidth: 0 },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  pressed: { opacity: 0.85 },
  categoryRow: { gap: 8, paddingBottom: 4 },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  categoryPillActive: {
    backgroundColor: colors.slate900,
    borderColor: colors.slate900,
  },
  categoryPillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  categoryPillTextActive: { color: '#fff' },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 40,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: homeLayout.gutter,
    paddingBottom: 8,
  },
  cardsRow: {
    paddingHorizontal: homeLayout.gutter,
    gap: 16,
    paddingBottom: 4,
  },
  emptyCard: {
    marginHorizontal: homeLayout.gutter,
    padding: 20,
    borderRadius: homeLayout.radiusXl,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
  },
  emptyLink: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand600,
  },
  emptySecondary: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
})
