import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import type { GeoCity, GeoCommune } from '@laplasse/api-client'
import { GlassCard } from '@/src/components/GlassCard'
import { ZonesMap } from '@/src/components/ZonesMap'
import { PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { coordsFromGeoEntity, type MapZonePoint } from '@/src/lib/geoCoords'
import { colors, fonts, layout, radii } from '@/src/theme'

interface Props {
  profileCity: string
  profileCountry: string
}

export function CourierZonesEditor({ profileCity, profileCountry }: Props) {
  const countryCode = profileCountry || 'CI'
  const queryClient = useQueryClient()

  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [cityPickerOpen, setCityPickerOpen] = useState(false)
  const [allCommunes, setAllCommunes] = useState(false)
  const [selectedCommuneIds, setSelectedCommuneIds] = useState<Set<string>>(new Set())
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  const zonesQuery = useQuery({
    queryKey: ['courier-zones'],
    queryFn: () => getApiClient().getCourierZones(),
  })

  const citiesQuery = useQuery({
    queryKey: ['courier-zone-cities', countryCode],
    queryFn: () => getApiClient().getGeoCities(countryCode),
  })

  const cities = citiesQuery.data ?? []
  const zones = zonesQuery.data ?? []

  const activeCity = useMemo((): GeoCity | null => {
    if (!cities.length) return null
    if (selectedCityId) return cities.find(c => c.id === selectedCityId) ?? null
    return (
      cities.find(c => c.name.toLowerCase() === profileCity.toLowerCase())
      ?? cities.find(c => c.is_default)
      ?? cities[0]
    )
  }, [cities, selectedCityId, profileCity])

  useEffect(() => {
    if (activeCity && !selectedCityId) setSelectedCityId(activeCity.id)
  }, [activeCity, selectedCityId])

  const communesQuery = useQuery({
    queryKey: ['courier-zone-communes', countryCode, activeCity?.slug],
    queryFn: async () => {
      if (!activeCity?.slug) return [] as GeoCommune[]
      const res = await getApiClient().getGeoCommunes(activeCity.slug, countryCode)
      return res.communes ?? []
    },
    enabled: !!activeCity?.slug,
  })

  const communes = communesQuery.data ?? []
  const existingForCity = zones.find(z => z.city.id === activeCity?.id)

  useEffect(() => {
    if (!existingForCity) {
      setAllCommunes(false)
      setSelectedCommuneIds(new Set())
      return
    }
    setAllCommunes(existingForCity.all_communes)
    setSelectedCommuneIds(new Set(existingForCity.communes.map(c => c.commune.id)))
  }, [existingForCity?.id, existingForCity?.all_communes, existingForCity?.communes])

  const mapZones = useMemo((): MapZonePoint[] => {
    const toZone = (c: GeoCommune): MapZonePoint => {
      const coords = coordsFromGeoEntity({
        latitude: c.latitude,
        longitude: c.longitude,
        slug: c.slug,
        name: c.name,
        country: countryCode,
      })
      return { lat: coords.lat, lng: coords.lng, label: c.name, radiusMeters: 2800 }
    }

    if (!activeCity) return []

    if (allCommunes && communes.length > 0) {
      return communes.map(toZone)
    }

    if (selectedCommuneIds.size > 0) {
      return communes.filter(c => selectedCommuneIds.has(c.id)).map(toZone)
    }

    const cityCoords = coordsFromGeoEntity({
      latitude: activeCity.latitude,
      longitude: activeCity.longitude,
      slug: activeCity.slug,
      name: activeCity.name,
      country: countryCode,
    })
    return [{ lat: cityCoords.lat, lng: cityCoords.lng, label: activeCity.name, radiusMeters: 4500 }]
  }, [activeCity, allCommunes, communes, selectedCommuneIds, countryCode])

  const selectionCount = allCommunes ? communes.length : selectedCommuneIds.size

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeCity) throw new Error('Ville requise')
      setSaveError('')
      return getApiClient().upsertCourierZone({
        city_id: activeCity.id,
        all_communes: allCommunes,
        commune_ids: allCommunes ? undefined : [...selectedCommuneIds],
      })
    },
    onSuccess: () => {
      setSaveSuccess('Zone enregistrée avec succès.')
      setSaveError('')
      void queryClient.invalidateQueries({ queryKey: ['courier-zones'] })
    },
    onError: (err: Error) => setSaveError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (zoneId: string) => getApiClient().deleteCourierZone(zoneId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['courier-zones'] }),
  })

  const toggleCommune = (id: string) => {
    setAllCommunes(false)
    setSelectedCommuneIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const canSave = allCommunes || selectedCommuneIds.size > 0

  return (
    <View style={styles.root}>
      <GlassCard style={styles.editorCard}>
        <Text style={styles.fieldLabel}>VILLE</Text>
        {citiesQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.emerald600} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        ) : (
          <Pressable style={styles.citySelect} onPress={() => setCityPickerOpen(true)}>
            <Text style={styles.citySelectText}>{activeCity?.name ?? 'Choisir une ville'}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </Pressable>
        )}

        <Pressable
          style={[styles.allCityBox, allCommunes && styles.allCityBoxChecked]}
          onPress={() => {
            setAllCommunes(prev => !prev)
            if (!allCommunes) setSelectedCommuneIds(new Set())
          }}
        >
          <View style={[styles.checkbox, allCommunes && styles.checkboxChecked]}>
            {allCommunes ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>
          <View style={styles.allCityCopy}>
            <Text style={styles.allCityTitle}>Toute la ville</Text>
            <Text style={styles.allCityHint}>
              Accepter les missions dans toutes les communes de {activeCity?.name ?? '…'}.
            </Text>
          </View>
        </Pressable>

        {!allCommunes ? (
          <View style={styles.communesBlock}>
            <Text style={styles.fieldLabel}>COMMUNES</Text>
            {communesQuery.isLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.emerald600} />
                <Text style={styles.loadingText}>Chargement…</Text>
              </View>
            ) : communes.length === 0 ? (
              <Text style={styles.emptyCommunes}>Aucune commune disponible pour cette ville.</Text>
            ) : (
              <ScrollView style={styles.communeList} nestedScrollEnabled>
                {communes.map(c => {
                  const checked = selectedCommuneIds.has(c.id)
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => toggleCommune(c.id)}
                      style={[styles.communeRow, checked && styles.communeRowChecked]}
                    >
                      <Text style={[styles.communeName, checked && styles.communeNameChecked]}>{c.name}</Text>
                      {checked ? <Ionicons name="checkmark" size={16} color={colors.emerald600} /> : null}
                    </Pressable>
                  )
                })}
              </ScrollView>
            )}
          </View>
        ) : null}

        {saveSuccess ? <Text style={styles.success}>{saveSuccess}</Text> : null}
        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <PrimaryButton
          label="Enregistrer ma zone"
          variant="slate"
          loading={saveMutation.isPending}
          disabled={!canSave}
          onPress={() => {
            setSaveSuccess('')
            saveMutation.mutate()
          }}
        />
      </GlassCard>

      <ZonesMap zones={mapZones} />
      <Text style={styles.mapCaption}>
        Carte OpenStreetMap — chaque commune sélectionnée apparaît avec un pin et un cercle de couverture.
        Les zones qui se chevauchent indiquent votre périmètre global.
      </Text>

      <View style={styles.summaryPill}>
        <Text style={styles.summaryText}>
          <Text style={styles.summaryStrong}>{selectionCount}</Text>
          {' '}commune{selectionCount > 1 ? 's' : ''} couverte{selectionCount > 1 ? 's' : ''}
          {activeCity ? ` à ${activeCity.name}` : ''}.
        </Text>
      </View>

      <GlassCard style={styles.savedCard}>
        <View style={styles.savedHeader}>
          <Ionicons name="location" size={20} color={colors.emerald600} />
          <Text style={styles.savedTitle}>Zones enregistrées</Text>
        </View>

        {zonesQuery.isLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.emerald600} />
            <Text style={styles.loadingText}>Chargement…</Text>
          </View>
        ) : zones.length === 0 ? (
          <Text style={styles.emptySaved}>
            Aucune zone configurée — enregistrez votre première zone ci-dessus.
          </Text>
        ) : (
          zones.map(zone => (
            <View key={zone.id} style={styles.savedZone}>
              <View style={styles.savedZoneCopy}>
                <Text style={styles.savedCity}>{zone.city.name}</Text>
                <Text style={styles.savedMeta}>
                  {zone.all_communes
                    ? 'Toutes les communes'
                    : `${zone.communes.length} commune${zone.communes.length > 1 ? 's' : ''} : ${zone.communes.map(c => c.commune.name).join(', ')}`}
                </Text>
              </View>
              <Pressable
                style={styles.deleteBtn}
                disabled={deleteMutation.isPending}
                onPress={() => deleteMutation.mutate(zone.id)}
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} />
                <Text style={styles.deleteText}>Supprimer</Text>
              </Pressable>
            </View>
          ))
        )}
      </GlassCard>

      <Modal visible={cityPickerOpen} transparent animationType="slide" onRequestClose={() => setCityPickerOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setCityPickerOpen(false)} />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>Choisir une ville</Text>
          <FlatList
            data={cities}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={styles.modalItem}
                onPress={() => {
                  setSelectedCityId(item.id)
                  setCityPickerOpen(false)
                }}
              >
                <Text style={styles.modalItemText}>{item.name}</Text>
                {item.id === activeCity?.id ? (
                  <Ionicons name="checkmark" size={18} color={colors.emerald600} />
                ) : null}
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  editorCard: { padding: 24, gap: 16, borderRadius: radii.card },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  citySelect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.field,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  citySelectText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  allCityBox: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  allCityBoxChecked: {
    borderColor: colors.emerald500,
    backgroundColor: colors.emerald50,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.emerald600,
    borderColor: colors.emerald600,
  },
  allCityCopy: { flex: 1, gap: 4 },
  allCityTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  allCityHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  communesBlock: { gap: 10 },
  communeList: { maxHeight: 220 },
  communeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    backgroundColor: colors.surface,
  },
  communeRowChecked: {
    borderColor: colors.emerald500,
    backgroundColor: colors.emerald50,
  },
  communeName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  communeNameChecked: { color: colors.emerald800 },
  emptyCommunes: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  success: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.emerald800,
    backgroundColor: colors.emerald50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.emerald100,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  mapCaption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textLight,
    lineHeight: 16,
    paddingHorizontal: 4,
  },
  summaryPill: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald100,
    borderRadius: 20,
    padding: 16,
  },
  summaryText: { fontFamily: fonts.regular, fontSize: 14, color: colors.emerald800, lineHeight: 20 },
  summaryStrong: { fontFamily: fonts.bold },
  savedCard: { padding: 24, gap: 12, borderRadius: radii.card },
  savedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  savedTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  emptySaved: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  savedZone: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(248,250,252,0.8)',
  },
  savedZoneCopy: { gap: 4 },
  savedCity: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  savedMeta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radii.field,
    backgroundColor: '#fef2f2',
  },
  deleteText: { fontFamily: fonts.bold, fontSize: 14, color: colors.danger },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
    paddingHorizontal: layout.pageGutter,
    marginBottom: 12,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.pageGutter,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
})
