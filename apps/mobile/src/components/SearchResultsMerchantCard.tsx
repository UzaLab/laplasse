import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { merchantLocationLine, merchantSearchRating } from '@/src/lib/foodHub'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function SearchResultsMerchantCard({
  merchant,
  onPress,
}: {
  merchant: ApiMerchant
  onPress: () => void
}) {
  const rating = merchantSearchRating(merchant)
  const location = merchantLocationLine(merchant)
  const categorySlug = merchant.category?.slug ?? ''
  const categoryIcon = merchant.category?.icon ?? null
  const icon = getCategoryIcon(categorySlug, categoryIcon)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {merchant.cover_image ? (
          <AppImage uri={merchant.cover_image} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name={icon} size={48} color={colors.textLight} />
          </View>
        )}
        <View style={styles.favWrap}>
          <FavoriteButton merchantId={merchant.id} size={18} />
        </View>
        <View style={styles.badges}>
          {merchant.category?.name ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>{merchant.category.name}</Text>
            </View>
          ) : null}
          {rating ? (
            <View style={[styles.badge, styles.badgeRow]}>
              <Ionicons name="star" size={12} color={colors.brand500} />
              <Text style={styles.badgeText}>{rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{merchant.business_name}</Text>
        {merchant.description ? (
          <Text style={styles.desc} numberOfLines={2}>{merchant.description}</Text>
        ) : null}
        {location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>{location}</Text>
          </View>
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
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressed: { opacity: 0.95 },
  imageWrap: { height: 220, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxWidth: '85%',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
    maxWidth: 100,
  },
  body: { padding: 16 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
  },
})
