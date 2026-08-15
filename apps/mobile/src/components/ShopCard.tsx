import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { MarketplaceSpotlightShop } from '@laplasse/api-client'
import { AppImage } from '@/src/components/ui/AppImage'
import { colors, fonts, radii, shadows } from '@/src/theme'

export function ShopCard({
  shop,
  onPress,
  width = 120,
}: {
  shop: MarketplaceSpotlightShop
  onPress: () => void
  width?: number
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.pressed]}
    >
      <AppImage
        uri={shop.logo}
        style={styles.logo}
        fallbackLetter={shop.business_name.slice(0, 1)}
      />
      <Text style={styles.name} numberOfLines={2}>{shop.business_name}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand50,
  },
  letter: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: colors.brand700,
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
  },
})
