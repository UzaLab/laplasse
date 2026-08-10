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

export function RegisterForm({
  onSuccess,
  loginHref = '/(auth)/login',
}: {
  onSuccess?: () => void
  loginHref?: string
}) {
  const router = useRouter()
  const countryCode = useCountryStore(s => s.countryCode) || DEFAULT_COUNTRY

  const register = useAuthStore(s => s.register)
  const loading = useAuthStore(s => s.loading)

  const [fullName, setFullName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPasswordConfirm, setRegPasswordConfirm] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
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

  async function onSubmitRegister() {
    setError(null)
    if (!fullName.trim()) {
      setError('Le nom complet est requis')
      return
    }
    if (!regEmail.trim()) {
      setError("L'email est requis")
      return
    }
    if (!regPhone.trim()) {
      setError('Le numéro de téléphone est requis')
      return
    }
    if (regPhone.replace(/\D/g, '').length < 8) {
      setError('Numéro de téléphone invalide')
      return
    }
    if (regPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (regPassword !== regPasswordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    const result = await register({
      email: regEmail.trim(),
      password: regPassword,
      full_name: fullName.trim(),
      phone: regPhone.trim(),
    })
    if (result.error) {
      setError(result.error)
      return
    }
    handleSuccess()
  }

  return (
    <>
      <View style={authStyles.header}>
        <Text style={authStyles.screenTitle}>Inscription</Text>
        <Text style={authStyles.screenSubtitle}>{AUTH_SUBTITLE}</Text>
      </View>

      {error ? (
        <View style={authStyles.errorBox}>
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthField
        label="Nom complet"
        placeholder="Jean Dupont"
        value={fullName}
        onChangeText={setFullName}
        autoComplete="name"
      />
      <AuthField
        label="Téléphone"
        keyboardType="phone-pad"
        placeholder={phonePlaceholder}
        value={regPhone}
        onChangeText={setRegPhone}
      />
      <AuthField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="votre@email.com"
        value={regEmail}
        onChangeText={setRegEmail}
        autoComplete="email"
      />
      <View style={authStyles.fieldWrap}>
        <Text style={authStyles.fieldLabel}>Mot de passe</Text>
        <View style={authStyles.passwordWrap}>
          <TextInput
            secureTextEntry={!showRegPassword}
            placeholder="8 caractères minimum"
            placeholderTextColor={colors.outlineVariant}
            value={regPassword}
            onChangeText={setRegPassword}
            style={[authStyles.fieldInput, authStyles.passwordInput]}
          />
          <Pressable
            onPress={() => setShowRegPassword(v => !v)}
            style={authStyles.eyeBtn}
            hitSlop={8}
          >
            <Ionicons
              name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </View>
      <AuthField
        label="Confirmer le mot de passe"
        secureTextEntry
        placeholder="••••••••"
        value={regPasswordConfirm}
        onChangeText={setRegPasswordConfirm}
      />

      <Pressable
        onPress={() => void onSubmitRegister()}
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
            <Text style={authStyles.submitBtnText}>Créer mon compte</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </>
        )}
      </Pressable>

      <Text style={authStyles.switchHint}>
        Déjà inscrit ?{' '}
        <Text
          style={authStyles.switchLink}
          onPress={() => router.push(loginHref as never)}
        >
          Se connecter
        </Text>
      </Text>

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
        En vous inscrivant, vous acceptez nos{' '}
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
