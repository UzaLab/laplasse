import { StyleSheet, Text, View } from 'react-native'
import type { ProductPromotionBadge } from '@laplasse/api-client'
import { isProductBestSeller, isProductNew } from '@/src/lib/productBadges'
import { getPromoBadgeLabel } from '@/src/lib/productPromoUtils'
import { colors, fonts } from '@/src/theme'

export function ProductCardBadges({
  promotion,
  createdAt,
  isBestSeller,
  salesCount,
  showBestSeller = false,
}: {
  promotion?: ProductPromotionBadge | null
  createdAt?: string | null
  isBestSeller?: boolean
  salesCount?: number
  showBestSeller?: boolean
}) {
  const promoBadge = promotion ? getPromoBadgeLabel(promotion) : null
  const isNew = isProductNew(createdAt)
  const bestSeller =
    showBestSeller || isProductBestSeller({ is_best_seller: isBestSeller, sales_count: salesCount })

  const label = promoBadge ?? (isNew && !promoBadge ? 'Nouveau' : null) ?? (bestSeller && !promoBadge && !isNew ? 'Best-seller' : null)
  if (!label) return null

  const variant = promoBadge ? 'promo' : isNew ? 'new' : 'bestSeller'

  return (
    <View style={[styles.badge, variant === 'promo' && styles.badgePromo, variant === 'new' && styles.badgeNew]}>
      <Text style={[styles.text, variant === 'promo' && styles.textPromo, variant === 'new' && styles.textNew]}>
        {label.toUpperCase()}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePromo: {
    backgroundColor: colors.slate900,
  },
  badgeNew: {
    backgroundColor: colors.emerald50,
  },
  text: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.onPrimaryContainer,
    letterSpacing: 0.8,
  },
  textPromo: {
    color: colors.brand500,
  },
  textNew: {
    color: colors.emerald700,
  },
})
