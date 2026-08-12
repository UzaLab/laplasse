import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCartItemCount } from '@/src/hooks/useCartItemCount'
import { colors, fonts, homeLayout } from '@/src/theme'

export function PublicTopBar({
  onBack,
  showCart = true,
}: {
  onBack?: () => void
  showCart?: boolean
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const itemCount = useCartItemCount()

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack ?? (() => router.back())}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={styles.brand}>LaPlasse</Text>

        <View style={styles.right}>
          {showCart ? (
            <Pressable
              onPress={() => router.push('/cart')}
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Panier"
            >
              <Ionicons name="bag-handle-outline" size={22} color={colors.textMuted} />
              {itemCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : (
            <View style={styles.iconBtn} />
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(250, 250, 250, 0.92)',
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: homeLayout.topBarHeight,
    paddingHorizontal: homeLayout.gutter,
  },
  right: { width: 36, alignItems: 'flex-end' },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  pressed: { opacity: 0.75 },
  brand: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.brand600,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    minWidth: 14,
    height: 14,
    paddingHorizontal: 2,
    borderRadius: 7,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: fonts.bold,
  },
})
