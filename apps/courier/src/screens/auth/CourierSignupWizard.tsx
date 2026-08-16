import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { GeoCity } from '@laplasse/api-client'
import { SignupStepIndicator } from '@/src/components/auth/SignupStepIndicator'
import { FieldInput, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { VEHICLE_OPTIONS } from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii } from '@/src/theme'

const STEPS = [
  { num: 1, label: 'Zone & véhicule' },
  { num: 2, label: 'Contact' },
  { num: 3, label: 'Confirmation' },
]

export function CourierSignupWizard() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const refreshUser = useAuthStore(s => s.refreshUser)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [vehicle, setVehicle] = useState('MOTO')
  const [plateNumber, setPlateNumber] = useState('')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const countryCode = 'CI'

  const citiesQuery = useQuery({
    queryKey: ['courier-signup-cities', countryCode],
    queryFn: () => getApiClient().getGeoCities(countryCode),
  })

  const cities = citiesQuery.data ?? []
  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCityId) return cities.find(c => c.id === selectedCityId) ?? null
    return cities.find(c => c.is_default) ?? cities[0]
  }, [cities, selectedCityId])

  useEffect(() => {
    if (user?.courier_profile) {
      router.replace('/(courier)')
    }
  }, [user?.courier_profile, router])

  const handleSubmit = async () => {
    if (!phone.trim() || phone.trim().length < 8) {
      setError('Indiquez un numéro de téléphone valide')
      return
    }
    if (!activeCity) {
      setError('Choisissez une ville')
      return
    }

    setLoading(true)
    setError('')
    try {
      await getApiClient().registerCourier({
        city: activeCity.name,
        phone: phone.trim(),
        country_code: countryCode,
        vehicle,
        plate_number: plateNumber.trim() || undefined,
      })
      await refreshUser()
      router.replace('/(courier)/onboarding')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inscription impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Devenir livreur</Text>
      <Text style={styles.subtitle}>Réseau LaPlasse — livraisons last-mile</Text>

      <SignupStepIndicator steps={STEPS} current={step} />

      <View style={styles.card}>
        {step === 1 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Où livrez-vous ?</Text>
            <Text style={styles.panelHint}>Choisissez votre ville principale et votre type de véhicule.</Text>

            <Text style={styles.fieldLabel}>VILLE</Text>
            {citiesQuery.isLoading ? (
              <ActivityIndicator color={colors.emerald600} />
            ) : (
              <Pressable style={styles.select} onPress={() => setCityPickerOpen(true)}>
                <Text style={styles.selectText}>{activeCity?.name ?? 'Choisir une ville'}</Text>
              </Pressable>
            )}

            <Text style={styles.fieldLabel}>VÉHICULE</Text>
            <View style={styles.vehicleGrid}>
              {VEHICLE_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setVehicle(opt.value)}
                  style={[styles.vehicleCard, vehicle === opt.value && styles.vehicleCardActive]}
                >
                  <Text style={styles.vehicleLabel}>{opt.label}</Text>
                  <Text style={styles.vehicleHint}>{opt.hint}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>IMMATRICULATION (OPTIONNEL)</Text>
            <FieldInput
              value={plateNumber}
              onChangeText={setPlateNumber}
              placeholder="AB-123-CD"
              autoCapitalize="characters"
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Coordonnées</Text>
            <Text style={styles.panelHint}>
              Les clients et l'équipe ops pourront vous joindre pour les courses.
            </Text>

            <Text style={styles.fieldLabel}>TÉLÉPHONE</Text>
            <FieldInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+225 07 00 00 00 00"
              keyboardType="phone-pad"
            />

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Votre dossier sera vérifié par notre équipe avant activation. Les pièces d'identité pourront être demandées ensuite.
              </Text>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Récapitulatif</Text>
            <Text style={styles.panelHint}>Vérifiez vos informations avant envoi.</Text>

            {[
              { label: 'Ville', value: activeCity?.name ?? '—' },
              { label: 'Véhicule', value: VEHICLE_OPTIONS.find(v => v.value === vehicle)?.label ?? vehicle },
              { label: 'Téléphone', value: phone },
            ].map(row => (
              <View key={row.label} style={styles.recapRow}>
                <Text style={styles.recapLabel}>{row.label}</Text>
                <Text style={styles.recapValue}>{row.value}</Text>
              </View>
            ))}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <SecondaryButton label="Retour" onPress={() => { setError(''); setStep(s => s - 1) }} />
          ) : (
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>Annuler</Text>
            </Pressable>
          )}
          {step < 3 ? (
            <PrimaryButton label="Continuer" onPress={() => { setError(''); setStep(s => s + 1) }} />
          ) : (
            <PrimaryButton label="Envoyer ma candidature" loading={loading} onPress={() => void handleSubmit()} />
          )}
        </View>
      </View>

      <Modal visible={cityPickerOpen} transparent animationType="slide" onRequestClose={() => setCityPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCityPickerOpen(false)} />
        <View style={styles.modalSheet}>
          {cities.map(city => (
            <Pressable
              key={city.id}
              style={styles.modalItem}
              onPress={() => {
                setSelectedCityId(city.id)
                setCityPickerOpen(false)
              }}
            >
              <Text style={styles.modalItemText}>{city.name}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, gap: 8 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginBottom: 8 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 16,
  },
  panel: { gap: 12 },
  panelTitle: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.text },
  panelHint: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
    marginTop: 4,
  },
  select: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.field,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  selectText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  vehicleGrid: { gap: 10 },
  vehicleCard: {
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: 16,
    padding: 14,
  },
  vehicleCardActive: { borderColor: colors.emerald500, backgroundColor: colors.emerald50 },
  vehicleLabel: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  vehicleHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  notice: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
  },
  noticeText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  recapRow: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  recapLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  recapValue: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger },
  actions: { gap: 10, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  cancel: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
})
