import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { GeoCity, GeoCommune } from '@laplasse/api-client'
import { SignupStepIndicator } from '@/src/components/auth/SignupStepIndicator'
import { FieldInput, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii } from '@/src/theme'

const STEPS = [
  { num: 1, label: 'Identité légale' },
  { num: 2, label: 'Flotte & zones' },
  { num: 3, label: 'Modalités' },
  { num: 4, label: 'Confirmation' },
]

const FLEET_RANGES = ['1-5', '6-20', '21-100', '100+'] as const
const VEHICLE_TYPES = [
  { id: 'MOTO', label: 'Moto' },
  { id: 'VOITURE', label: 'Voiture' },
  { id: 'TRICYCLE', label: 'Tricycle' },
  { id: 'VELO', label: 'Vélo' },
  { id: 'CAMIONNETTE', label: 'Camionnette' },
]
const SLA_OPTIONS = [
  { value: 30, label: '< 30 min' },
  { value: 45, label: '< 45 min' },
  { value: 60, label: '< 60 min' },
]
const PAYOUT_METHODS = [
  { id: 'MTN_MOBILE_MONEY', label: 'MTN Mobile Money' },
  { id: 'ORANGE_MONEY', label: 'Orange Money' },
  { id: 'WAVE', label: 'Wave' },
  { id: 'BANK', label: 'Virement bancaire' },
]

export function LogisticsSignupWizard() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const user = useAuthStore(s => s.user)
  const refreshUser = useAuthStore(s => s.refreshUser)
  const countryCode = 'CI'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploadingKyc, setUploadingKyc] = useState(false)
  const [error, setError] = useState('')
  const [kycUploaded, setKycUploaded] = useState(false)
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [fleetPickerOpen, setFleetPickerOpen] = useState(false)

  const [form, setForm] = useState({
    legal_name: '',
    trade_name: '',
    rccm_number: '',
    address: '',
    city: 'Abidjan',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    fleet_size_range: '6-20' as typeof FLEET_RANGES[number],
    vehicle_types: ['MOTO'] as string[],
    commune_ids: [] as string[],
    sla_eta_default_minutes: 45,
    auto_dispatch_default: true,
    payout_method: 'MTN_MOBILE_MONEY',
    payout_number: '',
  })

  useEffect(() => {
    if (user?.logistics_partner) {
      router.replace('/(partner)')
    }
  }, [user?.logistics_partner, router])

  const citiesQuery = useQuery({
    queryKey: ['logistics-signup-cities', countryCode],
    queryFn: () => getApiClient().getGeoCities(countryCode),
  })

  const cities = citiesQuery.data ?? []
  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCityId) return cities.find(c => c.id === selectedCityId) ?? null
    return cities.find(c => c.name.toLowerCase() === form.city.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
  }, [cities, selectedCityId, form.city])

  const communesQuery = useQuery({
    queryKey: ['logistics-signup-communes', countryCode, activeCity?.slug],
    queryFn: async () => {
      if (!activeCity?.slug) return [] as GeoCommune[]
      const res = await getApiClient().getGeoCommunes(activeCity.slug, countryCode)
      return res.communes ?? []
    },
    enabled: !!activeCity?.slug,
  })

  const communes = communesQuery.data ?? []

  const saveStep = async (targetStep: number) => {
    setLoading(true)
    setError('')
    try {
      const payload = {
        step: targetStep,
        country: countryCode,
        ...(targetStep >= 1
          ? {
              legal_name: form.legal_name,
              trade_name: form.trade_name || undefined,
              rccm_number: form.rccm_number || undefined,
              address: form.address || undefined,
              city: activeCity?.name ?? form.city,
              phone: form.phone,
              email: form.email || undefined,
            }
          : {}),
        ...(targetStep >= 2
          ? {
              fleet_size_range: form.fleet_size_range,
              vehicle_types: form.vehicle_types,
              commune_ids: form.commune_ids,
            }
          : {}),
        ...(targetStep >= 3
          ? {
              sla_eta_default_minutes: form.sla_eta_default_minutes,
              auto_dispatch_default: form.auto_dispatch_default,
              payout_method: form.payout_method,
              payout_number: form.payout_number || undefined,
            }
          : {}),
      }
      await getApiClient().saveLogisticsOnboarding(payload)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enregistrement impossible')
      return false
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (step === 1) {
      if (!form.legal_name.trim() || !form.phone.trim()) {
        setError('Raison sociale et téléphone sont requis')
        return
      }
    }
    if (step === 2 && form.commune_ids.length === 0) {
      setError('Sélectionnez au moins une commune couverte')
      return
    }
    const ok = await saveStep(step)
    if (!ok) return
    setError('')
    if (step < 4) setStep(step + 1)
  }

  const handleFinish = async () => {
    const ok = await saveStep(4)
    if (!ok) return
    await refreshUser()
    router.replace('/(partner)/onboarding')
  }

  const handleKycUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      setError('Autorisez l\'accès aux fichiers pour le KYC')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 })
    if (result.canceled || !result.assets[0]) return

    setUploadingKyc(true)
    setError('')
    try {
      if (step === 1 && !user?.logistics_partner) {
        const ok = await saveStep(1)
        if (!ok) return
      }
      const asset = result.assets[0]
      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: 'kyc.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob)
      await getApiClient().uploadLogisticsKycDocument(formData)
      setKycUploaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload impossible')
    } finally {
      setUploadingKyc(false)
    }
  }

  const toggleVehicle = (id: string) => {
    setForm(f => ({
      ...f,
      vehicle_types: f.vehicle_types.includes(id)
        ? f.vehicle_types.filter(x => x !== id)
        : [...f.vehicle_types, id],
    }))
  }

  const toggleCommune = (id: string) => {
    setForm(f => ({
      ...f,
      commune_ids: f.commune_ids.includes(id)
        ? f.commune_ids.filter(x => x !== id)
        : [...f.commune_ids, id],
    }))
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
      <Text style={styles.title}>Partenaire logistique</Text>
      <Text style={styles.subtitle}>Structure de livraison B2B LaPlasse</Text>

      <SignupStepIndicator steps={STEPS} current={step} />

      <View style={styles.card}>
        {step === 1 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Identité légale</Text>
            <FieldInput value={form.legal_name} onChangeText={v => setForm(f => ({ ...f, legal_name: v }))} placeholder="Raison sociale *" />
            <FieldInput value={form.trade_name} onChangeText={v => setForm(f => ({ ...f, trade_name: v }))} placeholder="Nom commercial" />
            <FieldInput value={form.rccm_number} onChangeText={v => setForm(f => ({ ...f, rccm_number: v }))} placeholder="N° RCCM / fiscal" />
            <FieldInput value={form.address} onChangeText={v => setForm(f => ({ ...f, address: v }))} placeholder="Adresse du siège" />
            {citiesQuery.isLoading ? (
              <ActivityIndicator color={colors.partnerAccent} />
            ) : (
              <Pressable style={styles.select} onPress={() => setCityPickerOpen(true)}>
                <Text style={styles.selectText}>{activeCity?.name ?? form.city}</Text>
              </Pressable>
            )}
            <FieldInput value={form.phone} onChangeText={v => setForm(f => ({ ...f, phone: v }))} placeholder="Téléphone *" keyboardType="phone-pad" />
            <FieldInput value={form.email} onChangeText={v => setForm(f => ({ ...f, email: v }))} placeholder="Email contact" keyboardType="email-address" autoCapitalize="none" />
            <SecondaryButton
              label={kycUploaded ? 'Document KYC ajouté' : uploadingKyc ? 'Envoi…' : 'Uploader scan RCCM / KYC'}
              onPress={() => void handleKycUpload()}
            />
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Flotte & zones couvertes</Text>
            <Pressable style={styles.select} onPress={() => setFleetPickerOpen(true)}>
              <Text style={styles.selectText}>{form.fleet_size_range} livreurs</Text>
            </Pressable>
            <View style={styles.chips}>
              {VEHICLE_TYPES.map(v => (
                <Pressable
                  key={v.id}
                  onPress={() => toggleVehicle(v.id)}
                  style={[styles.chip, form.vehicle_types.includes(v.id) && styles.chipActive]}
                >
                  <Text style={[styles.chipText, form.vehicle_types.includes(v.id) && styles.chipTextActive]}>{v.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.fieldLabel}>COMMUNES COUVERTES *</Text>
            {communesQuery.isLoading ? (
              <ActivityIndicator color={colors.partnerAccent} />
            ) : (
              <View style={styles.communeList}>
                {communes.map(c => {
                  const checked = form.commune_ids.includes(c.id)
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCommune(c.id)}
                      style={[styles.communeRow, checked && styles.communeRowChecked]}
                    >
                      <Text style={styles.communeName}>{c.name}</Text>
                    </Pressable>
                  )
                })}
              </View>
            )}
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Modalités commerciales</Text>
            <View style={styles.chips}>
              {SLA_OPTIONS.map(o => (
                <Pressable
                  key={o.value}
                  onPress={() => setForm(f => ({ ...f, sla_eta_default_minutes: o.value }))}
                  style={[styles.chip, form.sla_eta_default_minutes === o.value && styles.chipActivePartner]}
                >
                  <Text style={[styles.chipText, form.sla_eta_default_minutes === o.value && styles.chipTextActivePartner]}>
                    SLA {o.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Auto-dispatch par défaut</Text>
              <Switch
                value={form.auto_dispatch_default}
                onValueChange={v => setForm(f => ({ ...f, auto_dispatch_default: v }))}
                trackColor={{ false: colors.border, true: colors.partnerAccent }}
              />
            </View>
            <View style={styles.chips}>
              {PAYOUT_METHODS.map(p => (
                <Pressable
                  key={p.id}
                  onPress={() => setForm(f => ({ ...f, payout_method: p.id }))}
                  style={[styles.chip, form.payout_method === p.id && styles.chipActivePartner]}
                >
                  <Text style={[styles.chipText, form.payout_method === p.id && styles.chipTextActivePartner]}>{p.label}</Text>
                </Pressable>
              ))}
            </View>
            <FieldInput
              value={form.payout_number}
              onChangeText={v => setForm(f => ({ ...f, payout_number: v }))}
              placeholder="Numéro de versement commissions"
              keyboardType="phone-pad"
            />
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Confirmation</Text>
            <View style={styles.recapRow}>
              <Text style={styles.recapValue}>{form.legal_name}{form.trade_name ? ` (${form.trade_name})` : ''}</Text>
              <Text style={styles.recapMeta}>{activeCity?.name ?? form.city} · {form.phone}</Text>
              <Text style={styles.recapMeta}>Flotte {form.fleet_size_range} · {form.vehicle_types.join(', ')}</Text>
              <Text style={styles.recapMeta}>{form.commune_ids.length} commune(s) · SLA {form.sla_eta_default_minutes} min</Text>
              <Text style={styles.recapMeta}>
                Versement : {PAYOUT_METHODS.find(p => p.id === form.payout_method)?.label}
              </Text>
            </View>
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Votre dossier passera en statut En validation. L'équipe LaPlasse vérifie le KYC sous 48 h.
              </Text>
            </View>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
          {step > 1 ? (
            <SecondaryButton label="Retour" onPress={() => { setError(''); setStep(s => s - 1) }} />
          ) : (
            <Pressable onPress={() => router.back()}>
              <Text style={styles.cancel}>Annuler</Text>
            </Pressable>
          )}
          {step < 4 ? (
            <PrimaryButton label="Continuer" variant="partner" loading={loading} onPress={() => void handleNext()} />
          ) : (
            <PrimaryButton label="Soumettre mon dossier" loading={loading} onPress={() => void handleFinish()} />
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
                setForm(f => ({ ...f, city: city.name }))
                setCityPickerOpen(false)
              }}
            >
              <Text style={styles.modalItemText}>{city.name}</Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      <Modal visible={fleetPickerOpen} transparent animationType="slide" onRequestClose={() => setFleetPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setFleetPickerOpen(false)} />
        <View style={styles.modalSheet}>
          {FLEET_RANGES.map(range => (
            <Pressable
              key={range}
              style={styles.modalItem}
              onPress={() => {
                setForm(f => ({ ...f, fleet_size_range: range }))
                setFleetPickerOpen(false)
              }}
            >
              <Text style={styles.modalItemText}>{range} livreurs</Text>
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
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.emerald50, borderColor: colors.emerald600 },
  chipActivePartner: { backgroundColor: '#eef2ff', borderColor: colors.partnerAccent },
  chipText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  chipTextActive: { color: colors.emerald700 },
  chipTextActivePartner: { color: colors.partnerAccent },
  communeList: { maxHeight: 200, gap: 8 },
  communeRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  communeRowChecked: { borderColor: colors.partnerAccent, backgroundColor: '#eef2ff' },
  communeName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchLabel: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text, flex: 1 },
  recapRow: { gap: 6 },
  recapValue: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  recapMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  notice: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
  },
  noticeText: { fontFamily: fonts.regular, fontSize: 14, color: '#92400e', lineHeight: 20 },
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
