import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { DEFAULT_COUNTRY } from '@laplasse/shared-config'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCountryStore } from '@/src/stores/countryStore'
import { colors } from '@/src/theme'
import {
  AUTH_SUBTITLE,
  AuthField,
  authStyles,
  openWebPath,
  PHONE_PLACEHOLDERS,
} from './authShared'

type LoginMethod = 'email' | 'otp'

export function LoginForm({
  onSuccess,
  registerHref = '/(auth)/register',
}: {
  onSuccess?: () => void
  registerHref?: string
}) {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode) || DEFAULT_COUNTRY

  const login = useAuthStore(s => s.login)
  const loginWithOtp = useAuthStore(s => s.loginWithOtp)
  const loading = useAuthStore(s => s.loading)

  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const phonePlaceholder = PHONE_PLACEHOLDERS[countryCode] ?? PHONE_PLACEHOLDERS.CI

  function handleSuccess() {
    if (onSuccess) {
      onSuccess()
      return
    }
    if (router.canGoBack()) {
      router.back()
    }
  }

  async function onSubmitLogin() {
    setError(null)
    const result = await login(email.trim(), password)
    if (result.error) {
      setError(result.error)
      return
    }
    handleSuccess()
  }

  async function onSendOtp() {
    if (!phone.trim()) {
      setError('Entrez votre numéro')
      return
    }
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
    handleSuccess()
  }

  return (
    <>
      <View style={authStyles.header}>
        <Text style={authStyles.screenTitle}>Connexion</Text>
        <Text style={authStyles.screenSubtitle}>{AUTH_SUBTITLE}</Text>
      </View>

      {error ? (
        <View style={authStyles.errorBox}>
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={authStyles.methodToggle}>
        {(['email', 'otp'] as const).map(method => {
          const active = loginMethod === method
          return (
            <Pressable
              key={method}
              onPress={() => {
                setLoginMethod(method)
                setError(null)
                setOtpSent(false)
              }}
              style={[authStyles.methodBtn, active && authStyles.methodBtnActive]}
            >
              <Text style={[authStyles.methodText, active && authStyles.methodTextActive]}>
                {method === 'email' ? 'Email' : 'Téléphone'}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {loginMethod === 'email' ? (
        <>
          <AuthField
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="votre@email.com"
            value={email}
            onChangeText={setEmail}
          />
          <View style={authStyles.fieldWrap}>
            <View style={authStyles.labelRow}>
              <Text style={authStyles.fieldLabel}>Mot de passe</Text>
              <Pressable onPress={() => void openWebPath('/forgot-password', countryCode)}>
                <Text style={authStyles.forgotLink}>Mot de passe oublié ?</Text>
              </Pressable>
            </View>
            <View style={authStyles.passwordWrap}>
              <TextInput
                secureTextEntry={!showPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.outlineVariant}
                value={password}
                onChangeText={setPassword}
                style={[authStyles.fieldInput, authStyles.passwordInput]}
                autoComplete="password"
              />
              <Pressable
                onPress={() => setShowPassword(v => !v)}
                style={authStyles.eyeBtn}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => void onSubmitLogin()}
            disabled={loading}
            style={({ pressed }) => [
              authStyles.submitBtn,
              pressed && authStyles.pressed,
              loading && authStyles.disabled,
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={authStyles.submitBtnText}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </Pressable>

          <Text style={authStyles.switchHint}>
            Pas encore de compte ?{' '}
            <Text
              style={authStyles.switchLink}
              onPress={() => router.push(registerHref as never)}
            >
              S&apos;inscrire
            </Text>
          </Text>
        </>
      ) : (
        <>
          <AuthField
            label="Numéro de téléphone"
            keyboardType="phone-pad"
            placeholder={phonePlaceholder}
            value={phone}
            onChangeText={setPhone}
            editable={!otpSent}
          />

          {devCode ? (
            <View style={authStyles.devBox}>
              <Text style={authStyles.devText}>
                Mode dev : code = <Text style={authStyles.devCode}>{devCode}</Text>
              </Text>
            </View>
          ) : null}

          {otpSent ? (
            <>
              <AuthField
                label="Code OTP (6 chiffres)"
                keyboardType="number-pad"
                placeholder="000000"
                value={otpCode}
                onChangeText={t => setOtpCode(t.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                style={authStyles.otpInput}
              />
              <Pressable
                onPress={() => void onVerifyOtp()}
                disabled={loading || otpCode.length !== 6}
                style={({ pressed }) => [
                  authStyles.submitBtn,
                  pressed && authStyles.pressed,
                  (loading || otpCode.length !== 6) && authStyles.disabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={authStyles.submitBtnText}>Se connecter</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={() => void onSendOtp()}
              disabled={sendingOtp}
              style={({ pressed }) => [
                authStyles.submitBtn,
                pressed && authStyles.pressed,
                sendingOtp && authStyles.disabled,
              ]}
            >
              {sendingOtp ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="phone-portrait-outline" size={18} color="#fff" />
                  <Text style={authStyles.submitBtnText}>Recevoir le code</Text>
                </>
              )}
            </Pressable>
          )}
        </>
      )}

      <View style={authStyles.dividerRow}>
        <View style={authStyles.dividerLine} />
        <Text style={authStyles.dividerText}>ou</Text>
        <View style={authStyles.dividerLine} />
      </View>

      <Pressable
        onPress={() => void openWebPath('/merchant/signup', countryCode)}
        style={({ pressed }) => [authStyles.merchantBtn, pressed && authStyles.pressed]}
      >
        <Ionicons name="storefront-outline" size={18} color={colors.text} />
        <Text style={authStyles.merchantBtnText}>Inscrire mon établissement</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <Text style={authStyles.legal}>
        En vous connectant, vous acceptez nos{' '}
        <Text style={authStyles.legalLink} onPress={() => void openWebPath('/terms', countryCode)}>
          CGU
        </Text>
        {' '}et notre{' '}
        <Text style={authStyles.legalLink} onPress={() => void openWebPath('/privacy', countryCode)}>
          politique de confidentialité
        </Text>
        .
      </Text>
    </>
  )
}
