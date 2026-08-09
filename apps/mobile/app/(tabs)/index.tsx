import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppHeader } from '@/src/components/AppHeader'
import { CategoryCarousel } from '@/src/components/CategoryCarousel'
import { CompactProductCard } from '@/src/components/CompactProductCard'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { NearbyCard } from '@/src/components/NearbyCard'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { SectionHeader } from '@/src/components/SectionHeader'
import { ShopCard } from '@/src/components/ShopCard'
import { LoadingState } from '@/src/components/ui'
import { useHomeData } from '@/src/hooks/useHomeData'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, spacing } from '@/src/theme'

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

export default function HomeScreen() {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode)
  const user = useAuthStore(s => s.user)
  const { data, isLoading } = useHomeData(countryCode)

  if (isLoading || !data) return <LoadingState />

  const firstName = greetingName(user?.full_name, user?.email)

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroBlob} />
          <Text style={styles.greeting}>Bonjour, {firstName}</Text>
          <Text style={styles.subGreeting}>
            Prêt à découvrir de nouvelles pépites à {data.city} ?
          </Text>
          <SearchAutocomplete />
        </View>

        {data.categories.length > 0 ? (
          <View style={styles.section}>
            <CategoryCarousel categories={data.categories} />
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionPad}>
            <SectionHeader title="Établissements à la une" href="/(tabs)/search" />
          </View>
          {data.merchants.length > 0 ? (
            <HorizontalCarousel
              data={data.merchants}
              keyExtractor={m => m.id}
              itemWidth={280}
              renderItem={m => (
                <NearbyCard merchant={m} onPress={() => router.push(`/m/${m.slug}`)} />
              )}
            />
          ) : (
            <Text style={styles.empty}>Aucun établissement disponible pour le moment.</Text>
          )}
        </View>

        {data.products.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionPad}>
              <SectionHeader title="Nouveautés Marketplace" href="/(tabs)/marketplace" />
            </View>
            <HorizontalCarousel
              data={data.products}
              keyExtractor={p => p.id}
              itemWidth={168}
              renderItem={p => (
                <CompactProductCard
                  product={p}
                  width={168}
                  onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
                />
              )}
            />
          </View>
        ) : null}

        {data.shops.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionPad}>
              <SectionHeader title="Boutiques à découvrir" href="/(tabs)/marketplace" />
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
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: {
    paddingHorizontal: spacing.gutter,
    paddingTop: 8,
    paddingBottom: 24,
    position: 'relative',
  },
  heroBlob: {
    position: 'absolute',
    top: -24,
    right: -32,
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: colors.brand100,
    opacity: 0.6,
  },
  greeting: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 16,
  },
  section: { marginBottom: 28 },
  sectionPad: { paddingHorizontal: spacing.gutter },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: spacing.gutter,
  },
})
