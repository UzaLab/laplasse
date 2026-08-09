import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { FieldInput, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const loading = useAuthStore(s => s.loading)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    const result = await login(email.trim(), password)
    if (result.error) {
      setError(result.error)
      return
    }
    router.back()
  }

  return (
    <Screen>
      <Title>Connexion</Title>
      <Subtitle>Accédez à votre compte LaPlasse</Subtitle>
      <FieldInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <FieldInput
        secureTextEntry
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Se connecter" onPress={() => void onSubmit()} loading={loading} />
      <Link href="/(auth)/register" style={styles.link}>
        <Text style={styles.linkText}>Créer un compte</Text>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.primary, fontWeight: '600' },
})
