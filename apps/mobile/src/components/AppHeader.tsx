import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, fonts } from '@/src/theme'

export function AppHeader() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.brand}>
          <View style={styles.logoTile}>
            <Ionicons name="location" size={18} color={colors.brand500} />
          </View>
          <Text style={styles.brandText}>LaPlasse</Text>
        </View>

        <Pressable
          onPress={() => router.push('/cart')}
          style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
          accessibilityLabel="Panier"
        >
          <Ionicons name="cart-outline" size={24} color={colors.slate900} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.slate900,
    letterSpacing: -0.3,
  },
  menuBtn: { padding: 6, borderRadius: 8 },
  pressed: { opacity: 0.7 },
})
