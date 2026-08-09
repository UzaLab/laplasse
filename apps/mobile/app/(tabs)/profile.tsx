import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SUPPORTED_COUNTRIES, getCountryLabel } from '@laplasse/shared-config'
import { PrimaryButton, Screen, SecondaryButton, Title } from '@/src/components/ui'
import { registerForPushNotifications } from '@/src/lib/push'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors } from '@/src/theme'

export default function ProfileScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)
  const countryCode = useCountryStore(s => s.countryCode)
  const setCountry = useCountryStore(s => s.setCountry)

  useEffect(() => {
    if (isAuthenticated) {
      void registerForPushNotifications().catch(() => {})
    }
  }, [isAuthenticated])

  return (
    <Screen>
      <Title>Profil</Title>

      {isAuthenticated && user ? (
        <View style={styles.block}>
          <Text style={styles.label}>Nom</Text>
          <Text style={styles.value}>{user.full_name ?? '—'}</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>
          {user.phone ? (
            <>
              <Text style={styles.label}>Téléphone</Text>
              <Text style={styles.value}>{user.phone}</Text>
            </>
          ) : null}
        </View>
      ) : (
        <>
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
          <SecondaryButton label="Créer un compte" onPress={() => router.push('/(auth)/register')} />
        </>
      )}

      <View style={styles.block}>
        <Text style={styles.section}>Pays · {getCountryLabel(countryCode)}</Text>
        {SUPPORTED_COUNTRIES.map(c => (
          <SecondaryButton
            key={c.code}
            label={c.code === countryCode ? `✓ ${c.label}` : c.label}
            onPress={() => void setCountry(c.code)}
          />
        ))}
      </View>

      {isAuthenticated ? (
        <PrimaryButton label="Se déconnecter" onPress={() => void logout()} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  block: { marginTop: 16, marginBottom: 8 },
  label: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  value: { fontSize: 16, color: colors.text, fontWeight: '500' },
  section: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 8 },
})
