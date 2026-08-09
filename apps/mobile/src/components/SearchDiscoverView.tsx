import { useQuery } from '@tanstack/react-query'
import type { ApiMerchant } from '@laplasse/api-client'
import { getDefaultCity } from '@laplasse/shared-config'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useMemo, useState, useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { NearbyCard } from '@/src/components/NearbyCard'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export function SearchDiscoverView({ initialCategory = '' }: { initialCategory?: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [radiusKm, setRadiusKm] = useState(5)

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory)
  }, [initialCategory])

  const discoverQuery = useQuery({
    queryKey: ['search-discover', countryCode, city, radiusKm],
    queryFn: async () => {
      const api = getApiClient()
      let coords: { lat: number; lng: number } | null = null
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({})
        coords = { lat: loc.coords.latitude, lng: loc.coords.longitude }
      }
      const [categories, nearby, featured] = await Promise.all([
        api.getCategories(),
        coords
          ? api.getNearbyMerchants({ ...coords, radius: radiusKm, country: countryCode, limit: 20 })
          : Promise.resolve([] as ApiMerchant[]),
        api.getFeaturedMerchants(city, 12, countryCode),
      ])
      const merchants = nearby.length > 0 ? nearby : featured
      return { categories, merchants, city, hasGeo: !!coords }
    },
  })

  const filtered = useMemo(() => {
    const merchants = discoverQuery.data?.merchants ?? []
    if (!selectedCategory) return merchants
    return merchants.filter(m => m.category.slug === selectedCategory)
  }, [discoverQuery.data?.merchants, selectedCategory])

  if (discoverQuery.isLoading) return <LoadingState />

  const categories = discoverQuery.data?.categories ?? []

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <SearchAutocomplete
          placeholder={`Rechercher à ${city}…`}
          onSubmit={q => router.push({ pathname: '/(tabs)/search', params: { q } })}
        />
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
            <Text style={[styles.categoryPillText, !selectedCategory && styles.categoryPillTextActive]}>
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
                <Ionicons name={icon} size={15} color={active ? '#fff' : colors.brand700} />
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                  {cat.name}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.radiusRow}>
        {[2, 5, 10].map(km => (
          <Pressable
            key={km}
            onPress={() => setRadiusKm(km)}
            style={[styles.radiusPill, radiusKm === km && styles.categoryPillActive]}
          >
            <Text style={[styles.categoryPillText, radiusKm === km && styles.categoryPillTextActive]}>
              {km} km
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.listArea}>
        {filtered.length > 0 ? (
          <HorizontalCarousel
            data={filtered}
            keyExtractor={m => m.id}
            itemWidth={280}
            contentContainerStyle={{ paddingBottom: layout.bottomNavInset + 16 }}
            renderItem={m => (
              <NearbyCard merchant={m} onPress={() => router.push(`/m/${m.slug}`)} />
            )}
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun établissement pour ce filtre</Text>
            <Pressable onPress={() => setSelectedCategory('')}>
              <Text style={styles.emptyLink}>Réinitialiser les filtres</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.gutter, paddingBottom: 8 },
  categoryRow: {
    paddingHorizontal: spacing.gutter,
    gap: 8,
    paddingBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  categoryPillActive: {
    backgroundColor: colors.slate900,
    borderColor: colors.slate900,
  },
  categoryPillText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  categoryPillTextActive: { color: '#fff' },
  radiusRow: { paddingHorizontal: spacing.gutter, gap: 8, paddingBottom: 8 },
  radiusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  listArea: { flex: 1, justifyContent: 'flex-end', paddingBottom: 8 },
  emptyCard: {
    marginHorizontal: spacing.gutter,
    marginBottom: layout.bottomNavInset,
    padding: 20,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, marginBottom: 8 },
  emptyLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand600 },
})
