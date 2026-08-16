import { Ionicons } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'
import { useEffect, useRef, useState, type ReactNode } from 'react'
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
import { BrandLogo } from '@/src/components/BrandLogo'
import { CourierAvatar } from '@/src/components/CourierAvatar'
import {
  COURIER_MAIN_NAV,
  isCourierNavActive,
} from '@/src/lib/courierNav'
import {
  COURIER_STATUS_LABELS,
  COURIER_STATUS_STYLES,
  type CourierStatus,
} from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, shadows } from '@/src/theme'

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.82, 300)

export function CourierPageHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <View style={styles.pageHeader}>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  )
}

function CourierNavDrawer({
  visible,
  onClose,
  pathname,
}: {
  visible: boolean
  onClose: () => void
  pathname: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const profile = user?.courier_profile
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus
  const statusStyle = COURIER_STATUS_STYLES[status]
  const slideX = useRef(new Animated.Value(-DRAWER_WIDTH)).current

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start()
  }, [visible, slideX])

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer le menu" />
        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          <View style={styles.drawerBrand}>
            <BrandLogo style={styles.drawerLogo} />
            <Text style={styles.drawerBrandSub}>Espace livreur</Text>
          </View>

          {profile ? (
            <View style={styles.drawerStatusCard}>
              <Text style={styles.drawerStatusLabel}>Statut</Text>
              <View style={[styles.statusBadge, statusStyle.container]}>
                <Text style={[styles.statusBadgeText, statusStyle.text]}>
                  {COURIER_STATUS_LABELS[status]}
                </Text>
              </View>
              <Text style={styles.drawerCity}>{profile.city}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.drawerNav} showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerNavGroup}>Livraisons</Text>
            {COURIER_MAIN_NAV.map(item => {
              const active = isCourierNavActive(pathname, item.href)
              return (
                <Pressable
                  key={item.href}
                  onPress={() => {
                    onClose()
                    router.push(item.href)
                  }}
                  style={[styles.drawerLink, active && styles.drawerLinkActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={17}
                    color={active ? colors.emerald500 : colors.textMuted}
                  />
                  <Text style={[styles.drawerLinkText, active && styles.drawerLinkTextActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Pressable
            style={styles.logoutBtn}
            onPress={() => {
              onClose()
              void logout().then(() => router.replace('/(auth)/login'))
            }}
          >
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
            <Text style={styles.logoutText}>Déconnexion</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

export function CourierShell({
  children,
  showBack,
}: {
  children: ReactNode
  showBack?: boolean
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore(s => s.user)
  const refreshUser = useAuthStore(s => s.refreshUser)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <View style={styles.topBarRow}>
          <View style={styles.topBarLeft}>
            {showBack ? (
              <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setDrawerOpen(true)}
                style={styles.iconBtn}
                accessibilityLabel="Ouvrir le menu"
              >
                <Ionicons name="menu" size={24} color={colors.text} />
              </Pressable>
            )}
            {!showBack ? <BrandLogo style={styles.topBarLogo} /> : null}
          </View>

          <View style={styles.topBarActions}>
            <Pressable
              style={styles.iconBtn}
              accessibilityLabel="Notifications"
              onPress={() => router.push('/(courier)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.textMuted} />
              <View style={styles.notifDot} />
            </Pressable>
            <Pressable onPress={() => router.push('/(courier)/profile')} accessibilityLabel="Profil">
              <CourierAvatar user={user} size={36} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.body}>{children}</View>

      <CourierNavDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        pathname={pathname}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    backgroundColor: colors.background,
  },
  topBarRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.pageGutter,
    paddingVertical: 8,
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  topBarLogo: { height: 26, width: 110 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  body: { flex: 1 },
  pageHeader: { gap: 4, marginBottom: 4 },
  pageTitle: { fontFamily: fonts.extrabold, fontSize: 26, color: colors.text, lineHeight: 32 },
  pageSubtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  modalRoot: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15,23,42,0.5)' },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    ...shadows.card,
  },
  drawerBrand: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 4,
  },
  drawerLogo: { height: 28, width: 120 },
  drawerBrandSub: { fontFamily: fonts.medium, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  drawerStatusCard: {
    marginHorizontal: 12,
    marginTop: 16,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald100,
  },
  drawerStatusLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.emerald700,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  drawerCity: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text, marginTop: 8 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusBadgeText: { fontFamily: fonts.bold, fontSize: 12 },
  drawerNav: { flex: 1, paddingHorizontal: 12, paddingTop: 16 },
  drawerNavGroup: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  drawerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  drawerLinkActive: { backgroundColor: colors.slate900 },
  drawerLinkText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.textMuted },
  drawerLinkTextActive: { color: '#fff' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
})
