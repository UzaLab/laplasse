import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { colors, fonts, spacing } from '@/src/theme'

interface AppHeaderProps {
  showMenu?: boolean
}

export function AppHeader({ showMenu = true }: AppHeaderProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      <View style={[styles.wrap, { paddingTop: insets.top }]}>
        <View style={styles.row}>
          <Pressable onPress={() => router.push('/(tabs)')} style={styles.brand}>
            <View style={styles.logoTile}>
              <Ionicons name="location" size={18} color={colors.brand500} />
            </View>
            <Text style={styles.brandText}>LaPlasse</Text>
          </Pressable>

          {showMenu ? (
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.pressed]}
              accessibilityLabel="Menu"
            >
              <Ionicons name="menu" size={24} color={colors.slate900} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
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
    paddingHorizontal: spacing.gutter,
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
