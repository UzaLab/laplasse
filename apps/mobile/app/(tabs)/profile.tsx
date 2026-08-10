import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { getDefaultCity, getCountryLabel } from '@laplasse/shared-config'
import { HomeTopBar } from '@/src/components/HomeTopBar'
import { MobileDrawer } from '@/src/components/MobileDrawer'
import { PrimaryButton } from '@/src/components/ui'
import { getMobileAppConfig } from '@/src/config/env'
import { getResolvedApiUrl } from '@/src/lib/api'
import { registerForPushNotifications } from '@/src/lib/push'
import { LoginForm } from '@/src/screens/auth/LoginForm'
import { AUTH_HORIZONTAL_PADDING } from '@/src/screens/auth/authShared'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, homeLayout, layout, spacing } from '@/src/theme'

const QUICK_LINKS = [
  { label: 'Mes commandes', icon: 'receipt-outline' as const, href: '/(tabs)/orders' },
  { label: 'Favoris', icon: 'heart-outline' as const, href: '/favoris' },
  { label: 'Paramètres', icon: 'settings-outline' as const, href: '/settings' },
]

function greetingName(fullName: string | null | undefined, email: string | undefined): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0] ?? fullName
  if (email) return email.split('@')[0] ?? 'vous'
  return 'vous'
}

export default function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const { apiEnvLabel } = getMobileAppConfig()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications().catch(() => {})
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    const scrollTopPad = insets.top + homeLayout.topBarHeight + 16

    return (
      <View style={styles.root}>
        <HomeTopBar
          onOpenMenu={() => setDrawerOpen(true)}
          isAuthenticated={false}
          avatarLabel="vous"
        />
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <ScrollView
          contentContainerStyle={[
            styles.guestScroll,
            {
              paddingTop: scrollTopPad,
              paddingBottom: insets.bottom + layout.bottomNavInset,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LoginForm registerHref="/(auth)/register" />
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <HomeTopBar
        onOpenMenu={() => setDrawerOpen(true)}
        isAuthenticated={isAuthenticated}
        avatarLabel={greetingName(user?.full_name, user?.email)}
      />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + homeLayout.topBarHeight + 16 },
        ]}
      >
        {user ? (
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user.full_name ?? user.email).slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.greeting}>
              Bonjour, {user.full_name?.split(' ')[0] ?? 'toi'} 👋
            </Text>
            <Text style={styles.sub}>{user.email}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {QUICK_LINKS.map(link => (
            <Pressable
              key={link.label}
              style={styles.linkRow}
              onPress={() => {
                if (link.href) router.push(link.href as never)
              }}
              disabled={!link.href}
            >
              <Ionicons name={link.icon} size={20} color={colors.textMuted} />
              <Text style={styles.linkText}>{link.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Localisation</Text>
          <Text style={styles.meta}>
            {getCountryLabel(countryCode)} · {city}
          </Text>
          <Text style={styles.metaMuted}>Modifiable via le menu ☰</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Environnement</Text>
          <Text style={styles.meta}>{apiEnvLabel}</Text>
          <Text style={styles.apiUrl} numberOfLines={1}>{getResolvedApiUrl()}</Text>
        </View>

        <PrimaryButton label="Se déconnecter" onPress={() => void logout()} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9f9f9' },
  guestScroll: {
    flexGrow: 1,
    paddingHorizontal: AUTH_HORIZONTAL_PADDING,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  content: {
    padding: spacing.gutter,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 16,
  },
  hero: { alignItems: 'center', paddingVertical: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.brand800 },
  greeting: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  linkText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  meta: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  metaMuted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  apiUrl: { fontFamily: fonts.regular, fontSize: 11, color: colors.textLight, marginTop: 4 },
})
