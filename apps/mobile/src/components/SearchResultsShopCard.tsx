import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts } from '@/src/theme'

export function SearchResultsShopCard({
  name,
  onPress,
}: {
  name: string
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Ionicons name="bag-handle-outline" size={22} color={colors.brand700} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{name}</Text>
        <Text style={styles.meta}>Boutique marketplace</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  pressed: { opacity: 0.9 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
})
