import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getDefaultCity, getCountryLabel } from '@laplasse/shared-config'
import { AppHeader } from '@/src/components/AppHeader'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getMobileAppConfig } from '@/src/config/env'
import { getResolvedApiUrl } from '@/src/lib/api'
import { registerForPushNotifications } from '@/src/lib/push'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

const QUICK_LINKS = [
  { label: 'Mes commandes', icon: 'receipt-outline' as const, href: '/(tabs)/orders' },
  { label: 'Favoris', icon: 'heart-outline' as const, href: '/favoris' },
  { label: 'Paramètres', icon: 'settings-outline' as const, href: '/settings' },
]

export default function ProfileScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)
  const countryCode = useCountryStore(s => s.countryCode)
  const city = getDefaultCity(countryCode)
  const { apiEnvLabel } = getMobileAppConfig()

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications().catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        {isAuthenticated && user ? (
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
        ) : (
          <View style={styles.heroGuest}>
            <Text style={styles.greeting}>Bienvenue sur LaPlasse</Text>
            <Text style={styles.sub}>Connectez-vous pour commander et suivre vos achats.</Text>
            <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
            <SecondaryButton label="Créer un compte" onPress={() => router.push('/(auth)/register')} />
          </View>
        )}

        {isAuthenticated ? (
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
        ) : null}

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

        {isAuthenticated ? (
          <PrimaryButton label="Se déconnecter" onPress={() => void logout()} />
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.gutter,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 16,
  },
  hero: { alignItems: 'center', paddingVertical: 16 },
  heroGuest: { paddingVertical: 8, gap: 8 },
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
  linkDisabled: { color: colors.textMuted },
  soon: { fontFamily: fonts.semibold, fontSize: 11, color: colors.textLight },
  meta: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  metaMuted: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  apiUrl: { fontFamily: fonts.regular, fontSize: 11, color: colors.textLight, marginTop: 4 },
})
