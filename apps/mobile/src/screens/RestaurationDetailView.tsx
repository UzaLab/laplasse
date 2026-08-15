import { useQuery } from '@tanstack/react-query'
import type { ApiMerchantDetail } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LeaveReviewButton } from '@/src/components/LeaveReviewButton'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { RestaurationCartBar } from '@/src/components/RestaurationCartBar'
import { AppImage } from '@/src/components/ui/AppImage'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { BrandLogo } from '@/src/components/BrandLogo'
import { RestaurationMenuPanel } from '@/src/components/RestaurationMenuPanel'
import { TableBookingPanel } from '@/src/components/TableBookingPanel'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  FOOD_HUB_DELIVERY_FEE_ESTIMATE,
  foodPauseUntilLabel,
  foodStatusLabel,
  formatFoodEtaFromDistance,
  formatFoodMinOrderLabel,
  merchantCuisineLabel,
  merchantDisplayRating,
  resolveMerchantFoodStatus,
} from '@/src/lib/foodHub'
import { colors, fonts, homeLayout, radii } from '@/src/theme'
import { useCartItemCount } from '@/src/hooks/useCartItemCount'

export function RestaurationDetailView({ slug }: { slug: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [scrolled, setScrolled] = useState(false)

  const merchantQuery = useQuery({
    queryKey: ['restauration-merchant', slug],
    queryFn: () => getApiClient().getMerchant(slug),
  })

  const merchant = merchantQuery.data as ApiMerchantDetail | undefined
  const foodStatus = merchant ? resolveMerchantFoodStatus(merchant) : 'open'
  const isAvailable = foodStatus === 'open'
  const rating = merchant ? merchantDisplayRating(merchant) : null
  const prep = merchant?.food_prep_minutes ?? 25
  const minOrder = merchant?.food_min_order_amount
  const cover = merchant?.cover_image || merchant?.logo
  const cartCount = useCartItemCount()
  const scrollBottomPad = insets.bottom + (cartCount > 0 ? 88 : 24)

  const handleShare = async () => {
    if (!merchant) return
    try {
      await Share.share({
        message: `${merchant.business_name} sur LaPlasse`,
      })
    } catch {
      // ignore
    }
  }

  if (merchantQuery.isLoading) {
    return (
      <PublicScreenShell showBottomNav={false}>
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (!merchant) {
    return (
      <PublicScreenShell showBottomNav={false}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Restaurant introuvable.</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  return (
    <PublicScreenShell showBottomNav={false}>
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
            accessibilityLabel="Retour"
          >
            <Ionicons name="arrow-back" size={20} color={colors.brand800} />
          </Pressable>

          {scrolled ? (
            <BrandLogo variant="mark" markStyle={styles.headerBrandLogo} />
          ) : (
            <View style={styles.headerBrandSpacer} />
          )}

          <View style={styles.headerActions}>
            <Pressable
              onPress={() => void handleShare()}
              style={[styles.headerBtn, scrolled && styles.headerBtnScrolled]}
              accessibilityLabel="Partager"
            >
              <Ionicons name="share-outline" size={18} color={colors.brand800} />
            </Pressable>
            <View style={[styles.headerBtn, scrolled && styles.headerBtnScrolled]}>
              <FavoriteButton merchantId={merchant.id} size={18} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: scrollBottomPad }}
          onScroll={e => setScrolled(e.nativeEvent.contentOffset.y > 100)}
          scrollEventThrottle={16}
        >
          <View style={styles.hero}>
            <AppImage
              uri={cover}
              style={styles.heroImage}
              fallbackLetter={merchant.business_name.slice(0, 1)}
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadges}>
                <View
                  style={[
                    styles.statusBadge,
                    isAvailable ? styles.statusOpen : foodStatus === 'paused' ? styles.statusPaused : styles.statusClosed,
                  ]}
                >
                  <Text style={styles.statusText}>
                    {foodStatus === 'paused'
                      ? `En pause jusqu'à ${foodPauseUntilLabel(merchant.food_pause_until)}`
                      : foodStatusLabel(foodStatus)}
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{merchant.category.name}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{merchant.business_name}</Text>
              <Text style={styles.heroCuisine} numberOfLines={1}>
                {merchantCuisineLabel(merchant)}
              </Text>
              <View style={styles.heroMeta}>
                {rating ? (
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={16} color={colors.brand500} />
                    <Text style={styles.metaTextBold}>{rating.score}</Text>
                    <Text style={styles.metaText}>({rating.count})</Text>
                  </View>
                ) : null}
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#fff" />
                  <Text style={styles.metaText}>{formatFoodEtaFromDistance(prep, merchant.distance_km)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="bicycle-outline" size={16} color="#fff" />
                  <Text style={styles.metaText}>
                    {FOOD_HUB_DELIVERY_FEE_ESTIMATE.toLocaleString('fr-FR')} FCFA
                  </Text>
                </View>
                {minOrder != null && minOrder > 0 ? (
                  <Text style={styles.metaText}>{formatFoodMinOrderLabel(minOrder)}</Text>
                ) : null}
              </View>
              {merchant.location?.district ? (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText}>
                    {[merchant.location.district, merchant.location.city].filter(Boolean).join(', ')}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.menuPanel}>
            <TableBookingPanel
              merchantId={merchant.id}
              merchantName={merchant.business_name}
            />
            <RestaurationMenuPanel merchantSlug={merchant.slug} />
            <View style={styles.reviewSection}>
              <LeaveReviewButton merchantId={merchant.id} merchantName={merchant.business_name} />
            </View>
          </View>
        </ScrollView>

        <RestaurationCartBar />
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: homeLayout.gutter,
    paddingBottom: 10,
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBtnScrolled: { backgroundColor: colors.surfaceContainer },
  headerBrandLogo: { width: 32, height: 32 },
  headerBrandSpacer: { width: 80 },
  headerActions: { flexDirection: 'row', gap: 8 },
  hero: { height: 320, position: 'relative', backgroundColor: colors.brand100, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  heroFallback: { backgroundColor: colors.brand100 },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: homeLayout.gutter,
    paddingBottom: 24,
  },
  heroBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusOpen: { backgroundColor: colors.success },
  statusPaused: { backgroundColor: colors.brand500 },
  statusClosed: { backgroundColor: colors.textMuted },
  statusText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryBadgeText: { fontFamily: fonts.semibold, fontSize: 11, color: '#fff' },
  heroTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: '#fff',
    marginBottom: 4,
  },
  heroCuisine: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 13, color: 'rgba(255,255,255,0.92)' },
  metaTextBold: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontFamily: fonts.regular, fontSize: 12, color: 'rgba(255,255,255,0.78)' },
  menuPanel: {
    marginTop: -16,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.brand100,
    padding: homeLayout.gutter,
    gap: 16,
    minHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 4,
  },
  reviewSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: 12,
  },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
})
