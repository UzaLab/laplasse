import { useQuery } from '@tanstack/react-query'
import type { ApiMerchantDetail } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
import {
  Animated,
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
import { ShopBottomActionBar } from '@/src/components/ShopBottomActionBar'
import { ShopProductCard } from '@/src/components/ShopProductCard'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { LoadingState } from '@/src/components/ui'
import { useScrollRevealBar } from '@/src/hooks/useScrollRevealBar'
import { getApiClient } from '@/src/lib/api'
import { goBackOrReplace } from '@/src/lib/navigation'
import { loadBoutiqueProducts, resolveBoutique } from '@/src/lib/boutiqueResolve'
import {
  getDefaultProfileTab,
  getProfileTabs,
  isValidProfileTab,
  type ProfileTabId,
} from '@/src/lib/merchantProfileTabs'
import { colors, fonts } from '@/src/theme'
import { businessDayFromDate } from '@laplasse/shared-config'
import { isOpenFromMerchantHours } from '@/src/lib/foodHub'

const SHOP_AMBER = '#fea619'
const SHOP_AMBER_TEXT = '#684000'
const SHOP_PRICE = '#855300'
/** BusinessHour.day in DB: 0 = lundi … 6 = dimanche */
const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HERO_HEIGHT = 350
/** Hauteur barre CTA + marge sous le dernier contenu */
const ACTION_BAR_CLEARANCE = 72
const CONTENT_BOTTOM_GAP = 15

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

export function ShopMerchantView({
  slug,
  initialTab,
}: {
  slug: string
  initialTab?: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const { onScroll, animatedStyle, interactive } = useScrollRevealBar()

  const resolveQuery = useQuery({
    queryKey: ['boutique-resolve', slug],
    queryFn: () => resolveBoutique(slug),
  })

  const resolved = resolveQuery.data
  const merchant = resolved?.merchant ?? undefined
  const shop = resolved?.shop ?? undefined
  const shopSlug = resolved?.shopSlug ?? slug
  const productRouteSlug = merchant?.slug ?? shopSlug

  const productsQuery = useQuery({
    queryKey: ['merchant-boutique-preview', shopSlug, merchant?.slug],
    queryFn: () => loadBoutiqueProducts(shopSlug, merchant?.slug),
    enabled: !!resolved,
  })

  const trustQuery = useQuery({
    queryKey: ['shop-trust', shopSlug],
    queryFn: () => getApiClient().getShopTrustScore(shopSlug),
    enabled: !!resolved && !merchant,
  })

  const hasMarketplace = !!merchant?.has_marketplace || !!shop

  const tabs = useMemo(() => {
    if (merchant) return getProfileTabs(merchant.category.slug, { hasMarketplace })
    return [
      { id: 'boutique' as const, label: 'Boutique' },
      { id: 'infos' as const, label: 'Informations' },
    ]
  }, [merchant, hasMarketplace])

  const defaultTab: ProfileTabId = merchant
    ? getDefaultProfileTab(merchant.category.slug, hasMarketplace)
    : 'boutique'

  const [activeTab, setActiveTab] = useState<ProfileTabId>(() =>
    isValidProfileTab(initialTab, tabs) ? initialTab : defaultTab,
  )
  const [visibleReviews, setVisibleReviews] = useState(3)

  if (resolveQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!resolved) {
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

  const isOpen = merchant ? isCurrentlyOpen(merchant) : true
  const products = (productsQuery.data ?? []).slice(0, 6)
  const reviews = merchant?.reviews ?? []
  const trustScore = merchant?.trust_score ?? trustQuery.data?.score ?? 0
  const reviewCount = merchant?.review_count ?? trustQuery.data?.total_orders ?? 0
  const coverImage = merchant?.cover_image ?? shop?.cover_image
  const businessName = merchant?.business_name ?? shop?.name ?? resolved.displayName
  const categoryName = merchant?.category.name ?? 'Boutique'
  const isVerified = merchant?.verification_status === 'VERIFIED'
  const locationLabel = merchant?.location
    ? [merchant.location.address, merchant.location.district, merchant.location.city].filter(Boolean).join(', ')
    : [shop?.district, shop?.city].filter(Boolean).join(', ')
  const description = merchant?.description ?? shop?.description
  const phone = merchant?.phone ?? shop?.phone
  const whatsapp = merchant?.whatsapp ?? shop?.whatsapp

  const handleShare = async () => {
    try {
      await Share.share({ message: `${businessName} sur LaPlasse` })
    } catch { /* ignore */ }
  }

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ y: 0, animated: true })
  }

  const goToBoutique = () => {
    router.push(`/m/${shopSlug}/boutique`)
  }

  const trustRingColor = trustScore >= 80 ? '#009668' : SHOP_AMBER
  const scrollBottomPad = ACTION_BAR_CLEARANCE + CONTENT_BOTTOM_GAP

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          stickyHeaderIndices={[1]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        >
          {/* Hero */}
          <View style={[styles.hero, { height: HERO_HEIGHT }]}>
            {coverImage ? (
              <AppImage uri={coverImage} style={styles.cover} fallbackLetter={merchant?.business_name.slice(0, 1)} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroGradient} />

            <View style={[styles.heroTopBar, { paddingTop: insets.top + 8 }]}>
              <Pressable onPress={() => goBackOrReplace(router, '/(tabs)/search')} style={styles.heroActionBtn}>
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable onPress={() => void handleShare()} style={styles.heroActionBtn}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                </Pressable>
                {merchant ? (
                  <View style={styles.heroActionBtn}>
                    <FavoriteButton merchantId={merchant.id} size={20} color="#fff" favoritedColor="#fca5a5" />
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.heroInfo}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
                <View style={styles.badgeCategory}>
                  <Text style={styles.badgeCategoryText}>{categoryName.toUpperCase()}</Text>
                </View>
                {isVerified ? (
                  <View style={styles.badgeVerified}>
                    <Ionicons name="checkmark-circle" size={16} color="#bfdbfe" />
                  </View>
                ) : null}
                {merchant ? (
                  <View style={[styles.badgeOpen, isOpen ? styles.badgeOpenYes : styles.badgeOpenNo]}>
                    <Ionicons name="time-outline" size={12} color="#fff" />
                    <Text style={styles.badgeOpenText}>{isOpen ? 'Ouvert' : 'Fermé'}</Text>
                  </View>
                ) : null}
                {merchant?.avg_rating != null && merchant.review_count > 0 ? (
                  <View style={styles.badgeRating}>
                    <Ionicons name="star" size={14} color={SHOP_AMBER} />
                    <Text style={styles.badgeRatingText}>
                      {merchant.avg_rating} ({merchant.review_count} avis)
                    </Text>
                  </View>
                ) : null}
              </ScrollView>

              <Text style={styles.heroName}>{businessName}</Text>
              {locationLabel ? (
                <View style={styles.heroLocationRow}>
                  <Ionicons name="location" size={18} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroLocation}>{locationLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Sticky tabs */}
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

          {/* Tab content */}
          <View style={styles.content}>
            {activeTab === 'boutique' ? (
              <View style={styles.boutiqueSection}>
                {productsQuery.isLoading ? (
                  <LoadingState />
                ) : products.length > 0 ? (
                  <>
                    <View style={styles.productGrid}>
                      {products.map((product, index) => (
                        <View key={product.id} style={styles.productCell}>
                          <ShopProductCard
                            product={product}
                            showBestSeller={index < 3}
                            onPress={() => router.push(`/m/${productRouteSlug}/p/${product.slug}`)}
                          />
                        </View>
                      ))}
                    </View>
                    <Pressable onPress={goToBoutique} style={styles.fullBoutiqueLink}>
                      <Text style={styles.fullBoutiqueLinkText}>Voir la boutique complète</Text>
                    </Pressable>
                  </>
                ) : (
                  <Text style={styles.empty}>Aucun produit disponible pour le moment.</Text>
                )}
              </View>
            ) : null}

            {activeTab === 'infos' ? (
              <View style={styles.infoSection}>
                {description ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>À propos</Text>
                    <Text style={styles.desc}>{description}</Text>
                  </View>
                ) : null}

                {(merchant?.tags?.length ?? 0) > 0 ? (
                  <View style={styles.infoBlock}>
                    <Text style={styles.infoBlockTitle}>Services & équipements</Text>
                    <View style={styles.tagsGrid}>
                      {merchant!.tags!.map(tag => (
                        <View key={tag} style={styles.tagRow}>
                          <Ionicons name="storefront-outline" size={18} color={colors.brand500} />
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {locationLabel ? (
                  <View style={styles.infoBlock}>
                    <View style={styles.infoBlockTitleRow}>
                      <Ionicons name="location-outline" size={18} color={colors.brand500} />
                      <Text style={styles.infoBlockTitle}>Adresse</Text>
                    </View>
                    <Text style={styles.addressText}>{locationLabel}</Text>
                  </View>
                ) : null}

                {phone ? (
                  <Pressable
                    onPress={() => void Linking.openURL(`tel:${phone}`)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="call-outline" size={18} color={colors.brand700} />
                    <Text style={styles.contactText}>{phone}</Text>
                  </Pressable>
                ) : null}

                {merchant?.website ? (
                  <Pressable
                    onPress={() => void Linking.openURL(merchant.website!)}
                    style={styles.contactRow}
                  >
                    <Ionicons name="globe-outline" size={18} color={colors.brand700} />
                    <Text style={styles.contactText}>{merchant.website}</Text>
                  </Pressable>
                ) : null}

                {!description && !merchant?.tags?.length && !locationLabel ? (
                  <Text style={styles.empty}>Aucune information supplémentaire pour le moment.</Text>
                ) : null}
              </View>
            ) : null}

            {activeTab === 'horaires' ? (
              <View style={styles.hoursSection}>
                {(merchant?.hours ?? []).length > 0 ? (
                  (merchant!.hours ?? [])
                    .slice()
                    .sort((a, b) => a.day - b.day)
                    .map(h => {
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
                {(merchant?.media.length ?? 0) > 0 ? (
                  <View style={styles.galleryGrid}>
                    {merchant!.media.map(item => (
                      <AppImage key={item.id} uri={item.url} style={styles.galleryImage} />
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

            {/* Trust index */}
            <View style={styles.trustCard}>
              <Text style={styles.trustSectionLabel}>INDICE DE CONFIANCE</Text>
              <View style={[styles.trustCircle, { borderColor: trustRingColor }]}>
                <Text style={styles.trustScore}>{trustScore}</Text>
              </View>
              <Text style={[styles.trustLabel, { color: trustRingColor }]}>
                {trustLabel(trustScore)}
              </Text>
              <Text style={styles.trustMeta}>
                {reviewCount} avis ·{' '}
                {isVerified ? '✓ Vérifié' : 'Non vérifié'}
              </Text>
              <View style={styles.trustActions}>
                <Pressable onPress={() => void handleShare()} style={styles.trustActionBtn}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                  <Text style={styles.trustActionText}>Partager</Text>
                </Pressable>
                {merchant ? (
                  <Pressable style={styles.trustActionBtn}>
                    <FavoriteButton merchantId={merchant.id} size={18} />
                    <Text style={styles.trustActionText}>Sauvegarder</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>

            {/* Reviews */}
            {reviews.length > 0 ? (
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsHeader}>
                  <Ionicons name="star" size={24} color={SHOP_AMBER} />
                  <Text style={styles.reviewsTitle}>Avis clients</Text>
                  {merchant?.avg_rating != null ? (
                    <Text style={styles.reviewsRating}>{merchant.avg_rating}/5</Text>
                  ) : null}
                  <Text style={styles.reviewsCount}>({reviewCount} avis)</Text>
                </View>

                <Pressable
                  style={styles.leaveReviewBtn}
                  onPress={() =>
                    merchant &&
                    router.push({
                      pathname: '/profile/reviews/write',
                      params: {
                        merchantId: merchant.id,
                        merchantName: merchant.business_name,
                      },
                    } as never)
                  }
                >
                  <Ionicons name="create-outline" size={18} color={SHOP_AMBER_TEXT} />
                  <Text style={styles.leaveReviewText}>Laisser un avis</Text>
                </Pressable>

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
                          <Ionicons key={i} name="star" size={14} color={SHOP_AMBER} />
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

            <Pressable style={styles.reportRow}>
              <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
              <Text style={styles.reportText}>Signaler cette fiche</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Animated.View
          style={[
            styles.actionBarWrap,
            animatedStyle,
            { pointerEvents: interactive ? 'auto' : 'none' },
          ]}
        >
          <ShopBottomActionBar
            whatsapp={whatsapp}
            phone={phone}
            onBoutique={goToBoutique}
            onScrollTop={scrollToTop}
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

  hero: { position: 'relative', backgroundColor: colors.slate900 },
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
    paddingHorizontal: 20,
    zIndex: 10,
  },
  heroActions: { flexDirection: 'row', gap: 8 },
  heroActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  badgeCategory: {
    backgroundColor: SHOP_AMBER,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCategoryText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: SHOP_AMBER_TEXT,
    letterSpacing: 0.5,
  },
  badgeVerified: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59,130,246,0.2)',
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.3)',
  },
  badgeOpen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeOpenYes: {
    backgroundColor: 'rgba(34,197,94,0.2)',
    borderColor: 'rgba(74,222,128,0.3)',
  },
  badgeOpenNo: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: 'rgba(248,113,113,0.3)',
  },
  badgeOpenText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
  badgeRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeRatingText: { fontFamily: fonts.bold, fontSize: 12, color: '#fff' },
  heroName: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroLocationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, maxWidth: '90%' },
  heroLocation: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
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
  tabActive: { borderBottomColor: SHOP_AMBER },
  tabText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.textMuted },
  tabTextActive: { fontFamily: fonts.semibold, color: colors.text },

  content: { paddingHorizontal: 20, paddingVertical: 40, gap: 40 },
  boutiqueSection: { gap: 32 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCell: { width: '47%' },
  fullBoutiqueLink: { alignItems: 'center', paddingVertical: 8 },
  fullBoutiqueLinkText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.5,
  },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },

  infoSection: { gap: 32 },
  infoBlock: { gap: 12 },
  infoBlockTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBlockTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 24 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '45%' },
  tagText: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
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

  trustCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceBright,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 24,
    gap: 8,
  },
  trustSectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  trustCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trustScore: { fontFamily: fonts.extrabold, fontSize: 32, color: colors.text },
  trustLabel: { fontFamily: fonts.extrabold, fontSize: 18 },
  trustMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  trustActions: { flexDirection: 'row', gap: 16, width: '100%', marginTop: 8 },
  trustActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  trustActionText: { fontFamily: fonts.bold, fontSize: 12, color: colors.text },

  reviewsSection: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 24,
    gap: 16,
  },
  reviewsHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  reviewsTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  reviewsRating: { fontFamily: fonts.semibold, fontSize: 16, color: SHOP_AMBER },
  reviewsCount: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  leaveReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SHOP_AMBER,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  leaveReviewText: { fontFamily: fonts.bold, fontSize: 12, color: SHOP_AMBER_TEXT },
  reviewCard: {
    backgroundColor: colors.surfaceBright,
    borderRadius: 8,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 8,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { fontFamily: fonts.semibold, fontSize: 16, color: SHOP_PRICE },
  reviewAuthor: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  reviewDate: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  reviewStars: { flexDirection: 'row' },
  reviewTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  reviewContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  loadMoreReviews: { paddingVertical: 8, alignItems: 'center' },
  loadMoreReviewsText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },

  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8 },
  reportText: { fontFamily: fonts.bold, fontSize: 12, color: colors.textMuted },
})
