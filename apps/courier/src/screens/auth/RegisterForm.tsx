import { Redirect, useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { LoadingState } from '@/src/components/ui'
import { AuthScreenLayout } from '@/src/screens/auth/AuthScreenLayout'
import { AuthField, authStyles } from '@/src/screens/auth/authShared'
import { useAuthStore } from '@/src/stores/authStore'

type SignupIntent = 'courier' | 'partner'

function resolvePostRegisterRoute(intent?: string): '/(auth)/signup-courier' | '/(auth)/signup-partner' | '/(auth)/welcome' {
  if (intent === 'courier') return '/(auth)/signup-courier'
  if (intent === 'partner') return '/(auth)/signup-partner'
  return '/(auth)/welcome'
}

export function RegisterForm() {
  const router = useRouter()
  const { intent } = useLocalSearchParams<{ intent?: SignupIntent }>()
  const register = useAuthStore(s => s.register)
  const loading = useAuthStore(s => s.loading)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit() {
    setError(null)
    if (!fullName.trim()) {
      setError('Le nom complet est requis')
      return
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }
    if (password !== passwordConfirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    const result = await register({
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    })
    if (result.error) {
      setError(result.error)
      return
    }
    router.replace(resolvePostRegisterRoute(intent))
  }

  return (
    <>
      <View style={authStyles.header}>
        <Text style={authStyles.screenTitle}>Créer un compte</Text>
        <Text style={authStyles.screenSubtitle}>
          {intent === 'courier'
            ? 'Étape 1 — compte LaPlasse avant votre candidature livreur.'
            : intent === 'partner'
              ? 'Étape 1 — compte LaPlasse avant l\'inscription partenaire.'
              : 'Rejoignez LaPlasse pour devenir livreur ou partenaire logistique.'}
        </Text>
      </View>

      {error ? (
        <View style={authStyles.errorBox}>
          <Text style={authStyles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AuthField label="Nom complet" value={fullName} onChangeText={setFullName} placeholder="Prénom Nom" />
      <AuthField
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        placeholder="vous@exemple.ci"
      />
      <AuthField
        label="Téléphone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        placeholder="+225 07 00 00 00 00"
      />
      <AuthField
        label="Mot de passe"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
      />
      <AuthField
        label="Confirmer le mot de passe"
        secureTextEntry
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
        placeholder="••••••••"
      />

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
          <Text style={authStyles.submitBtnText}>Créer mon compte</Text>
        )}
      </Pressable>

      <Text style={authStyles.switchHint}>
        Déjà inscrit ?{' '}
        <Text style={authStyles.switchLink} onPress={() => router.replace('/(auth)/login')}>
          Se connecter
        </Text>
      </Text>
    </>
  )
}

export function RegisterScreen() {
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const { intent } = useLocalSearchParams<{ intent?: SignupIntent }>()

  if (!hydrated) return <LoadingState />
  if (isAuthenticated) {
    return <Redirect href={resolvePostRegisterRoute(intent)} />
  }

  return (
    <AuthScreenLayout>
      <RegisterForm />
    </AuthScreenLayout>
  )
}
