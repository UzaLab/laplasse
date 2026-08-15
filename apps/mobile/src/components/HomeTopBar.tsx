import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { FullscreenSearchModal } from '@/src/components/FullscreenSearchModal'
import { BrandLogo } from '@/src/components/BrandLogo'
import { colors, fonts, homeLayout } from '@/src/theme'

export function HomeTopBar({
  onOpenMenu,
  onSearchPress,
  isAuthenticated,
  avatarLabel,
}: {
  onOpenMenu: () => void
  /** Override default fullscreen Meilisearch modal */
  onSearchPress?: () => void
  isAuthenticated: boolean
  avatarLabel: string
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const initial = (avatarLabel ?? 'vous').slice(0, 1).toUpperCase()

  const openSearch = () => {
    if (onSearchPress) {
      onSearchPress()
      return
    }
    setSearchOpen(true)
  }

  return (
    <>
      <View style={[styles.wrap, { paddingTop: insets.top }]}>
        <View style={styles.row}>
          <Pressable
            onPress={openSearch}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            accessibilityLabel="Rechercher"
          >
            <Ionicons name="search-outline" size={22} color={colors.textMuted} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)')}
            style={({ pressed }) => [styles.brandWrap, pressed && styles.pressed]}
            accessibilityLabel="Accueil LaPlasse"
          >
            <BrandLogo variant="full" style={styles.brandLogo} />
          </Pressable>

          <View style={styles.right}>
            <Pressable
              onPress={() =>
                router.push(
                  (isAuthenticated ? '/profile/notifications' : '/(tabs)/profile') as never,
                )
              }
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
              accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={onOpenMenu}
              style={({ pressed }) => [styles.avatarBtn, pressed && styles.pressed]}
              accessibilityLabel="Menu compte et pays"
            >
              {isAuthenticated ? (
                <Text style={styles.avatarText}>{initial}</Text>
              ) : (
                <Ionicons name="person-outline" size={18} color={colors.brand700} />
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {!onSearchPress ? (
        <FullscreenSearchModal visible={searchOpen} onClose={() => setSearchOpen(false)} />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: 'rgba(250, 250, 250, 0.92)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: homeLayout.topBarHeight,
    paddingHorizontal: homeLayout.gutter,
  },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.brand100,
    borderWidth: 1,
    borderColor: colors.brand200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand800,
  },
  pressed: { opacity: 0.75 },
  brandWrap: { paddingHorizontal: 4, paddingVertical: 2 },
  brandLogo: { height: 28, width: 110 },
})
