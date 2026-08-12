import { useEffect, useRef } from 'react'
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
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CountrySelect } from '@/src/components/CountrySelect'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, spacing } from '@/src/theme'

const DRAWER_LINKS = [
  { href: '/(tabs)' as const, label: 'Découvrir', icon: 'compass-outline' as const },
  { href: '/(tabs)/marketplace' as const, label: 'Marketplace', icon: 'storefront-outline' as const },
  { href: '/(tabs)/search' as const, label: 'Recherche', icon: 'search-outline' as const },
  { href: '/profile' as const, label: 'Mon espace', icon: 'person-outline' as const },
  { href: '/favoris' as const, label: 'Favoris', icon: 'heart-outline' as const },
]

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.85, 320)

export function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)
  const countryCode = useCountryStore(s => s.countryCode)
  const setCountry = useCountryStore(s => s.setCountry)
  const slideX = useRef(new Animated.Value(DRAWER_WIDTH)).current

  useEffect(() => {
    Animated.timing(slideX, {
      toValue: open ? 0 : DRAWER_WIDTH,
      duration: 260,
      useNativeDriver: true,
    }).start()
  }, [open, slideX])

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Fermer le menu" />
        <Animated.View
          style={[
            styles.panel,
            {
              paddingTop: insets.top,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logoTile}>
              <Ionicons name="location" size={18} color={colors.brand500} />
            </View>
            <Text style={styles.brand}>LaPlasse</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color={colors.slate900} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {DRAWER_LINKS.map(link => (
            <Pressable
              key={link.href}
              style={styles.linkRow}
              onPress={() => {
                onClose()
                router.push(link.href as never)
              }}
            >
              <Ionicons name={link.icon} size={20} color={colors.textMuted} />
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}

          <View style={styles.divider} />

          <CountrySelect
            value={countryCode}
            onChange={code => void setCountry(code)}
          />

          <View style={styles.divider} />

          {isAuthenticated && user ? (
            <>
              <Text style={styles.userName}>{user.full_name ?? user.email}</Text>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  onClose()
                  router.push('/profile/orders' as never)
                }}
              >
                <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
                <Text style={styles.linkText}>Mes commandes</Text>
              </Pressable>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  onClose()
                  router.push('/profile/bookings' as never)
                }}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                <Text style={styles.linkText}>Mes réservations</Text>
              </Pressable>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  onClose()
                  router.push('/profile/settings' as never)
                }}
              >
                <Ionicons name="settings-outline" size={20} color={colors.textMuted} />
                <Text style={styles.linkText}>Paramètres</Text>
              </Pressable>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  onClose()
                  void logout()
                }}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <Text style={[styles.linkText, { color: colors.danger }]}>Déconnexion</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={styles.linkRow}
              onPress={() => {
                onClose()
                router.push('/(auth)/login')
              }}
            >
              <Ionicons name="log-in-outline" size={20} color={colors.brand700} />
              <Text style={[styles.linkText, { color: colors.brand700 }]}>Connexion</Text>
            </Pressable>
          )}
        </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: spacing.gutter,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoTile: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.slate900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.slate900 },
  body: { padding: spacing.gutter, paddingBottom: 40 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  linkText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  userName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
})
