import { useQuery } from '@tanstack/react-query'
import type { ApiMerchant, ApiMerchantDetail } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
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
import { HotelChambresTab } from '@/src/components/HotelChambresTab'
import { MarketplaceProductGridCard } from '@/src/components/MarketplaceProductGridCard'
import { PrestationsTab } from '@/src/components/PrestationsTab'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'
import { RestaurationMenuPanel } from '@/src/components/RestaurationMenuPanel'
import { LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'
import {
  getDefaultProfileTab,
  getProfileTabs,
  isValidProfileTab,
  type ProfileTabId,
} from '@/src/lib/merchantProfileTabs'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout, layout, spacing } from '@/src/theme'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatHours(hours: ApiMerchantDetail['hours']) {
  if (!hours?.length) return []
  return hours
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(h => {
      if (h.is_closed) return `${DAY_LABELS[h.day] ?? h.day} · Fermé`
      return `${DAY_LABELS[h.day] ?? h.day} · ${h.open_time ?? '?'} – ${h.close_time ?? '?'}`
    })
}

function SimilarMerchantCard({
  merchant,
  onPress,
}: {
  merchant: ApiMerchant
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.similarCard}>
      {merchant.logo ? (
        <Image source={{ uri: merchant.logo }} style={styles.similarLogo} />
      ) : (
        <View style={[styles.similarLogo, styles.similarLogoFallback]}>
          <Ionicons name="storefront-outline" size={20} color={colors.textLight} />
        </View>
      )}
      <Text style={styles.similarName} numberOfLines={2}>{merchant.business_name}</Text>
      <Text style={styles.similarCat} numberOfLines={1}>{merchant.category.name}</Text>
    </Pressable>
  )
}

export function MerchantDetailView({
  slug,
  initialTab,
}: {
  slug: string
  initialTab?: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [scrolled, setScrolled] = useState(false)

  const merchantQuery = useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => getApiClient().getMerchant(slug),
  })

  const merchant = merchantQuery.data as ApiMerchantDetail | undefined
  const hasMarketplace = !!merchant?.has_marketplace

  const tabs = useMemo(
    () => (merchant ? getProfileTabs(merchant.category.slug, { hasMarketplace }) : []),
    [merchant, hasMarketplace],
  )

  const defaultTab = merchant
    ? getDefaultProfileTab(merchant.category.slug, hasMarketplace)
    : 'infos'

  const [activeTab, setActiveTab] = useState<ProfileTabId>(() =>
    isValidProfileTab(initialTab, tabs) ? initialTab : defaultTab,
  )

  useEffect(() => {
    if (!merchant) return
    if (isFoodCategorySlug(merchant.category.slug)) {
      router.replace(`/restauration/${merchant.slug}`)
    }
  }, [merchant, router])

  useEffect(() => {
    if (isValidProfileTab(initialTab, tabs)) {
      setActiveTab(initialTab)
    }
  }, [initialTab, tabs])

  const productsQuery = useQuery({
    queryKey: ['merchant-boutique-preview', slug],
    queryFn: () => getApiClient().getShopProducts(slug),
    enabled: !!merchant && (activeTab === 'boutique' || hasMarketplace),
  })

  const similarQuery = useQuery({
    queryKey: ['merchant-similar', slug],
    queryFn: () => getApiClient().getMerchantSimilar(slug, 4),
    enabled: !!merchant,
  })

  if (merchantQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace" showBottomNav={false}>
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!merchant) {
    return (
      <PublicScreenShell activeRoute="marketplace" showBottomNav={false}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Établissement introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  if (isFoodCategorySlug(merchant.category.slug)) {
    return (
      <PublicScreenShell activeRoute="marketplace" showBottomNav={false}>
        <LoadingState />
      </PublicScreenShell>
    )
  }

  const contactPhone = merchant.whatsapp ?? merchant.phone
  const hoursLines = formatHours(merchant.hours)
  const products = (productsQuery.data ?? []).slice(0, 6)
  const similar = similarQuery.data ?? []

  const handleShare = async () => {
    try {
      await Share.share({ message: `${merchant.business_name} sur LaPlasse` })
    } catch {
      // ignore
    }
  }

  return (
    <PublicScreenShell activeRoute="marketplace" showBottomNav={false}>
      <View style={styles.root}>
        <View
          style={[
            styles.floatingHeader,
            { paddingTop: insets.top + 8 },
            scrolled && styles.floatingHeaderScrolled,
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={[styles.headerBtn, scrolled && styles.headerBtnScrolled]}
          >
            <Ionicons name="arrow-back" size={20} color={colors.brand800} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={() => void handleShare()} style={styles.headerBtn}>
              <Ionicons name="share-outline" size={20} color={colors.brand800} />
            </Pressable>
            <FavoriteButton merchantId={merchant.id} size={22} />
          </View>
        </View>

        <ScrollView
          onScroll={e => setScrolled(e.nativeEvent.contentOffset.y > 120)}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <View style={styles.hero}>
            {merchant.cover_image ? (
              <Image source={{ uri: merchant.cover_image }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroOverlay} />
          </View>

          <View style={styles.body}>
            <Text style={styles.name}>{merchant.business_name}</Text>
            <Text style={styles.category}>{merchant.category.name}</Text>

            {merchant.avg_rating != null ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={16} color={colors.brand500} />
                <Text style={styles.rating}>{merchant.avg_rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({merchant.review_count} avis)</Text>
              </View>
            ) : null}

            {merchant.location ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
                <Text style={styles.infoText}>
                  {[merchant.location.address, merchant.location.district, merchant.location.city]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            ) : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsTrack}
            >
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

            {activeTab === 'menu' ? (
              <RestaurationMenuPanel merchantSlug={merchant.slug} />
            ) : null}

            {activeTab === 'chambres' ? (
              <HotelChambresTab
                merchantId={merchant.id}
                merchantSlug={merchant.slug}
                merchantName={merchant.business_name}
                categorySlug={merchant.category.slug}
              />
            ) : null}

            {activeTab === 'prestations' ? (
              <PrestationsTab
                merchantId={merchant.id}
                merchantSlug={merchant.slug}
                categorySlug={merchant.category.slug}
              />
            ) : null}

            {activeTab === 'boutique' ? (
              <View style={styles.tabSection}>
                {hasMarketplace ? (
                  <>
                    <Pressable
                      onPress={() => router.push(`/m/${slug}/boutique`)}
                      style={styles.boutiqueLink}
                    >
                      <Text style={styles.boutiqueLinkText}>Voir toute la boutique</Text>
                      <Ionicons name="arrow-forward" size={16} color={colors.brand700} />
                    </Pressable>
                    {productsQuery.isLoading ? (
                      <LoadingState />
                    ) : products.length > 0 ? (
                      <View style={styles.productGrid}>
                        {products.map(product => (
                          <View key={product.id} style={styles.productCell}>
                            <MarketplaceProductGridCard
                              product={{
                                ...product,
                                merchant: {
                                  business_name: merchant.business_name,
                                  slug: merchant.slug,
                                },
                              }}
                              showMerchantName={false}
                              onPress={() => router.push(`/m/${slug}/p/${product.slug}`)}
                            />
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.empty}>Aucun produit disponible</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.empty}>Cet établissement n&apos;a pas de boutique en ligne.</Text>
                )}
              </View>
            ) : null}

            {activeTab === 'infos' ? (
              <View style={styles.tabSection}>
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
              <View style={styles.tabSection}>
                {hoursLines.length > 0 ? (
                  hoursLines.map(line => (
                    <Text key={line} style={styles.hourLine}>{line}</Text>
                  ))
                ) : (
                  <Text style={styles.empty}>Horaires non renseignés.</Text>
                )}
              </View>
            ) : null}

            {activeTab === 'galerie' ? (
              <View style={styles.tabSection}>
                {merchant.media.length > 0 ? (
                  <View style={styles.galleryGrid}>
                    {merchant.media.map(item => (
                      <Image key={item.id} source={{ uri: item.url }} style={styles.galleryImage} />
                    ))}
                  </View>
                ) : (
                  <Text style={styles.empty}>Aucune photo disponible.</Text>
                )}
              </View>
            ) : null}

            {merchant.reviews.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Avis récents</Text>
                {merchant.reviews.slice(0, 3).map(review => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewAuthor}>
                        {review.user.full_name ?? 'Client'}
                      </Text>
                      <Text style={styles.reviewRating}>★ {review.rating}</Text>
                    </View>
                    {review.content ? (
                      <Text style={styles.reviewContent} numberOfLines={3}>{review.content}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {similar.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Établissements similaires</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarTrack}>
                  {similar.map(item => (
                    <SimilarMerchantCard
                      key={item.id}
                      merchant={item}
                      onPress={() => router.push(`/m/${item.slug}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
          {contactPhone ? (
            <Pressable
              style={styles.whatsappBtn}
              onPress={() =>
                openWhatsApp(contactPhone, `Bonjour ${merchant.business_name}, je vous contacte via LaPlasse.`)
              }
            >
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </Pressable>
          ) : null}
          {hasMarketplace ? (
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Boutique"
                onPress={() => router.push(`/m/${slug}/boutique`)}
              />
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Panier" onPress={() => router.push('/cart')} />
            </View>
          )}
        </View>
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  floatingHeaderScrolled: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnScrolled: { backgroundColor: colors.surfaceContainerLow },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  hero: { height: 220, position: 'relative' },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.border },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
  body: { padding: spacing.gutter, marginTop: -16 },
  name: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text },
  category: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rating: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  reviewCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  tabsTrack: { gap: 8, marginTop: 20, marginBottom: 16, paddingBottom: 4 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  tabActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  tabText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: colors.brand700 },
  tabSection: { gap: 12 },
  placeholderTab: {
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholderTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  placeholderBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  boutiqueLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    marginBottom: 12,
  },
  boutiqueLinkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  productCell: { width: '47%' },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  contactText: { fontFamily: fonts.medium, fontSize: 14, color: colors.brand700 },
  hourLine: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  galleryImage: { width: '31%', aspectRatio: 1, borderRadius: 12 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 12 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  reviewRating: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand700 },
  reviewContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  similarTrack: { gap: 12 },
  similarCard: { width: 120 },
  similarLogo: { width: 72, height: 72, borderRadius: 16, marginBottom: 8 },
  similarLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  similarName: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  similarCat: { fontFamily: fonts.regular, fontSize: 11, color: colors.textMuted, marginTop: 2 },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
})
