import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import {
  FOOD_HUB_DELIVERY_FEE_ESTIMATE,
  foodStatusLabel,
  formatFoodEtaFromDistance,
  merchantCuisineLabel,
  merchantDisplayRating,
  nextOpeningLabel,
  nextOpeningTime,
  resolveMerchantFoodStatus,
  type OpeningHours,
} from '@/src/lib/foodHub'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function RestaurationHubCard({
  merchant,
  onPress,
}: {
  merchant: ApiMerchant
  onPress: () => void
}) {
  const cover = merchant.cover_image || merchant.featured_vertical?.image || merchant.logo
  const prep = merchant.food_prep_minutes ?? 25
  const rating = merchantDisplayRating(merchant)
  const eta = formatFoodEtaFromDistance(prep, merchant.distance_km)
  const foodStatus = resolveMerchantFoodStatus(merchant)
  const unavailable = foodStatus !== 'open'
  const showPromo = merchant.has_active_promo && !unavailable
  const nextOpen = foodStatus === 'closed'
    ? nextOpeningTime(merchant.food_opening_hours as OpeningHours | null)
    : null
  const nextOpenLabel = nextOpen ? nextOpeningLabel(nextOpen) : null

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <AppImage uri={cover} style={styles.image} fallbackLetter={merchant.business_name.slice(0, 1)} />
        ) : (
          <View style={[styles.image, styles.imageFallback]} />
        )}
        <View style={styles.favWrap}>
          <FavoriteButton merchantId={merchant.id} size={18} />
        </View>
        {showPromo ? (
          <View style={styles.promoBadge}>
            <Ionicons name="pricetag" size={11} color="#fff" />
            <Text style={styles.promoText}>Offre en cours</Text>
          </View>
        ) : null}
        {unavailable ? (
          <View style={[styles.unavailOverlay, foodStatus === 'closed' && styles.unavailClosed]}>
            <Text style={styles.unavailText}>{foodStatusLabel(foodStatus)}</Text>
          </View>
        ) : null}
        <View style={styles.etaBadge}>
          <Ionicons name="time-outline" size={14} color={colors.brand700} />
          <Text style={styles.etaText}>{eta}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text style={styles.name} numberOfLines={1}>{merchant.business_name}</Text>
            <Text style={styles.cuisine} numberOfLines={1}>{merchantCuisineLabel(merchant)}</Text>
          </View>
          {rating ? (
            <View style={styles.ratingBox}>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={colors.brand500} />
                <Text style={styles.ratingScore}>{rating.score}</Text>
              </View>
              <Text style={styles.ratingCount}>{rating.count} avis</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>Prépa {prep} min</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaItem}>
            Livraison dès {FOOD_HUB_DELIVERY_FEE_ESTIMATE.toLocaleString('fr-FR')} FCFA
          </Text>
        </View>
        {nextOpenLabel ? (
          <Text style={styles.nextOpen}>{nextOpenLabel}</Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.brand100,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: { opacity: 0.96 },
  imageWrap: { height: 192, position: 'relative', backgroundColor: colors.brand50 },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: colors.brand100,
  },
  favWrap: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  promoText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
  },
  unavailOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unavailClosed: { backgroundColor: 'rgba(15,23,42,0.6)' },
  unavailText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(180,83,9,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  etaBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  etaText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.text,
  },
  body: { padding: 16, gap: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  titleCol: { flex: 1, minWidth: 0 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  cuisine: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  ratingBox: { alignItems: 'flex-end' },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.brand50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingScore: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.text,
  },
  ratingCount: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textLight,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  metaItem: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  metaDot: { color: colors.textLight },
  nextOpen: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textLight,
  },
})
