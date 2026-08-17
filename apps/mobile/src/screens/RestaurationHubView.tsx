import { useQuery } from '@tanstack/react-query'
import { getDefaultCity } from '@laplasse/shared-config'
import type { ApiMerchant, MenuSearchHit } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { sortByDistance } from '@laplasse/shared-config'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { HomeTopBar } from '@/src/components/HomeTopBar'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { RestaurationHubCard } from '@/src/components/RestaurationHubCard'
import { LoadingState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { useUserGeolocation } from '@/src/hooks/useUserGeolocation'
import { getApiClient } from '@/src/lib/api'
import {
  FOOD_HUB_CATEGORY_CHIPS,
  filterFoodMerchants,
  type FoodHubFilter,
} from '@/src/lib/foodHub'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

const FILTER_CHIPS: { id: FoodHubFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'fast', label: 'Moins de 30 min', icon: 'time-outline' },
  { id: 'top', label: 'Mieux notés', icon: 'star-outline' },
  { id: 'free_delivery', label: 'Offres spéciales', icon: 'gift-outline' },
]

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

function MenuSearchRow({ hit, onPress }: { hit: MenuSearchHit; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuHit, pressed && styles.pressed]}>
      {hit.image_url ? (
        <AppImage uri={hit.image_url} style={styles.menuHitImage} />
      ) : (
        <View style={[styles.menuHitImage, styles.menuHitImageFallback]} />
      )}
      <View style={styles.menuHitBody}>
        <Text style={styles.menuHitName} numberOfLines={1}>{hit.name}</Text>
        <Text style={styles.menuHitMerchant} numberOfLines={1}>{hit.merchant.business_name}</Text>
        {hit.prep_minutes != null ? (
          <Text style={styles.menuHitPrep}>~{hit.prep_minutes} min</Text>
        ) : null}
      </View>
      <Text style={styles.menuHitPrice}>{formatPrice(hit.price, hit.currency)}</Text>
    </Pressable>
  )
}

export function RestaurationHubView({
  initialCategory = '',
  initialQuery = '',
}: {
  initialCategory?: string
  initialQuery?: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [menuQuery, setMenuQuery] = useState(initialQuery)
  const [category, setCategory] = useState(initialCategory)
  const [filter, setFilter] = useState<FoodHubFilter>('all')
  const { userLocation, geoStatus, requestGeolocation } = useUserGeolocation()

  const debouncedMenuQuery = useDebouncedValue(menuQuery, 350)

  const merchantsQuery = useQuery({
    queryKey: ['restauration-merchants', city, countryCode],
    queryFn: () =>
      getApiClient().listMerchants({
        vertical: 'food',
        city,
        country: countryCode,
        limit: 50,
        sort: 'trust_score',
      }),
    staleTime: 60_000,
  })

  const menuSearchQuery = useQuery({
    queryKey: ['restauration-menu-search', debouncedMenuQuery, countryCode],
    queryFn: () => getApiClient().searchMenus(debouncedMenuQuery, 12),
    enabled: debouncedMenuQuery.trim().length >= 2,
  })

  const merchants = merchantsQuery.data?.data ?? []
  const filtered = useMemo(
    () => filterFoodMerchants(merchants, { category: category || undefined, filter }),
    [merchants, category, filter],
  )

  const sortedFiltered = useMemo(() => {
    if (!userLocation) return filtered
    return sortByDistance(filtered, userLocation.lat, userLocation.lng, m => ({
      latitude: m.location?.latitude,
      longitude: m.location?.longitude,
    }))
  }, [filtered, userLocation])

  const promos = useMemo(() => {
    const withPromo = merchants.filter(m => m.has_active_promo && m.cover_image)
    if (withPromo.length >= 2) return withPromo.slice(0, 6)
    const sponsored = merchants.filter(m => m.is_sponsored && m.cover_image && !m.has_active_promo)
    return [...withPromo, ...sponsored].slice(0, 6)
  }, [merchants])

  const showPromos = promos.length > 0 && !menuQuery.trim() && filter === 'all' && !category
  const scrollTopPad = insets.top + homeLayout.topBarHeight + 8
  const bottomPad = layout.bottomNavHeight + insets.bottom + 24

  return (
    <PublicScreenShell>
      <View style={styles.root}>
        <HomeTopBar
          onOpenMenu={() => setDrawerOpen(true)}
          isAuthenticated={isAuthenticated}
          avatarLabel={greetingName(user?.full_name, user?.email)}
        />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {merchantsQuery.isPending ? (
          <View style={{ paddingTop: scrollTopPad, flex: 1 }}>
            <LoadingState />
          </View>
        ) : merchantsQuery.isError ? (
          <View style={[styles.errorWrap, { paddingTop: scrollTopPad }]}>
            <Text style={styles.errorTitle}>Impossible de charger les restaurants</Text>
            <Text style={styles.errorText}>Vérifiez votre connexion puis réessayez.</Text>
            <Pressable onPress={() => void merchantsQuery.refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: scrollTopPad, paddingBottom: bottomPad }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.hero}>
              <Text style={styles.title}>Restauration</Text>
              <Text style={styles.subtitle}>
                Restaurants, plats et commandes en livraison
              </Text>
              <View style={styles.searchField}>
                <Ionicons name="search-outline" size={20} color={colors.textMuted} />
                <TextInput
                  value={menuQuery}
                  onChangeText={setMenuQuery}
                  placeholder="Rechercher un plat, un menu…"
                  placeholderTextColor={colors.textLight}
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {menuQuery.length > 0 ? (
                  <Pressable onPress={() => setMenuQuery('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <HorizontalCarousel
              data={[{ slug: '', label: 'Tout', icon: 'options-outline' as const }, ...FOOD_HUB_CATEGORY_CHIPS]}
              keyExtractor={item => item.slug || 'all'}
              renderItem={item => {
                const active = category === item.slug
                const iconName = 'icon' in item ? item.icon : 'restaurant-outline'
                return (
                  <Pressable
                    onPress={() => setCategory(active && item.slug ? '' : item.slug)}
                    style={styles.catItem}
                  >
                    <View style={[styles.catCircle, active && styles.catCircleActive]}>
                      <Ionicons
                        name={iconName}
                        size={26}
                        color={active ? '#fff' : colors.brand700}
                      />
                    </View>
                    <Text style={[styles.catLabel, active && styles.catLabelActive]} numberOfLines={2}>
                      {item.label}
                    </Text>
                  </Pressable>
                )
              }}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTER_CHIPS.map(chip => {
                const active = filter === chip.id
                return (
                  <Pressable
                    key={chip.id}
                    onPress={() => setFilter(active ? 'all' : chip.id)}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                  >
                    <Ionicons name={chip.icon} size={16} color={active ? '#fff' : colors.text} />
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            {debouncedMenuQuery.trim().length >= 2 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Plats correspondants</Text>
                {menuSearchQuery.isLoading ? (
                  <ActivityIndicator color={colors.brand600} style={{ marginVertical: 24 }} />
                ) : (menuSearchQuery.data?.data.length ?? 0) === 0 ? (
                  <Text style={styles.emptyMenu}>Aucun plat trouvé pour « {debouncedMenuQuery} ».</Text>
                ) : (
                  <View style={styles.menuHitList}>
                    {menuSearchQuery.data!.data.map(hit => (
                      <MenuSearchRow
                        key={hit.id}
                        hit={hit}
                        onPress={() => router.push({ pathname: '/restauration/[slug]', params: { slug: hit.merchant.slug, item: hit.id } } as never)}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {showPromos ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Offres spéciales</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promoRow}>
                  {promos.slice(0, 4).map(m => (
                    <PromoCard key={m.id} merchant={m} onPress={() => router.push({ pathname: '/restauration/[slug]', params: { slug: m.slug } } as never)} />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {!menuQuery.trim() ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {category
                    ? FOOD_HUB_CATEGORY_CHIPS.find(c => c.slug === category)?.label ?? 'Restaurants'
                    : 'Restaurants à proximité'}
                </Text>
                {geoStatus === 'granted' && userLocation ? (
                  <Text style={styles.geoHint}>Établissements triés selon votre position</Text>
                ) : null}
                {(geoStatus === 'denied' || geoStatus === 'unsupported') ? (
                  <Pressable onPress={() => void requestGeolocation()}>
                    <Text style={styles.geoLink}>Activer la localisation pour voir les restaurants proches</Text>
                  </Pressable>
                ) : null}
                {sortedFiltered.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyBoxText}>Aucun restaurant trouvé.</Text>
                    <Pressable
                      onPress={() => {
                        setMenuQuery('')
                        setCategory('')
                        setFilter('all')
                      }}
                    >
                      <Text style={styles.resetLink}>Réinitialiser les filtres</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.restaurantList}>
                    {sortedFiltered.map(m => (
                      <RestaurationHubCard
                        key={m.id}
                        merchant={m}
                        onPress={() => router.push({ pathname: '/restauration/[slug]', params: { slug: m.slug } } as never)}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : null}
          </ScrollView>
        )}
      </View>
    </PublicScreenShell>
  )
}

function PromoCard({ merchant, onPress }: { merchant: ApiMerchant; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.promoCard, pressed && styles.pressed]}>
      {merchant.cover_image ? (
        <AppImage uri={merchant.cover_image} style={styles.promoImage} fallbackLetter={merchant.business_name.slice(0, 1)} />
      ) : (
        <View style={[styles.promoImage, styles.menuHitImageFallback]} />
      )}
      <View style={styles.promoOverlay} />
      <View style={styles.promoContent}>
        {merchant.has_active_promo ? (
          <Text style={styles.promoBadge}>Offre en cours</Text>
        ) : merchant.is_sponsored ? (
          <Text style={[styles.promoBadge, styles.promoBadgeSponsored]}>Sponsorisé</Text>
        ) : null}
        <Text style={styles.promoName} numberOfLines={2}>{merchant.business_name}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: homeLayout.gutter, gap: 24 },
  hero: { gap: 8 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    marginBottom: 8,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 10,
  },
  catItem: { width: 80, alignItems: 'center', gap: 8 },
  catCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catCircleActive: {
    backgroundColor: colors.brand500,
    borderColor: colors.brand500,
  },
  catLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  catLabelActive: { color: colors.brand800 },
  filterRow: { gap: 8, paddingVertical: 4 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.brand500,
    borderColor: colors.brand500,
  },
  filterChipText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  filterChipTextActive: { color: '#fff' },
  section: { gap: 12 },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  menuHitList: { gap: 8 },
  menuHit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.brand100,
    padding: 12,
  },
  pressed: { opacity: 0.95 },
  menuHitImage: { width: 56, height: 56, borderRadius: 12 },
  menuHitImageFallback: { backgroundColor: colors.brand50 },
  menuHitBody: { flex: 1, minWidth: 0 },
  menuHitName: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  menuHitMerchant: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuHitPrep: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.brand700,
    marginTop: 2,
  },
  menuHitPrice: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand700,
  },
  emptyMenu: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    paddingVertical: 16,
  },
  promoRow: { gap: 12 },
  promoCard: {
    width: 280,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  promoImage: { width: '100%', height: '100%' },
  promoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.55)',
  },
  promoContent: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
  },
  promoBadge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    marginBottom: 6,
    overflow: 'hidden',
  },
  promoBadgeSponsored: { backgroundColor: colors.brand600 },
  promoName: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: '#fff',
  },
  restaurantList: { gap: 20 },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  emptyBoxText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  resetLink: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand700,
    marginTop: 12,
  },
  geoHint: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.emerald700,
    marginBottom: 8,
  },
  geoLink: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.brand600,
    marginBottom: 8,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: homeLayout.gutter,
    gap: 8,
  },
  errorTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.brand600,
  },
  retryText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
})
