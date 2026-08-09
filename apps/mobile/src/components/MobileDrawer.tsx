import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SUPPORTED_COUNTRIES } from '@laplasse/shared-config'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, spacing } from '@/src/theme'

const DRAWER_LINKS = [
  { href: '/(tabs)' as const, label: 'Découvrir', icon: 'compass-outline' as const },
  { href: '/(tabs)/marketplace' as const, label: 'Marketplace', icon: 'storefront-outline' as const },
  { href: '/(tabs)/search' as const, label: 'Recherche', icon: 'search-outline' as const },
  { href: '/(tabs)/profile' as const, label: 'Profil', icon: 'person-outline' as const },
  { href: '/favoris' as const, label: 'Favoris', icon: 'heart-outline' as const },
]

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

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.panel, { paddingTop: insets.top }]}>
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

          <Text style={styles.sectionTitle}>Pays</Text>
          {SUPPORTED_COUNTRIES.map(c => (
            <Pressable
              key={c.code}
              style={styles.linkRow}
              onPress={() => void setCountry(c.code)}
            >
              <Ionicons
                name={c.code === countryCode ? 'checkmark-circle' : 'ellipse-outline'}
                size={20}
                color={c.code === countryCode ? colors.brand600 : colors.textMuted}
              />
              <Text style={styles.linkText}>{c.label}</Text>
            </Pressable>
          ))}

          <View style={styles.divider} />

          {isAuthenticated && user ? (
            <>
              <Text style={styles.userName}>{user.full_name ?? user.email}</Text>
              <Pressable
                style={styles.linkRow}
                onPress={() => {
                  onClose()
                  router.push('/(tabs)/orders')
                }}
              >
                <Ionicons name="receipt-outline" size={20} color={colors.textMuted} />
                <Text style={styles.linkText}>Mes commandes</Text>
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
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15,23,42,0.5)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
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
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  userName: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 8,
  },
})
