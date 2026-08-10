import { Pressable, StyleSheet, Text, View, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { colors, fonts, homeLayout } from '@/src/theme'

export function NearbyCard({
  merchant,
  onPress,
  width = 280,
}: {
  merchant: ApiMerchant
  onPress: () => void
  width?: number
}) {
  const cover = merchant.cover_image ?? merchant.logo
  const rating = merchant.avg_rating
  const locationLine = [
    merchant.category.name,
    merchant.location?.district ?? merchant.location?.city,
  ]
    .filter(Boolean)
    .join(' • ')

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackLetter}>{merchant.business_name.slice(0, 1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.business_name}
          </Text>
          {rating != null ? (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{locationLine}</Text>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{merchant.category.name}</Text>
          </View>
          {merchant.verification_status === 'VERIFIED' ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Vérifié</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceBright,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  pressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },
  imageWrap: { height: 192 },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    color: colors.primary,
  },
  body: { padding: 16 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.onBackground,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.primary,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.onSurfaceVariant,
    marginBottom: 12,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
  },
  tagText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.tertiary,
  },
})
