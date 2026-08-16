import { Redirect, useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts } from '@/src/theme'

export default function WelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const hydrated = useAuthStore(s => s.hydrated)

  if (!hydrated) return null
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />

  return (
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Choisissez votre profil</Text>
      <Text style={styles.subtitle}>
        Inscrivez-vous comme livreur indépendant ou partenaire logistique pour gérer une flotte.
      </Text>

      <View style={styles.actions}>
        <PrimaryButton label="Devenir livreur" onPress={() => router.push('/(auth)/signup-courier')} />
        <PrimaryButton
          label="Partenaire logistique"
          variant="partner"
          onPress={() => router.push('/(auth)/signup-partner')}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, justifyContent: 'center', gap: 16 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted, lineHeight: 24 },
  actions: { gap: 12, marginTop: 16 },
})
