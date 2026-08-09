import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCartItemCount } from '@/src/hooks/useCartItemCount'
import { colors, fonts, layout } from '@/src/theme'

type TabBarProps = {
  state: { index: number; routes: { name: string; key: string }[] }
  navigation: { navigate: (name: string) => void }
}

type NavKey = 'index' | 'marketplace' | 'search' | 'profile'

const NAV_ITEMS: {
  route: NavKey
  label: string
  icon: keyof typeof Ionicons.glyphMap
  iconActive: keyof typeof Ionicons.glyphMap
}[] = [
  { route: 'index', label: 'Découvrir', icon: 'compass-outline', iconActive: 'compass' },
  { route: 'marketplace', label: 'Marketplace', icon: 'storefront-outline', iconActive: 'storefront' },
  { route: 'search', label: 'Recherche', icon: 'search-outline', iconActive: 'search' },
  { route: 'profile', label: 'Profil', icon: 'person-outline', iconActive: 'person' },
]

export function MobileBottomNav({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const itemCount = useCartItemCount()

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <View style={styles.inner}>
        {NAV_ITEMS.map(item => {
          const routeIndex = state.routes.findIndex(r => r.name === item.route)
          const focused = state.index === routeIndex
          const color = focused ? colors.slate900 : colors.textLight

          return (
            <Pressable
              key={item.route}
              onPress={() => navigation.navigate(item.route)}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
            >
              <Ionicons
                name={focused ? item.iconActive : item.icon}
                size={20}
                color={color}
              />
              <Text style={[styles.label, focused && styles.labelActive]}>{item.label}</Text>
            </Pressable>
          )
        })}

        <Pressable
          onPress={() => router.push('/cart')}
          style={styles.tab}
          accessibilityLabel="Panier"
        >
          <View>
            <Ionicons name="bag-handle-outline" size={20} color={colors.textLight} />
            {itemCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.label}>Panier</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: layout.bottomNavHeight,
  },
  tab: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  label: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.textLight,
  },
  labelActive: {
    color: colors.slate900,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
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
