import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppHeader } from '@/src/components/AppHeader'
import { FieldInput, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function SettingsScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const logout = useAuthStore(s => s.logout)
  const setUser = useAuthStore(s => s.setUser)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFullName(user?.full_name ?? '')
    setPhone(user?.phone ?? '')
  }, [user?.full_name, user?.phone])

  if (!isAuthenticated) {
    return (
      <View style={styles.root}>
        <AppHeader />
        <View style={styles.center}>
          <Text style={styles.hint}>Connectez-vous pour accéder aux paramètres.</Text>
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </View>
      </View>
    )
  }

  async function saveProfile(field: 'name' | 'phone') {
    setSaving(true)
    try {
      const updated = await getApiClient().updateProfile(
        field === 'name' ? { full_name: fullName.trim() } : { phone: phone.trim() },
      )
      setUser(updated)
      Alert.alert('Profil', 'Modifications enregistrées')
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Mise à jour impossible')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      Alert.alert('Mot de passe', 'Minimum 8 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mot de passe', 'Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      await getApiClient().changePassword({
        new_password: newPassword,
        current_password: currentPassword || undefined,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('Mot de passe', 'Mot de passe mis à jour')
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Modification impossible')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.root}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Paramètres</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nom complet</Text>
          <FieldInput value={fullName} onChangeText={setFullName} placeholder="Votre nom" />
          <PrimaryButton label="Enregistrer" onPress={() => void saveProfile('name')} loading={saving} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Téléphone</Text>
          <FieldInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+225..."
            keyboardType="phone-pad"
          />
          <PrimaryButton label="Enregistrer" onPress={() => void saveProfile('phone')} loading={saving} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mot de passe</Text>
          <FieldInput
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Mot de passe actuel (si défini)"
          />
          <FieldInput
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Nouveau mot de passe"
          />
          <FieldInput
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirmer"
          />
          <PrimaryButton label="Changer le mot de passe" onPress={() => void changePassword()} loading={saving} />
        </View>

        <SecondaryButton label="Se déconnecter" onPress={() => void logout()} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.gutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  center: { flex: 1, padding: spacing.gutter, justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  email: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  hint: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, textAlign: 'center', marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted, textTransform: 'uppercase' },
})
