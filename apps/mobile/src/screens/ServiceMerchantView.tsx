import { useQuery } from '@tanstack/react-query'
import type { ApiMerchantDetail } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  Animated,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { ServiceBottomActionBar } from '@/src/components/ServiceBottomActionBar'
import { ServicePrestationsTab } from '@/src/components/ServicePrestationsTab'
import { LoadingState } from '@/src/components/ui'
import { useScrollRevealBar } from '@/src/hooks/useScrollRevealBar'
import { getApiClient } from '@/src/lib/api'
import { isValidProfileTab, type ProfileTabId } from '@/src/lib/merchantProfileTabs'
import { colors, fonts, layout } from '@/src/theme'

const HERO_HEIGHT = 340
const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

type ServiceTabId = 'prestations' | 'infos' | 'horaires'

const SERVICE_TABS: { id: ServiceTabId; label: string }[] = [
  { id: 'prestations', label: 'Prestations' },
  { id: 'infos', label: 'Informations' },
  { id: 'horaires', label: 'Horaires' },
]

function isCurrentlyOpen(merchant: ApiMerchantDetail): boolean {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const hour = now.getHours() * 100 + now.getMinutes()
  const todayHours = merchant.hours?.find(h => h.day === dayOfWeek)
  if (!todayHours || todayHours.is_closed) return false
  if (!todayHours.open_time || !todayHours.close_time) return true
  const [oh, om] = todayHours.open_time.split(':').map(Number)
  const [ch, cm] = todayHours.close_time.split(':').map(Number)
  return hour >= oh * 100 + om && hour < ch * 100 + cm
}

export function ServiceMerchantView({
  slug,
  initialTab,
}: {
  slug: string
  initialTab?: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const bookingAnchorRef = useRef<View>(null)
  const bookingY = useRef(0)
  const [preselectedServiceId, setPreselectedServiceId] = useState<string | null>(null)
  const { onScroll, animatedStyle, interactive } = useScrollRevealBar()

  const merchantQuery = useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => getApiClient().getMerchant(slug),
  })

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantQuery.data?.id],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantQuery.data!.id),
    enabled: !!merchantQuery.data,
  })

  const merchant = merchantQuery.data as ApiMerchantDetail | undefined
  const isPharmacy = merchant?.category.slug === 'pharmacies'

  const defaultTab: ServiceTabId = 'prestations'
  const [activeTab, setActiveTab] = useState<ServiceTabId>(() => {
    if (initialTab === 'prestations' || initialTab === 'infos' || initialTab === 'horaires') {
      return initialTab
    }
    if (isValidProfileTab(initialTab, SERVICE_TABS)) {
      return initialTab as ServiceTabId
    }
    return defaultTab
  })

  const prestationsLabel = useMemo(
    () => (isPharmacy ? 'Consultations' : 'Prestations'),
    [isPharmacy],
  )

  if (merchantQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!merchant) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Établissement introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>← Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  const isOpen = isCurrentlyOpen(merchant)
  const bookingCta = configQuery.data?.cta ?? 'Prendre RDV'
  const locationLabel = [
    merchant.location?.address,
    merchant.location?.district,
    merchant.location?.city,
  ].filter(Boolean).join(', ')
  const sortedHours = (merchant.hours ?? []).slice().sort((a, b) => a.day - b.day)

  const handleShare = async () => {
    try {
      await Share.share({ message: `${merchant.business_name} sur LaPlasse` })
    } catch { /* ignore */ }
  }

  const scrollToTop = () => {
    setActiveTab('prestations')
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  const scrollToBooking = (serviceId?: string) => {
    setActiveTab('prestations')
    if (serviceId) setPreselectedServiceId(serviceId)
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: bookingY.current || 800, animated: true })
    }, 80)
  }

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: layout.bottomNavInset + 100 }}
        >
          <View style={styles.hero}>
            {merchant.cover_image ? (
              <Image source={{ uri: merchant.cover_image }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroGradient} />

            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={() => router.back()} style={styles.heroActionBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable onPress={() => void handleShare()} style={styles.heroActionBtn}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                </Pressable>
                <View style={styles.heroActionBtn}>
                  <FavoriteButton merchantId={merchant.id} size={20} color="#fff" favoritedColor="#fca5a5" />
                </View>
              </View>
            </View>

            <View style={styles.heroInfo}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.badges}
              >
                <View style={styles.badgeCategory}>
                  <Text style={styles.badgeCategoryText}>{merchant.category.name}</Text>
                </View>
                {merchant.verification_status === 'VERIFIED' ? (
                  <View style={styles.badgeVerified}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                  </View>
                ) : null}
                <View style={[styles.badgeOpen, isOpen ? styles.badgeOpenYes : styles.badgeOpenNo]}>
                  <Ionicons name="time-outline" size={12} color="#fff" />
                  <Text style={styles.badgeOpenText}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
                </View>
                {merchant.avg_rating != null && merchant.review_count > 0 ? (
                  <View style={styles.badgeRating}>
                    <Ionicons name="star" size={12} color={colors.brand500} />
                    <Text style={styles.badgeRatingText}>
                      {merchant.avg_rating} ({merchant.review_count} avis)
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <Text style={styles.heroName}>{merchant.business_name}</Text>
              {locationLabel ? (
                <Text style={styles.heroLocation}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.85)" />
                  {'  '}{locationLabel}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.tabsBar} collapsable={false}>
            <View style={styles.tabsRow}>
              {SERVICE_TABS.map(tab => {
                const active = activeTab === tab.id
                const label = tab.id === 'prestations' ? prestationsLabel : tab.label
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={1}>
                      {label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.content}>
            {activeTab === 'prestations' ? (
              <ServicePrestationsTab
                merchantId={merchant.id}
                merchantSlug={merchant.slug}
                merchantName={merchant.business_name}
                categorySlug={merchant.category.slug}
                bookingAnchorRef={bookingAnchorRef}
                onBookingLayout={y => { bookingY.current = y + 400 }}
                preselectedServiceId={preselectedServiceId}
                onPreselectedConsumed={() => setPreselectedServiceId(null)}
                onScrollToBooking={scrollToBooking}
              />
            ) : null}

            {activeTab === 'infos' ? (
              <View style={styles.infoSection}>
                {merchant.description ? (
                  <Text style={styles.desc}>{merchant.description}</Text>
                ) : (
                  <Text style={styles.empty}>Aucune description disponible.</Text>
                )}
                {merchant.phone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${merchant.phone}`)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.brand700} />
                    <Text style={styles.contactText}>{merchant.phone}</Text>
                  </Pressable>
                ) : null}
                {merchant.website ? (
                  <Pressable
                    onPress={() => void Linking.openURL(merchant.website!)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="globe-outline" size={18} color={colors.brand700} />
                    <Text style={styles.contactText}>{merchant.website}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {activeTab === 'horaires' ? (
              <View style={styles.hoursSection}>
                {sortedHours.length > 0 ? (
                  sortedHours.map(h => {
                    const isToday = new Date().getDay() === h.day
                    return (
                      <View key={h.day} style={[styles.hourRow, isToday && styles.hourRowToday]}>
                        <Text style={[styles.hourDay, isToday && styles.hourDayToday]}>
                          {DAY_NAMES[h.day]}
                        </Text>
                        {h.is_closed ? (
                          <Text style={styles.hourClosed}>Fermé</Text>
                        ) : (
                          <Text style={styles.hourTime}>
                            {h.open_time ?? '--'} – {h.close_time ?? '--'}
                          </Text>
                        )}
                      </View>
                    )
                  })
                ) : (
                  <Text style={styles.empty}>Horaires non renseignés.</Text>
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <Animated.View
          style={[
            styles.actionBarWrap,
            animatedStyle,
            { pointerEvents: interactive ? 'auto' : 'none' },
          ]}
        >
          <ServiceBottomActionBar
            prestationsLabel={prestationsLabel}
            bookingCta={bookingCta}
            whatsapp={merchant.whatsapp}
            phone={merchant.phone}
            onPrestations={scrollToTop}
            onReserver={() => scrollToBooking()}
          />
        </Animated.View>
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  actionBarWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  hero: { height: HERO_HEIGHT, position: 'relative', backgroundColor: colors.slate900 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.slate900 },
  heroGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  heroActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  badgeCategory: {
    backgroundColor: colors.brand500,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeCategoryText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badgeVerified: {
    backgroundColor: '#3b82f6',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeOpenYes: { backgroundColor: '#22c55e' },
  badgeOpenNo: { backgroundColor: '#ef4444' },
  badgeOpenText: { fontFamily: fonts.semibold, fontSize: 11, color: '#fff' },
  badgeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeRatingText: { fontFamily: fonts.semibold, fontSize: 11, color: '#fff' },
  heroName: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
  },
  heroLocation: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  tabsBar: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsRow: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'stretch',
  },
  tab: {
    flex: 1,
    flexBasis: 0,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.slate900 },
  tabText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  tabTextActive: { fontFamily: fonts.bold, color: colors.slate900 },

  content: { padding: 16, gap: 16 },
  infoSection: { gap: 12 },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 24 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  contactText: { fontFamily: fonts.medium, fontSize: 14, color: colors.brand700 },
  hoursSection: { gap: 4 },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  hourRowToday: { backgroundColor: colors.brand50 },
  hourDay: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted },
  hourDayToday: { fontFamily: fonts.bold, color: colors.brand700 },
  hourTime: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  hourClosed: { fontFamily: fonts.medium, fontSize: 14, color: colors.textLight },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
})
