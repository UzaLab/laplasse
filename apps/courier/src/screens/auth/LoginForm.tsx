import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native'
import { personaHomeRoute, resolvePersona } from '@/src/lib/persona'
import { useAuthStore } from '@/src/stores/authStore'
import { colors } from '@/src/theme'
import {
  AUTH_SUBTITLE,
  AuthField,
  authStyles,
} from '@/src/screens/auth/authShared'

export function LoginForm() {
  const router = useRouter()
  const login = useAuthStore(s => s.login)
  const loading = useAuthStore(s => s.loading)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    const result = await login(email.trim(), password)
    if (result.error) {
      setError(result.error)
      return
    }
    const user = useAuthStore.getState().user
    const persona = resolvePersona(user)
    router.replace(personaHomeRoute(persona) as '/(courier)' | '/(partner)' | '/(auth)/welcome')
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
        <Text style={authStyles.fieldLabel}>Mot de passe</Text>
        <View style={authStyles.passwordWrap}>
          <TextInput
            secureTextEntry={!showPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textLight}
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
        onPress={() => void onSubmit()}
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
        Pas encore inscrit ?{' '}
        <Text style={authStyles.switchLink} onPress={() => router.push('/(auth)/register')}>
          Créer un compte
        </Text>
      </Text>

      <View style={authStyles.dividerRow}>
        <View style={authStyles.dividerLine} />
        <Text style={authStyles.dividerText}>ou</Text>
        <View style={authStyles.dividerLine} />
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/signup-courier')}
        style={({ pressed }) => [authStyles.altBtn, pressed && authStyles.pressed]}
      >
        <Ionicons name="bicycle-outline" size={18} color={colors.emerald700} />
        <Text style={authStyles.altBtnText}>Devenir livreur</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>

      <Pressable
        onPress={() => router.push('/(auth)/signup-partner')}
        style={({ pressed }) => [authStyles.altBtn, { marginTop: 10 }, pressed && authStyles.pressed]}
      >
        <Ionicons name="business-outline" size={18} color={colors.partnerAccent} />
        <Text style={authStyles.altBtnText}>Partenaire logistique</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </>
  )
}
