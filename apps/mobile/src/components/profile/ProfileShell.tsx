import { useRouter, usePathname } from 'expo-router'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getDefaultCity } from '@laplasse/shared-config'
import {
  PROFILE_MAIN_NAV,
  profileNavLabel,
  resolveProfileNavId,
} from '@/src/lib/profileNav'
import { profileTheme } from '@/src/lib/profileTheme'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { MobileBottomNavBar } from '@/src/components/MobileBottomNav'
import { BrandLogo } from '@/src/components/BrandLogo'
import { layout } from '@/src/theme'

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 300)

interface ProfileShellContextValue {
  openNav: () => void
}

const ProfileShellContext = createContext<ProfileShellContextValue>({ openNav: () => {} })

export function useProfileShell() {
  return useContext(ProfileShellContext)
}

function ProfileNavDrawer({
  visible,
  onClose,
  activeId,
}: {
  visible: boolean
  onClose: () => void
  activeId: ReturnType<typeof resolveProfileNavId>
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const countryCode = useCountryStore(s => s.countryCode)
  const exploreLabel = `Explorer ${getDefaultCity(countryCode)}`
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start()
  }, [visible, slideX])

  const roleLabel: Record<string, string> = {
    ADMIN: 'Admin',
    SUPER_ADMIN: 'Super Admin',
    MERCHANT: 'Marchand',
    USER: 'Membre',
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer le menu" />
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top,
              paddingBottom: insets.bottom + 12,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={styles.drawerHeader}>
            <View style={styles.logoRow}>
              <BrandLogo variant="full" style={styles.logoFull} />
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={22} color={profileTheme.textLight} />
            </Pressable>
          </View>

          {user ? (
            <View style={styles.userRow}>
              <View style={styles.userAvatar}>
                <Text style={styles.userAvatarText}>
                  {(user.full_name ?? user.email).slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.full_name ?? user.email}
                </Text>
                <Text style={styles.userRole}>{roleLabel[user.role] ?? 'Membre'}</Text>
              </View>
            </View>
          ) : null}

          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            {PROFILE_MAIN_NAV.map(item => {
              const active = item.id === activeId
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    onClose()
                    router.push(item.href as never)
                  }}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? profileTheme.navIconActive : profileTheme.navInactiveText}
                  />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}

            <View style={styles.divider} />

            <Pressable
              onPress={() => {
                onClose()
                router.push('/(tabs)/search' as never)
              }}
              style={styles.navItem}
            >
              <Ionicons name="compass-outline" size={18} color={profileTheme.navInactiveText} />
              <Text style={styles.navLabel}>{exploreLabel}</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.drawerFooter}>
            <Pressable
              onPress={() => {
                onClose()
                void logout()
                router.replace('/(tabs)/profile' as never)
              }}
              style={styles.logoutBtn}
            >
              <Ionicons name="log-out-outline" size={18} color={profileTheme.danger} />
              <Text style={styles.logoutText}>Déconnexion</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

export function ProfileShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [navOpen, setNavOpen] = useState(false)
  const activeId = resolveProfileNavId(pathname ?? '/profile')
  const pageLabel = profileNavLabel(activeId)

  return (
    <ProfileShellContext.Provider value={{ openNav: () => setNavOpen(true) }}>
      <View style={styles.root}>
        <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => setNavOpen(true)} style={styles.menuBtn} hitSlop={8}>
            <Ionicons name="menu" size={22} color={profileTheme.textMuted} />
          </Pressable>
          <View style={styles.topbarTitleWrap}>
            <Text style={styles.topbarTitle} numberOfLines={1}>
              {pageLabel}
            </Text>
          </View>
          <View style={styles.topbarActions}>
            <Pressable
              onPress={() => router.push('/(tabs)/search' as never)}
              style={styles.exploreBtn}
            >
              <Ionicons name="compass-outline" size={16} color={profileTheme.accent} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/profile/notifications' as never)}
              style={styles.notifBtn}
            >
              <Ionicons name="notifications-outline" size={20} color={profileTheme.textMuted} />
            </Pressable>
          </View>
        </View>

        <View style={styles.content}>{children}</View>

        <MobileBottomNavBar activeRoute="profile" />

        <ProfileNavDrawer
          visible={navOpen}
          onClose={() => setNavOpen(false)}
          activeId={activeId}
        />
      </View>
    </ProfileShellContext.Provider>
  )
}

export function ProfileScreenScroll({
  children,
  bottomInset = layout.bottomNavInset + 24,
}: {
  children: ReactNode
  bottomInset?: number
}) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset }]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: profileTheme.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: profileTheme.borderLight,
  },
  menuBtn: { width: 36, alignItems: 'center' },
  topbarTitleWrap: { flex: 1, minWidth: 0, justifyContent: 'center' },
  topbarTitle: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 17,
    color: profileTheme.text,
  },
  topbarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  exploreBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: profileTheme.accentLight,
  },
  notifBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16 },

  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: profileTheme.surface,
    borderRightWidth: 1,
    borderRightColor: profileTheme.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: profileTheme.borderLight,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoFull: { height: 28, width: 120 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: profileTheme.borderLight,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: profileTheme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 16,
    color: profileTheme.accent,
  },
  userInfo: { flex: 1, minWidth: 0 },
  userName: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: profileTheme.text,
  },
  userRole: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 12,
    color: profileTheme.textMuted,
    marginTop: 2,
  },
  navScroll: { flex: 1, paddingHorizontal: 10, paddingTop: 8 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: profileTheme.navRadius,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: profileTheme.navActiveBg,
  },
  navLabel: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 14,
    color: profileTheme.navInactiveText,
  },
  navLabelActive: {
    color: profileTheme.navActiveText,
  },
  divider: {
    height: 1,
    backgroundColor: profileTheme.borderLight,
    marginVertical: 10,
    marginHorizontal: 8,
  },
  drawerFooter: {
    borderTopWidth: 1,
    borderTopColor: profileTheme.borderLight,
    padding: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
  },
  logoutText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: profileTheme.danger,
  },
})
