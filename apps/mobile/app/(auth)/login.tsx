import { Link, useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { getApiClient } from '@/src/lib/api'
import { FieldInput, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts } from '@/src/theme'

type LoginMode = 'email' | 'otp'

export default function LoginScreen() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const loginWithOtp = useAuthStore(s => s.loginWithOtp)
  const loading = useAuthStore(s => s.loading)

  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)

  async function onSubmitEmail() {
    setError(null)
    const result = await login(email.trim(), password)
    if (result.error) {
      setError(result.error)
      return
    }
    router.back()
  }

  async function onSendOtp() {
    setError(null)
    setSendingOtp(true)
    try {
      const res = await getApiClient().sendOtp(phone.trim())
      setOtpSent(true)
      if (res.dev_code) setDevCode(res.dev_code)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi OTP impossible')
    } finally {
      setSendingOtp(false)
    }
  }

  async function onVerifyOtp() {
    setError(null)
    const result = await loginWithOtp(phone.trim(), otpCode.trim())
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

      <View style={styles.tabs}>
        {(['email', 'otp'] as const).map(key => (
          <Pressable
            key={key}
            onPress={() => {
              setMode(key)
              setError(null)
              setOtpSent(false)
            }}
            style={[styles.tab, mode === key && styles.tabActive]}
          >
            <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>
              {key === 'email' ? 'Email' : 'Téléphone'}
            </Text>
          </Pressable>
        ))}
      </View>

      {mode === 'email' ? (
        <>
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
          <PrimaryButton label="Se connecter" onPress={() => void onSubmitEmail()} loading={loading} />
        </>
      ) : (
        <>
          <FieldInput
            keyboardType="phone-pad"
            placeholder="Numéro de téléphone"
            value={phone}
            onChangeText={setPhone}
            editable={!otpSent}
          />
          {otpSent ? (
            <>
              <FieldInput
                keyboardType="number-pad"
                placeholder="Code OTP (6 chiffres)"
                value={otpCode}
                onChangeText={t => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
              {devCode ? (
                <Text style={styles.devCode}>Code dev : {devCode}</Text>
              ) : null}
              <PrimaryButton
                label="Vérifier le code"
                onPress={() => void onVerifyOtp()}
                loading={loading}
                disabled={otpCode.length !== 6}
              />
            </>
          ) : (
            <PrimaryButton label="Recevoir un code" onPress={() => void onSendOtp()} loading={sendingOtp} />
          )}
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}

      <Link href="/(auth)/register" style={styles.link}>
        <Text style={styles.linkText}>Créer un compte</Text>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  tabText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  tabTextActive: { color: '#fff' },
  error: { color: colors.danger, marginBottom: 8 },
  devCode: { fontFamily: fonts.medium, fontSize: 12, color: colors.brand700, marginBottom: 8 },
  link: { marginTop: 16, alignSelf: 'center' },
  linkText: { color: colors.primary, fontWeight: '600' },
})
