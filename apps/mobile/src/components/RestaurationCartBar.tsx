import { useRouter } from 'expo-router'
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCartItemCount } from '@/src/hooks/useCartItemCount'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

export function RestaurationCartBar() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const count = useCartItemCount()
  const clearCart = useCartStore(s => s.clear)
  const clearing = useCartStore(s => s.loading)

  if (count <= 0) return null

  const handleClear = () => {
    Alert.alert('Vider le panier', 'Retirer tous les articles du panier ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Vider',
        style: 'destructive',
        onPress: () => void clearCart(),
      },
    ])
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable
        onPress={() => router.push('/commande' as never)}
        style={({ pressed }) => [styles.mainBtn, pressed && styles.pressed]}
        accessibilityLabel={`Voir le panier, ${count} article${count > 1 ? 's' : ''}`}
      >
        <Ionicons name="bag-outline" size={18} color={colors.brand800} />
        <Text style={styles.mainLabel}>Voir ma commande</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={handleClear}
        disabled={clearing}
        style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}
        accessibilityLabel="Vider le panier"
      >
        <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 10,
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  mainBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand200,
  },
  mainLabel: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.brand800,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: '#fff',
  },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.88 },
})
