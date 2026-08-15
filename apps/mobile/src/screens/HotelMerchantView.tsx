import { useQuery } from '@tanstack/react-query'
import type { ApiMerchant, ApiMerchantDetail } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  Linking,
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
import { LeaveReviewButton } from '@/src/components/LeaveReviewButton'
import { HotelBottomActionBar } from '@/src/components/HotelBottomActionBar'
import { HotelChambresTab } from '@/src/components/HotelChambresTab'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  getDefaultProfileTab,
  getProfileTabs,
  isValidProfileTab,
  type ProfileTabId,
} from '@/src/lib/merchantProfileTabs'
import { colors, fonts, layout } from '@/src/theme'
import { businessDayFromDate } from '@laplasse/shared-config'
import { isOpenFromMerchantHours } from '@/src/lib/foodHub'

/** BusinessHour.day in DB: 0 = lundi … 6 = dimanche */
const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOTEL_AMBER = '#fea619'

function isCurrentlyOpen(merchant: ApiMerchantDetail): boolean {
  if (!merchant.hours?.length) return true
  return isOpenFromMerchantHours(merchant.hours)
}

function trustLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Très fiable'
  if (score >= 60) return 'Fiable'
  return 'En cours'
}

function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function SimilarCard({ merchant, onPress }: { merchant: ApiMerchant; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.similarCard}>
      {merchant.cover_image ? (
        <AppImage uri={merchant.cover_image} style={styles.similarCover} fallbackLetter={merchant.business_name.slice(0, 1)} />
      ) : (
        <View style={[styles.similarCover, styles.similarCoverFallback]} />
      )}
      <View style={styles.similarBody}>
        <View style={styles.similarInfo}>
          <Text style={styles.similarName} numberOfLines={2}>{merchant.business_name}</Text>
          {merchant.location ? (
            <Text style={styles.similarLocation}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              {' '}{merchant.location.district ?? merchant.location.city}
            </Text>
          ) : null}
        </View>
        <Ionicons name="heart-outline" size={20} color={colors.textLight} />
      </View>
    </Pressable>
  )
}

export function HotelMerchantView({
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

  const merchantQuery = useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => getApiClient().getMerchant(slug),
  })

  const similarQuery = useQuery({
    queryKey: ['merchant-similar', slug],
    queryFn: () => getApiClient().getMerchantSimilar(slug, 4),
    enabled: !!merchantQuery.data,
  })

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantQuery.data?.id],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantQuery.data!.id),
    enabled: !!merchantQuery.data,
  })

  const merchant = merchantQuery.data as ApiMerchantDetail | undefined
  const tabs = useMemo(
    () => (merchant ? getProfileTabs(merchant.category.slug) : []),
    [merchant],
  )

  const defaultTab = merchant
    ? getDefaultProfileTab(merchant.category.slug)
    : 'chambres'

  const [activeTab, setActiveTab] = useState<ProfileTabId>(() =>
    isValidProfileTab(initialTab, tabs) ? initialTab : defaultTab,
  )

  const [visibleReviews, setVisibleReviews] = useState(3)

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
  const similar = similarQuery.data ?? []
  const reviews = merchant.reviews ?? []
  const bookingCta = configQuery.data?.cta ?? 'Réserver'
  const locationLabel = [
    merchant.location?.address,
    merchant.location?.district,
    merchant.location?.city,
  ].filter(Boolean).join(', ')

  const handleShare = async () => {
    try {
      await Share.share({ message: `${merchant.business_name} sur LaPlasse` })
    } catch { /* ignore */ }
  }

  const scrollToChambres = () => {
    setActiveTab('chambres')
    scrollRef.current?.scrollTo({ y: 350, animated: true })
  }

  const scrollToBooking = () => {
    setActiveTab('chambres')
    scrollRef.current?.scrollTo({ y: bookingY.current || 900, animated: true })
  }

  const sortedHours = (merchant.hours ?? []).slice().sort((a, b) => a.day - b.day)

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          contentContainerStyle={{ paddingBottom: layout.bottomNavInset + 100 }}
        >
          {/* ─── Hero ─── */}
          <View style={styles.hero}>
            {merchant.cover_image ? (
              <AppImage uri={merchant.cover_image} style={styles.cover} fallbackLetter={merchant.business_name.slice(0, 1)} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroGradient} />

            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={() => router.back()} style={styles.backPill}>
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
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
                  <Ionicons name="location" size={16} color={colors.brand500} />
                  {'  '}{locationLabel}
                </Text>
              ) : null}
            </View>
          </View>

          {/* ─── Sticky tabs ─── */}
          <View style={styles.tabsBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsTrack}>
              {tabs.map(tab => {
                const active = activeTab === tab.id
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setActiveTab(tab.id)}
                    style={[styles.tab, active && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          </View>

          {/* ─── Tab content ─── */}
          <View style={styles.content}>
            {activeTab === 'chambres' ? (
              <HotelChambresTab
                merchantId={merchant.id}
                merchantSlug={merchant.slug}
                merchantName={merchant.business_name}
                categorySlug={merchant.category.slug}
                bookingAnchorRef={bookingAnchorRef}
                onBookingLayout={y => { bookingY.current = y + 500 }}
              />
            ) : null}

            {activeTab === 'infos' ? (
              <View style={styles.infoSection}>
                {merchant.description ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>À propos</Text>
                    <Text style={styles.desc}>{merchant.description}</Text>
                  </View>
                ) : (
                  <Text style={styles.empty}>Aucune description disponible.</Text>
                )}

                {locationLabel ? (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoBlockTitleRow}>
                      <Ionicons name="location-outline" size={18} color={colors.brand500} />
                      <Text style={styles.infoBlockTitle}>Adresse</Text>
                    </View>
                    <Text style={styles.addressText}>{locationLabel}</Text>
                  </View>
                ) : null}

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
                    const isToday = businessDayFromDate() === h.day
                    return (
                      <View key={h.day} style={[styles.hourRow, isToday && styles.hourRowToday]}>
                        <View style={styles.hourDay}>
                          {isToday ? (
                            <Ionicons name="time-outline" size={14} color={colors.brand500} />
                          ) : null}
                          <Text style={[styles.hourDayText, isToday && styles.hourDayToday]}>
                            {DAY_NAMES[h.day]}
                          </Text>
                        </View>
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

            {activeTab === 'galerie' ? (
              <View style={styles.gallerySection}>
                {merchant.media.length > 0 ? (
                  <View style={styles.galleryGrid}>
                    {merchant.media.map(item => (
                      <Image key={item.id} source={{ uri: item.url }} style={styles.galleryImage} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.galleryEmpty}>
                    <Ionicons name="images-outline" size={40} color={colors.borderStrong} />
                    <Text style={styles.galleryEmptyTitle}>Aucune photo pour le moment</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* ─── Trust index ─── */}
            <View style={styles.trustSection}>
              <Text style={styles.trustSectionLabel}>INDICE DE CONFIANCE</Text>
              <View style={styles.trustRow}>
                <View style={[
                  styles.trustCircle,
                  { borderColor: merchant.trust_score >= 80 ? '#10b981' : colors.brand500 },
                ]}>
                  <Text style={styles.trustScore}>{merchant.trust_score}</Text>
                </View>
                <View style={styles.trustInfo}>
                  <Text style={[
                    styles.trustLabel,
                    merchant.trust_score >= 80 ? styles.trustLabelGood : styles.trustLabelMid,
                  ]}>
                    {trustLabel(merchant.trust_score)}
                  </Text>
                  <Text style={styles.trustMeta}>
                    {merchant.review_count} avis ·{' '}
                    {merchant.verification_status === 'VERIFIED' ? '✓ Vérifié' : 'Non vérifié'}
                  </Text>
                </View>
              </View>
              <View style={styles.trustActions}>
                <Pressable onPress={() => void handleShare()} style={styles.trustActionBtn}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                  <Text style={styles.trustActionText}>Partager</Text>
                </Pressable>
                <Pressable style={styles.trustActionBtn}>
                  <FavoriteButton merchantId={merchant.id} size={18} />
                  <Text style={styles.trustActionText}>Sauvegarder</Text>
                </Pressable>
              </View>
            </View>

            {/* ─── Reviews ─── */}
            <View style={styles.reviewCta}>
              <LeaveReviewButton merchantId={merchant.id} merchantName={merchant.business_name} />
            </View>

            {reviews.length > 0 ? (
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.reviewsTitle}>
                    <Ionicons name="star-outline" size={18} color={colors.brand500} />
                    {'  '}Avis clients
                  </Text>
                  {merchant.avg_rating != null ? (
                    <View style={styles.reviewsBadge}>
                      <Text style={styles.reviewsBadgeText}>{merchant.avg_rating}/5</Text>
                    </View>
                  ) : null}
                  <Text style={styles.reviewsCount}>({merchant.review_count} avis)</Text>
                </View>

                {reviews.slice(0, visibleReviews).map(review => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <View style={styles.reviewAuthorRow}>
                        <View style={styles.reviewAvatar}>
                          <Text style={styles.reviewAvatarText}>
                            {(review.user.full_name ?? 'U').slice(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.reviewAuthor}>
                            {review.user.full_name ?? 'Client'}
                          </Text>
                          <Text style={styles.reviewDate}>{formatReviewDate(review.created_at)}</Text>
                        </View>
                      </View>
                      <View style={styles.reviewStars}>
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Ionicons key={i} name="star" size={12} color={colors.brand500} />
                        ))}
                      </View>
                    </View>
                    {review.title ? (
                      <Text style={styles.reviewTitle}>{review.title}</Text>
                    ) : null}
                    {review.content ? (
                      <Text style={styles.reviewContent}>{review.content}</Text>
                    ) : null}
                  </View>
                ))}

                {visibleReviews < reviews.length ? (
                  <Pressable
                    onPress={() => setVisibleReviews(v => v + 4)}
                    style={styles.loadMoreReviews}
                  >
                    <Text style={styles.loadMoreReviewsText}>
                      Charger d&apos;autres avis ({visibleReviews}/{reviews.length})
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}

            {/* ─── Similar ─── */}
            {similar.length > 0 ? (
              <View style={styles.similarSection}>
                <Text style={styles.similarTitle}>Vous aimerez aussi</Text>
                {similar.map(item => (
                  <SimilarCard
                    key={item.id}
                    merchant={item}
                    onPress={() => router.push(`/m/${item.slug}`)}
                  />
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <HotelBottomActionBar
          categorySlug={merchant.category.slug}
          bookingCta={bookingCta}
          whatsapp={merchant.whatsapp}
          phone={merchant.phone}
          onChambres={scrollToChambres}
          onReserver={scrollToBooking}
        />
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  hero: { height: 350, position: 'relative', backgroundColor: colors.slate900 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.slate900 },
  heroGradient: {
    ...StyleSheet.absoluteFill,
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
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badgeCategory: {
    backgroundColor: colors.brand500,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCategoryText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeVerified: {
    backgroundColor: 'rgba(59,130,246,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeOpenYes: { backgroundColor: 'rgba(16,185,129,0.9)' },
  badgeOpenNo: { backgroundColor: 'rgba(239,68,68,0.8)' },
  badgeOpenText: { fontFamily: fonts.bold, fontSize: 10, color: '#fff' },
  badgeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeRatingText: { fontFamily: fonts.bold, fontSize: 10, color: '#fff' },
  heroName: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroLocation: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },

  tabsBar: {
    backgroundColor: 'rgba(249,249,249,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  tabsTrack: { paddingHorizontal: 20, gap: 32 },
  tab: {
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: HOTEL_AMBER },
  tabText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted },
  tabTextActive: { fontFamily: fonts.semibold, color: colors.text },

  content: { paddingHorizontal: 20, paddingVertical: 40, gap: 40 },
  infoSection: { gap: 32 },
  infoBlock: { gap: 12 },
  infoBlockTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBlockTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 24 },
  addressText: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  contactText: { fontFamily: fonts.medium, fontSize: 14, color: colors.brand700 },
  hoursSection: { gap: 8 },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceBright,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hourRowToday: {
    backgroundColor: colors.brand50,
    borderColor: colors.brand200,
  },
  hourDay: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hourDayText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  hourDayToday: { fontFamily: fonts.bold, color: colors.brand700 },
  hourClosed: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger },
  hourTime: { fontFamily: fonts.regular, fontSize: 14, color: colors.text },
  gallerySection: { gap: 12 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  galleryImage: { width: '47%', height: 160, borderRadius: 16 },
  galleryEmpty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: colors.surfaceBright,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  galleryEmptyTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },

  trustSection: { gap: 16, marginTop: 8 },
  trustSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.2,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  trustCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustScore: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  trustInfo: { flex: 1 },
  trustLabel: { fontFamily: fonts.extrabold, fontSize: 18 },
  trustLabelGood: { color: '#10b981' },
  trustLabelMid: { color: colors.brand600 },
  trustMeta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2 },
  trustActions: { flexDirection: 'row', gap: 12 },
  trustActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  trustActionText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },

  reviewCta: { marginBottom: 16 },
  reviewsSection: { gap: 12 },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  reviewsTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  reviewsBadge: {
    backgroundColor: colors.brand100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  reviewsBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.brand800 },
  reviewsCount: { fontFamily: fonts.regular, fontSize: 14, color: colors.textLight },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand800 },
  reviewAuthor: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  reviewDate: { fontFamily: fonts.regular, fontSize: 10, color: colors.textLight },
  reviewStars: { flexDirection: 'row' },
  reviewTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  reviewContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  loadMoreReviews: { paddingVertical: 16, alignItems: 'center' },
  loadMoreReviewsText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  similarSection: { gap: 12, paddingBottom: 16 },
  similarTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: colors.text },
  similarCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  similarCover: { width: '100%', height: 128 },
  similarCoverFallback: { backgroundColor: colors.surfaceContainerLow },
  similarBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
  },
  similarInfo: { flex: 1 },
  similarName: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 4 },
  similarLocation: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
})
