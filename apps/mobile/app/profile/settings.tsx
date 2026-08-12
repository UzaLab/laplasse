import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { UserAddress } from '@laplasse/api-client'
import { ProfileBadge, ProfileCard, ProfilePageTitle } from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { FieldInput, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { profileTheme } from '@/src/lib/profileTheme'
import { useAuthStore } from '@/src/stores/authStore'
import { layout } from '@/src/theme'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  MERCHANT: 'Marchand',
  USER: 'Membre',
}

const ROLE_TONE: Record<string, 'neutral' | 'warning' | 'success'> = {
  ADMIN: 'success',
  SUPER_ADMIN: 'success',
  MERCHANT: 'warning',
  USER: 'neutral',
}

export default function ProfileSettingsScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const setUser = useAuthStore(s => s.setUser)

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  const addressesQuery = useQuery({
    queryKey: ['my-addresses'],
    queryFn: () => getApiClient().getMyAddresses(),
  })

  useEffect(() => {
    setFullName(user?.full_name ?? '')
    setPhone(user?.phone ?? '')
  }, [user?.full_name, user?.phone])

  async function saveProfile(field: 'name' | 'phone') {
    setSaving(true)
    try {
      const updated = await getApiClient().updateProfile(
        field === 'name' ? { full_name: fullName.trim() } : { phone: phone.trim() },
      )
      setUser(updated)
      notify.success('Profil', 'Modifications enregistrées')
    } catch (err) {
      notify.error('Erreur', err instanceof Error ? err.message : 'Mise à jour impossible')
    } finally {
      setSaving(false)
    }
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      notify.warning('Mot de passe', 'Minimum 8 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      notify.warning('Mot de passe', 'Les mots de passe ne correspondent pas')
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
      notify.success('Mot de passe', 'Mot de passe mis à jour')
    } catch (err) {
      notify.error('Erreur', err instanceof Error ? err.message : 'Modification impossible')
    } finally {
      setSaving(false)
    }
  }

  function confirmDeleteAddress(address: UserAddress) {
    Alert.alert('Supprimer l\'adresse', address.label ?? address.address_detail ?? 'Adresse', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => void deleteAddress(address.id),
      },
    ])
  }

  async function deleteAddress(id: string) {
    try {
      await getApiClient().deleteUserAddress(id)
      notify.success('Adresse supprimée')
      void addressesQuery.refetch()
    } catch (err) {
      notify.error('Erreur', err instanceof Error ? err.message : 'Suppression impossible')
    }
  }

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Paramètres"
        subtitle="Gérez vos informations personnelles et votre sécurité."
      />

      <ProfileCard>
        <Text style={styles.label}>Compte</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <ProfileBadge
          label={ROLE_LABELS[user?.role ?? 'USER'] ?? 'Membre'}
          tone={ROLE_TONE[user?.role ?? 'USER'] ?? 'neutral'}
        />
      </ProfileCard>

      <ProfileCard>
        <Text style={styles.cardTitle}>Nom complet</Text>
        <FieldInput value={fullName} onChangeText={setFullName} placeholder="Votre nom" />
        <PrimaryButton label="Enregistrer" onPress={() => void saveProfile('name')} loading={saving} />
      </ProfileCard>

      <ProfileCard>
        <Text style={styles.cardTitle}>Téléphone</Text>
        <FieldInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+225..."
          keyboardType="phone-pad"
        />
        <PrimaryButton label="Enregistrer" onPress={() => void saveProfile('phone')} loading={saving} />
      </ProfileCard>

      <ProfileCard>
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
      </ProfileCard>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Mes adresses</Text>
      </View>

      {(addressesQuery.data ?? []).length === 0 ? (
        <ProfileCard>
          <Text style={styles.empty}>
            Aucune adresse enregistrée. Ajoutez-en une lors du checkout.
          </Text>
        </ProfileCard>
      ) : (
        (addressesQuery.data ?? []).map(address => (
          <ProfileCard key={address.id}>
            <View style={styles.addressTop}>
              <Text style={styles.addressLabel}>{address.label ?? 'Adresse'}</Text>
              {address.is_default ? <ProfileBadge label="Par défaut" tone="success" /> : null}
            </View>
            <Text style={styles.addressLine}>
              {[address.address_detail, address.district].filter(Boolean).join(', ')}
            </Text>
            <Text style={styles.addressMeta}>
              {[address.commune.name, address.city.name].filter(Boolean).join(', ')}
            </Text>
            <Pressable onPress={() => confirmDeleteAddress(address)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={profileTheme.danger} />
              <Text style={styles.deleteText}>Supprimer</Text>
            </Pressable>
          </ProfileCard>
        ))
      )}

      <SecondaryButton
        label="Se déconnecter"
        onPress={() => {
          void logout()
          router.replace('/(tabs)/profile' as never)
        }}
      />

      <Pressable style={styles.backLink} onPress={() => router.push('/profile' as never)}>
        <Ionicons name="arrow-back" size={16} color={profileTheme.textMuted} />
        <Text style={styles.backLinkText}>Retour au profil</Text>
      </Pressable>
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  label: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 12,
    color: profileTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 16,
    color: profileTheme.text,
    marginTop: 4,
  },
  cardTitle: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: { marginTop: 4 },
  sectionTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 18,
    color: profileTheme.text,
  },
  empty: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    lineHeight: 20,
  },
  addressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addressLabel: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.text },
  addressLine: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    marginTop: 6,
    lineHeight: 20,
  },
  addressMeta: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 13,
    color: profileTheme.textLight,
    marginTop: 4,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  deleteText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.danger },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { fontFamily: profileTheme.fonts.semibold, fontSize: 14, color: profileTheme.textMuted },
})
