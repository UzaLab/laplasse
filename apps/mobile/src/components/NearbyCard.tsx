import { Pressable, StyleSheet, Text, View } from 'react-native'
import { AppImage } from '@/src/components/ui/AppImage'
import { Ionicons } from '@expo/vector-icons'
import type { ApiMerchant } from '@laplasse/api-client'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { MerchantCardPreview } from '@/src/components/MerchantCardPreview'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout } from '@/src/theme'

export function NearbyCard({
  merchant,
  onPress,
  onPressProduct,
  onPressVertical,
  width = 280,
}: {
  merchant: ApiMerchant
  onPress: () => void
  onPressProduct?: (merchantSlug: string, productSlug: string) => void
  onPressVertical?: (merchantSlug: string, tab: string) => void
  width?: number
}) {
  const cover = merchant.cover_image ?? merchant.logo
  const locationLine = [merchant.category.name, merchant.location?.city].filter(Boolean).join(' · ')
  const previewTags = (merchant.tags ?? []).filter(t => t !== 'WhatsApp')
  const hasFooter = Boolean(merchant.whatsapp || previewTags.length > 0)

  return (
    <View style={[styles.card, { width }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={styles.imageWrap}>
          {cover ? (
            <AppImage uri={cover} style={styles.image} fallbackLetter={merchant.business_name.slice(0, 1)} />
          ) : (
            <View style={[styles.image, styles.imageFallback]}>
              <Text style={styles.fallbackLetter}>{merchant.business_name.slice(0, 1)}</Text>
            </View>
          )}

          <View style={styles.favoriteWrap} pointerEvents="box-none">
            <FavoriteButton merchantId={merchant.id} size={18} color={colors.onBackground} />
          </View>

          {merchant.location?.district ? (
            <View style={styles.districtBadge}>
              <Ionicons name="location" size={11} color="#fff" />
              <Text style={styles.districtText}>{merchant.location.district}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {merchant.business_name}
              </Text>
              {merchant.verification_status === 'VERIFIED' ? (
                <Ionicons name="checkmark-circle" size={16} color={colors.onSurfaceVariant} style={styles.verifiedIcon} />
              ) : null}
            </View>
            {merchant.review_count > 0 ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={12} color={colors.onSurfaceVariant} />
                <Text style={styles.ratingText}>{merchant.review_count}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.meta} numberOfLines={1}>{locationLine}</Text>
        </View>
      </Pressable>

      {(merchant.featured_product || merchant.featured_vertical) && onPressProduct && onPressVertical ? (
        <View style={styles.previewWrap}>
          <MerchantCardPreview
            merchant={merchant}
            onPressProduct={onPressProduct}
            onPressVertical={onPressVertical}
          />
        </View>
      ) : null}

      {hasFooter ? (
        <View style={styles.footer}>
          {merchant.whatsapp ? (
            <Pressable
              onPress={() => openWhatsApp(merchant.whatsapp!)}
              style={styles.whatsappChip}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#047857" />
              <Text style={styles.whatsappText}>WhatsApp</Text>
            </Pressable>
          ) : null}
          {previewTags.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text style={styles.tagChipText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
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
  imageWrap: { height: 160, position: 'relative' },
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
  favoriteWrap: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  districtBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.72)',
  },
  districtText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: '#fff',
  },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  nameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.onBackground,
  },
  verifiedIcon: { flexShrink: 0 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.onSurfaceVariant,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.onSurfaceVariant,
  },
  previewWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  whatsappChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
  },
  whatsappText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: '#047857',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainer,
  },
  tagChipText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
})
