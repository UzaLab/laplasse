import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { FieldInput, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'

export default function RegisterScreen() {
  const router = useRouter()
  const register = useAuthStore(s => s.register)
  const loading = useAuthStore(s => s.loading)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    const result = await register({
      email: email.trim(),
      password,
      full_name: fullName.trim(),
      phone: phone.trim(),
    })
    if (result.error) {
      setError(result.error)
      return
    }
    router.back()
  }

  return (
    <Screen>
      <Title>Inscription</Title>
      <Subtitle>Créez votre compte consommateur</Subtitle>
      <FieldInput placeholder="Nom complet" value={fullName} onChangeText={setFullName} />
      <FieldInput placeholder="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <FieldInput
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <FieldInput secureTextEntry placeholder="Mot de passe (8+)" value={password} onChangeText={setPassword} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Créer mon compte" onPress={() => void onSubmit()} loading={loading} />
      <Link href="/(auth)/login" style={styles.link}>
        <Text style={styles.linkText}>Déjà inscrit ? Se connecter</Text>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.danger, marginBottom: 8 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.primary, fontWeight: '600' },
})
