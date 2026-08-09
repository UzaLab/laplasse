import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function NearbyCard({
  merchant,
  onPress,
  width,
}: {
  merchant: ApiMerchant
  onPress: () => void
  width?: number
}) {
  const cover = merchant.cover_image ?? merchant.logo

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        width != null ? { width } : styles.cardFull,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackLetter}>{merchant.business_name.slice(0, 1)}</Text>
          </View>
        )}
        {merchant.location?.district ? (
          <View style={styles.districtBadge}>
            <Ionicons name="location" size={11} color="#fff" />
            <Text style={styles.districtText}>{merchant.location.district}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.business_name}
          </Text>
          {merchant.verification_status === 'VERIFIED' ? (
            <Ionicons name="checkmark-circle" size={16} color={colors.textMuted} />
          ) : null}
        </View>
        <Text style={styles.meta} numberOfLines={1}>
          {merchant.category.name}
          {merchant.location?.city ? ` · ${merchant.location.city}` : ''}
        </Text>
        {merchant.review_count > 0 ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={colors.text} />
            <Text style={styles.ratingText}>{merchant.review_count} avis</Text>
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
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.card,
  },
  cardFull: { width: '100%' },
  pressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  imageWrap: { height: 160, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackLetter: {
    fontFamily: fonts.extrabold,
    fontSize: 40,
    color: colors.brand700,
  },
  districtBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15,23,42,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  districtText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 11,
  },
  body: { padding: 14 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
  },
})
