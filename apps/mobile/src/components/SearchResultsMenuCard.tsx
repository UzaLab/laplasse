import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { MenuSearchHit } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { AppImage } from '@/src/components/ui/AppImage'
import { colors, fonts } from '@/src/theme'

export function SearchResultsMenuCard({
  item,
  onPress,
}: {
  item: MenuSearchHit
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {item.image_url ? (
        <AppImage uri={item.image_url} style={styles.image} fallbackLetter={item.name.slice(0, 1)} />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageLetter}>{item.name.slice(0, 1)}</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.merchant.business_name}
          {item.section_name ? ` · ${item.section_name}` : ''}
        </Text>
        <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { opacity: 0.9 },
  image: { width: 72, height: 72, borderRadius: 12 },
  imageFallback: {
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLetter: { fontFamily: fonts.bold, fontSize: 22, color: '#ea580c' },
  body: { flex: 1, justifyContent: 'center', gap: 4 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  price: { fontFamily: fonts.extrabold, fontSize: 14, color: '#ea580c' },
})
