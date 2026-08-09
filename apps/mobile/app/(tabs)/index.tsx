import { useQuery } from '@tanstack/react-query'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { getDefaultCity } from '@laplasse/shared-config'
import { MerchantCard } from '@/src/components/MerchantCard'
import { EmptyState, LoadingState, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors } from '@/src/theme'

export default function HomeScreen() {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const city = getDefaultCity(countryCode)

  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({})
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    })()
  }, [])

  const nearbyQuery = useQuery({
    queryKey: ['nearby', coords, countryCode],
    queryFn: () =>
      coords
        ? getApiClient().getNearbyMerchants({ ...coords, country: countryCode })
        : getApiClient().getFeaturedMerchants(city, 20, countryCode),
    enabled: true,
  })

  const featuredQuery = useQuery({
    queryKey: ['featured', city, countryCode],
    queryFn: () => getApiClient().getFeaturedMerchants(city, 6, countryCode),
  })

  if (nearbyQuery.isLoading) return <LoadingState />

  const merchants = nearbyQuery.data ?? []

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Title>LaPlasse</Title>
        <Subtitle>Découvrez les commerçants près de vous · {city}</Subtitle>
        <PrimaryButton label="Voir le panier" onPress={() => router.push('/cart')} />
      </View>

      {featuredQuery.data && featuredQuery.data.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À la une</Text>
          {featuredQuery.data.slice(0, 3).map(m => (
            <MerchantCard
              key={m.id}
              merchant={m}
              onPress={() => router.push(`/m/${m.slug}`)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {coords ? 'À proximité' : 'Commerçants'}
        </Text>
        {merchants.length === 0 ? (
          <EmptyState title="Aucun commerçant trouvé" subtitle="Essayez une autre zone ou lancez une recherche." />
        ) : (
          <FlatList
            data={merchants}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MerchantCard merchant={item} onPress={() => router.push(`/m/${item.slug}`)} />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
  list: { paddingBottom: 24 },
})
