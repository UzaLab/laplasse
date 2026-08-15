import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { RoomBookingWidget } from '@/src/components/RoomBookingWidget'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { goBackOrReplace } from '@/src/lib/navigation'
import {
  amenityIconName,
  amenityLabel,
  getRoomBedLabel,
  getRoomMaxGuests,
  highlightLabel,
  propertyTypeLabel,
} from '@/src/lib/roomListing'
import { colors, fonts, homeLayout, layout, spacing } from '@/src/theme'

const HOTEL_HERO_HEIGHT = 350

export function RoomDetailView({
  merchantSlug,
  roomSlug,
}: {
  merchantSlug: string
  roomSlug: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)

  const roomQuery = useQuery({
    queryKey: ['public-room', merchantSlug, roomSlug],
    queryFn: () => getApiClient().getPublicRoom(merchantSlug, roomSlug),
    enabled: !!merchantSlug && !!roomSlug,
  })

  const data = roomQuery.data
  const room = data?.room
  const merchant = data?.merchant

  const images = room?.image_urls ?? []
  const heroImage = images[0] ?? merchant?.cover_image ?? null

  const amenities = useMemo(
    () => (room?.amenities ?? []).map(value => ({
      value,
      label: amenityLabel(value),
      icon: amenityIconName(value),
    })),
    [room?.amenities],
  )

  const highlights = useMemo(
    () => (room?.highlights ?? []).map(highlightLabel),
    [room?.highlights],
  )

  const maxGuests = room ? getRoomMaxGuests(room) : null
  const bedLabel = room ? getRoomBedLabel(room) : null
  const typeBadge = room
    ? propertyTypeLabel(room.property_type) || ''
    : ''

  const locationLine = merchant?.location
    ? [merchant.location.address, merchant.location.district, merchant.location.city].filter(Boolean).join(', ')
    : null

  const hotelHref = `/m/${merchantSlug}?tab=chambres`

  const handleBack = () => {
    goBackOrReplace(router, hotelHref)
  }

  const handleShare = async () => {
    if (!room || !merchant) return
    try {
      await Share.share({
        message: `${room.name} — ${merchant.business_name} sur LaPlasse`,
      })
    } catch { /* ignore */ }
  }

  if (roomQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!room || !merchant) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Chambre introuvable</Text>
          <Pressable onPress={handleBack}>
            <Text style={styles.backLink}>← Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.screen}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={{ paddingBottom: layout.bottomNavInset + 100 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {heroImage ? (
              <AppImage uri={heroImage} style={styles.cover} contentFit="cover" />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroGradient} />

            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={handleBack} style={styles.backPill}>
                <Ionicons name="arrow-back" size={16} color="#fff" />
                <Text style={styles.backText}>Retour</Text>
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
              <View style={styles.heroBadges}>
                <Pressable
                  onPress={() => router.push(hotelHref as never)}
                  style={styles.backHotelPill}
                >
                  <Ionicons name="chevron-back" size={12} color="#fff" />
                  <Text style={styles.backHotelText}>Retour à l&apos;hôtel</Text>
                </Pressable>
                {typeBadge ? (
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{typeBadge.toUpperCase()}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.heroTitle}>{room.name}</Text>
              <Text style={styles.heroMerchantLine}>
                <Ionicons name="business-outline" size={16} color={colors.brand500} />
                {'  '}{merchant.business_name}
              </Text>
              {locationLine ? (
                <Text style={styles.heroLocation}>
                  <Ionicons name="location" size={16} color={colors.brand500} />
                  {'  '}{locationLine}
                </Text>
              ) : null}
            </View>
          </View>

        <View style={styles.body}>
          {(room.surface_sqm || maxGuests || bedLabel) ? (
            <View style={styles.statsRow}>
              {room.surface_sqm != null && room.surface_sqm > 0 ? (
                <>
                  <View style={styles.statCol}>
                    <Text style={styles.statValue}>{room.surface_sqm} m²</Text>
                    <Text style={styles.statLabel}>Superficie</Text>
                  </View>
                  {(maxGuests || bedLabel) ? <View style={styles.statDivider} /> : null}
                </>
              ) : null}
              {maxGuests != null ? (
                <>
                  <View style={styles.statCol}>
                    <View style={styles.statValueRow}>
                      <Text style={styles.statValue}>{maxGuests}</Text>
                      <Ionicons name="people-outline" size={20} color={colors.textMuted} />
                    </View>
                    <Text style={styles.statLabel}>Voyageurs max.</Text>
                  </View>
                  {bedLabel ? <View style={styles.statDivider} /> : null}
                </>
              ) : null}
              {bedLabel ? (
                <View style={styles.statCol}>
                  <View style={styles.statValueRow}>
                    <Text style={styles.statValue}>{room.beds ?? 1}</Text>
                    <Ionicons name="bed-outline" size={20} color={colors.textMuted} />
                  </View>
                  <Text style={styles.statLabel}>{bedLabel}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {room.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>À propos de cette chambre</Text>
              <Text style={styles.sectionBody}>{room.description}</Text>
            </View>
          ) : null}

          {amenities.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Équipements de la chambre</Text>
              <View style={styles.amenitiesGrid}>
                {amenities.map(item => (
                  <View key={item.value} style={styles.amenityRow}>
                    <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.brand500} />
                    <Text style={styles.amenityText}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {highlights.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Points forts</Text>
              <View style={styles.highlightRow}>
                {highlights.map(label => (
                  <View key={label} style={styles.highlightPill}>
                    <Text style={styles.highlightText}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {images.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionSubtitle}>Galerie</Text>
              <View style={styles.galleryGrid}>
                {images.slice(0, 3).map((src, i) => (
                  <Pressable
                    key={src}
                    onPress={() => {
                      setGalleryIndex(i)
                      setGalleryOpen(true)
                    }}
                    style={styles.galleryCell}
                  >
                    <AppImage uri={src} style={styles.galleryImage} contentFit="cover" />
                    {i === 2 && images.length > 3 ? (
                      <View style={styles.galleryOverlay}>
                        <Text style={styles.galleryOverlayText}>+{images.length - 3} Photos</Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}

          {(data.booking_settings?.cancellation_policy || data.booking_settings?.no_show_policy) ? (
            <View style={styles.rulesCard}>
              <Text style={styles.sectionSubtitle}>Règles de l&apos;établissement</Text>
              <View style={styles.ruleRow}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={styles.ruleText}><Text style={styles.ruleBold}>Arrivée :</Text> À partir de 14:00</Text>
              </View>
              <View style={styles.ruleRow}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={styles.ruleText}><Text style={styles.ruleBold}>Départ :</Text> Jusqu&apos;à 12:00</Text>
              </View>
              {data.booking_settings?.cancellation_policy ? (
                <View style={styles.ruleRow}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>Annulation :</Text> {data.booking_settings.cancellation_policy}
                  </Text>
                </View>
              ) : null}
              {data.booking_settings?.no_show_policy ? (
                <View style={styles.ruleRow}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.textMuted} />
                  <Text style={styles.ruleText}>
                    <Text style={styles.ruleBold}>No-show :</Text> {data.booking_settings.no_show_policy}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          <RoomBookingWidget
            merchantId={merchant.id}
            merchantName={merchant.business_name}
            merchantSlug={merchant.slug}
            room={room}
            bookingSettings={data.booking_settings}
            bookingEnabled={data.booking_enabled ?? true}
          />
        </View>
      </ScrollView>

      <Modal visible={galleryOpen} animationType="fade" onRequestClose={() => setGalleryOpen(false)}>
        <View style={styles.galleryModal}>
          <Pressable
            onPress={() => setGalleryOpen(false)}
            style={[styles.galleryClose, { top: insets.top + 12 }]}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </Pressable>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: galleryIndex * Dimensions.get('window').width, y: 0 }}
          >
            {images.map(uri => (
              <View key={uri} style={styles.gallerySlide}>
                <AppImage uri={uri} style={styles.galleryFull} contentFit="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  root: { flex: 1, backgroundColor: '#FAFAFA' },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  hero: { height: HOTEL_HERO_HEIGHT, position: 'relative', backgroundColor: colors.slate900 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.slate900 },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
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
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backText: { fontFamily: fonts.medium, fontSize: 14, color: '#fff' },
  heroActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  backHotelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(30,41,59,0.85)',
    borderWidth: 1,
    borderColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  backHotelText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  typePill: {
    backgroundColor: colors.brand500,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  typePillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    lineHeight: 34,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroMerchantLine: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
    marginBottom: 2,
  },
  heroLocation: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  body: {
    paddingHorizontal: spacing.gutter,
    paddingTop: 28,
    gap: 28,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  statCol: { gap: 4 },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statValue: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.slate900 },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: { width: 1, height: 40, backgroundColor: colors.borderStrong },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.slate900 },
  sectionSubtitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.slate900 },
  sectionBody: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 26,
    color: colors.textMuted,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  amenityRow: {
    width: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amenityText: { fontFamily: fonts.medium, fontSize: 14, color: '#334155', flex: 1 },
  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlightPill: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  highlightText: { fontFamily: fonts.semibold, fontSize: 13, color: '#065f46' },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  galleryCell: {
    width: (Dimensions.get('window').width - spacing.gutter * 2 - 24) / 3,
    height: 120,
    borderRadius: homeLayout.radiusLg,
    overflow: 'hidden',
  },
  galleryImage: { width: '100%', height: '100%' },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryOverlayText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  rulesCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 24,
    padding: 20,
    gap: 12,
  },
  ruleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  ruleText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textMuted },
  ruleBold: { fontFamily: fonts.bold, color: colors.text },
  galleryModal: { flex: 1, backgroundColor: '#000' },
  galleryClose: {
    position: 'absolute',
    right: spacing.gutter,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gallerySlide: {
    width: Dimensions.get('window').width,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryFull: { width: '100%', height: '80%' },
})
