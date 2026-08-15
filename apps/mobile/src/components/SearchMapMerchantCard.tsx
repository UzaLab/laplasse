import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { colors, fonts, homeLayout } from '@/src/theme'

export const SEARCH_MAP_CARD_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 320)
export const SEARCH_MAP_CARD_SNAP = SEARCH_MAP_CARD_WIDTH + 16
const CARD_WIDTH = SEARCH_MAP_CARD_WIDTH

function formatLocation(merchant: ApiMerchant): string {
  const district = merchant.location?.district ?? merchant.location?.city
  const distance =
    merchant.distance_km != null ? `${merchant.distance_km.toFixed(1)} km` : null
  return [district, distance].filter(Boolean).join(' • ')
}

export function SearchMapMerchantCard({
  merchant,
  active,
  onPress,
}: {
  merchant: ApiMerchant
  active: boolean
  onPress: () => void
}) {
  const cover = merchant.cover_image ?? merchant.logo
  const rating = merchant.avg_rating

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width: CARD_WIDTH },
        !active && styles.cardInactive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <AppImage uri={cover} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackLetter}>{merchant.business_name.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.heartWrap}>
          <FavoriteButton merchantId={merchant.id} size={16} />
        </View>
      </View>

      <View style={styles.body}>
        {rating != null ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={colors.brand600} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            {merchant.review_count > 0 ? (
              <Text style={styles.reviewCount}>({merchant.review_count} avis)</Text>
            ) : null}
          </View>
        ) : null}

        <Text style={styles.name} numberOfLines={1}>
          {merchant.business_name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          {formatLocation(merchant)}
        </Text>

        <View style={styles.footer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{merchant.category.name}</Text>
          </View>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.arrowBtn, pressed && styles.pressed]}
            accessibilityLabel={`Voir ${merchant.business_name}`}
          >
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: homeLayout.radiusXl,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  cardInactive: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  pressed: { opacity: 0.9 },
  imageWrap: {
    width: 96,
    height: 96,
    borderRadius: homeLayout.radiusLg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainer,
  },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.brand600,
  },
  heartWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: 999,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
  reviewCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 2,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 22,
    color: colors.text,
    marginBottom: 4,
  },
  location: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  categoryText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.brand600,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
