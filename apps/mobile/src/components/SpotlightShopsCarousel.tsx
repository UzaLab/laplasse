import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { MarketplaceSpotlightShop } from '@laplasse/api-client'
import { AppImage } from '@/src/components/ui/AppImage'
import { HorizontalCarousel } from '@/src/components/HorizontalCarousel'
import { colors, fonts } from '@/src/theme'

export function SpotlightShopsCarousel({
  shops,
  onPressShop,
  contentContainerStyle,
}: {
  shops: MarketplaceSpotlightShop[]
  onPressShop: (slug: string) => void
  contentContainerStyle?: import('react-native').ViewStyle
}) {
  if (shops.length === 0) return null

  return (
    <HorizontalCarousel
      data={shops}
      keyExtractor={s => s.id}
      itemWidth={100}
      gap={16}
      contentContainerStyle={contentContainerStyle}
      renderItem={shop => (
        <Pressable
          onPress={() => onPressShop(shop.slug)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.logoWrap}>
            <View style={styles.logoInner}>
              {shop.logo ? (
                <AppImage uri={shop.logo} style={styles.logo} fallbackLetter={shop.business_name.slice(0, 1)} />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Ionicons name="storefront-outline" size={24} color={colors.textLight} />
                </View>
              )}
            </View>
            {shop.is_sponsored ? (
              <View style={styles.sponsored}>
                <Ionicons name="sparkles" size={10} color="#fff" />
              </View>
            ) : null}
          </View>
          <Text style={styles.label} numberOfLines={2}>
            {shop.business_name}
          </Text>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  item: { width: 100, alignItems: 'center', gap: 10 },
  pressed: { opacity: 0.9 },
  logoWrap: { position: 'relative' },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: colors.surfaceBright,
    borderWidth: 2,
    borderColor: colors.border,
    padding: 4,
  },
  logo: { width: '100%', height: '100%', borderRadius: 12 },
  logoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  sponsored: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: '#fbbf24',
    borderWidth: 2,
    borderColor: colors.surfaceBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 16,
  },
})
