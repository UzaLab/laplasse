import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { getCategoryIcon } from '@/src/lib/categoryIcons'
import { merchantLocationLine, merchantSearchRating } from '@/src/lib/foodHub'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function SearchResultsMerchantCard({
  merchant,
  onPress,
  compact = false,
}: {
  merchant: ApiMerchant
  onPress: () => void
  compact?: boolean
}) {
  const rating = merchantSearchRating(merchant)
  const location = merchantLocationLine(merchant)
  const categorySlug = merchant.category?.slug ?? ''
  const categoryIcon = merchant.category?.icon ?? null
  const icon = getCategoryIcon(categorySlug, categoryIcon)

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, compact && styles.cardCompact, pressed && styles.pressed]}
    >
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        {merchant.cover_image ? (
          <AppImage uri={merchant.cover_image} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Ionicons name={icon} size={compact ? 32 : 48} color={colors.textLight} />
          </View>
        )}
        <View style={[styles.favWrap, compact && styles.favWrapCompact]}>
          <FavoriteButton merchantId={merchant.id} size={compact ? 12 : 18} />
        </View>
        <View style={[styles.badges, compact && styles.badgesCompact]}>
          {merchant.category?.name ? (
            <View style={[styles.badge, compact && styles.badgeCompact]}>
              <Text style={[styles.badgeText, compact && styles.badgeTextCompact]} numberOfLines={1}>
                {merchant.category.name}
              </Text>
            </View>
          ) : null}
          {rating ? (
            <View style={[styles.badge, styles.badgeRow, compact && styles.badgeCompact]}>
              <Ionicons name="star" size={compact ? 10 : 12} color={colors.brand500} />
              <Text style={[styles.badgeText, compact && styles.badgeTextCompact]}>{rating}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {merchant.business_name}
        </Text>
        {!compact && merchant.description ? (
          <Text style={styles.desc} numberOfLines={2}>{merchant.description}</Text>
        ) : null}
        {location || merchant.whatsapp ? (
          <View style={styles.locationRow}>
            {location ? (
              <View style={styles.locationMain}>
                <Ionicons name="location-outline" size={compact ? 12 : 14} color={colors.textMuted} />
                <Text style={[styles.location, compact && styles.locationCompact]} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            ) : (
              <View style={styles.locationMain} />
            )}
            {merchant.whatsapp ? (
              <Pressable
                hitSlop={8}
                style={[styles.whatsappBtn, compact && styles.whatsappBtnCompact]}
                onPress={() => {
                  openWhatsApp(
                    merchant.whatsapp!,
                    `Bonjour ${merchant.business_name}, je vous contacte via LaPlasse.`,
                  )
                }}
              >
                <Ionicons name="logo-whatsapp" size={compact ? 16 : 18} color="#16a34a" />
              </Pressable>
            ) : null}
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
  cardCompact: { borderRadius: 16 },
  pressed: { opacity: 0.95 },
  imageWrap: { height: 220, position: 'relative' },
  imageWrapCompact: { height: 144 },
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
  favWrapCompact: {
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
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
  badgesCompact: { bottom: 8, left: 8, gap: 4 },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCompact: { paddingHorizontal: 8, paddingVertical: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.text,
    maxWidth: 100,
  },
  badgeTextCompact: { fontSize: 10, maxWidth: 72 },
  body: { padding: 16 },
  bodyCompact: { padding: 10 },
  name: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    marginBottom: 6,
  },
  nameCompact: { fontSize: 14, marginBottom: 4 },
  desc: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  locationMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  location: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    flex: 1,
    minWidth: 0,
  },
  locationCompact: { fontSize: 10 },
  whatsappBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  whatsappBtnCompact: { width: 28, height: 28, borderRadius: 14 },
})
