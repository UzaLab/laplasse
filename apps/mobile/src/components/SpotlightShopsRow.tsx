import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { MarketplaceSpotlightShop } from '@laplasse/api-client'
import { colors, fonts, radii } from '@/src/theme'

export function SpotlightShopsRow({
  shops,
  onPressShop,
}: {
  shops: MarketplaceSpotlightShop[]
  onPressShop: (slug: string) => void
}) {
  if (shops.length === 0) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      {shops.map(shop => (
        <Pressable
          key={shop.id}
          onPress={() => onPressShop(shop.slug)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <View style={styles.logoWrap}>
            {shop.logo ? (
              <Image source={{ uri: shop.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logo, styles.logoFallback]}>
                <Ionicons name="storefront-outline" size={24} color={colors.textLight} />
              </View>
            )}
            {shop.is_sponsored ? (
              <View style={styles.sparkle}>
                <Ionicons name="sparkles" size={10} color={colors.brand700} />
              </View>
            ) : null}
          </View>
          <Text style={styles.name} numberOfLines={2}>{shop.business_name}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 4,
  },
  item: {
    width: 88,
    alignItems: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.85 },
  logoWrap: { position: 'relative' },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radii.field,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerLow,
  },
  sparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 14,
  },
})
