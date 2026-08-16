import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, fonts, shadows } from '@/src/theme'

export function SearchResultsShopCard({
  name,
  onPress,
  compact = false,
}: {
  name: string
  onPress: () => void
  compact?: boolean
}) {
  if (compact) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardCompact, pressed && styles.pressed]}>
        <View style={styles.heroCompact}>
          <View style={styles.iconWrapCompact}>
            <Ionicons name="bag-handle-outline" size={28} color={colors.brand700} />
          </View>
          <View style={styles.badgeCompact}>
            <Text style={styles.badgeText}>Boutique</Text>
          </View>
        </View>
        <View style={styles.bodyCompact}>
          <Text style={styles.nameCompact} numberOfLines={2}>{name}</Text>
          <Text style={styles.metaCompact}>Voir l&apos;établissement</Text>
        </View>
      </Pressable>
    )
  }

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
  cardCompact: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    ...shadows.card,
    flex: 1,
  },
  pressed: { opacity: 0.9 },
  heroCompact: {
    height: 144,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconWrapCompact: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  badgeCompact: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: colors.text },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  bodyCompact: { padding: 10, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  nameCompact: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, minHeight: 36 },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  metaCompact: { fontFamily: fonts.regular, fontSize: 10, color: colors.textMuted },
})
