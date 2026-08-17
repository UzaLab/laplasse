import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import type { GeoPlaceResult } from '@laplasse/api-client'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { getApiClient } from '@/src/lib/api'
import { shouldUseOsmWebMap } from '@/src/lib/googleMaps'
import { colors, fonts, homeLayout } from '@/src/theme'

interface GeoHint {
  latitude?: number | null
  longitude?: number | null
}

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (coords: { latitude: number; longitude: number } | null) => void
  city?: GeoHint | null
  commune?: GeoHint | null
}

function defaultCenter(city?: GeoHint | null, commune?: GeoHint | null) {
  if (commune?.latitude != null && commune.longitude != null) {
    return { lat: commune.latitude, lng: commune.longitude }
  }
  if (city?.latitude != null && city.longitude != null) {
    return { lat: city.latitude, lng: city.longitude }
  }
  return { lat: 5.3599517, lng: -4.0082563 }
}

export function AddressLocationPicker({
  latitude,
  longitude,
  onChange,
  city,
  commune,
}: Props) {
  const mapRef = useRef<MapView>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [placeQuery, setPlaceQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<GeoPlaceResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)

  const debouncedQuery = useDebouncedValue(placeQuery, 450)

  const fallback = useMemo(() => defaultCenter(city, commune), [city, commune])
  const pin = latitude != null && longitude != null
    ? { lat: latitude, lng: longitude }
    : fallback

  useEffect(() => {
    if (latitude == null && longitude == null && commune?.latitude != null && commune.longitude != null) {
      onChange({ latitude: commune.latitude, longitude: commune.longitude })
    }
  }, [commune?.latitude, commune?.longitude, latitude, longitude, onChange])

  useEffect(() => {
    if (!mapReady) return
    mapRef.current?.animateToRegion({
      latitude: pin.lat,
      longitude: pin.lng,
      latitudeDelta: 0.012,
      longitudeDelta: 0.012,
    }, 200)
  }, [pin.lat, pin.lng, mapReady])

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)

    void getApiClient()
      .searchGeoPlaces(q, { lat: pin.lat, lng: pin.lng, limit: 8 })
      .then(results => {
        if (cancelled) return
        setSearchResults(results)
        setSearchLoading(false)
        setSearchOpen(true)
      })
      .catch(() => {
        if (cancelled) return
        setSearchResults([])
        setSearchLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, pin.lat, pin.lng])

  const useMyLocation = useCallback(async () => {
    setGpsLoading(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
    } finally {
      setGpsLoading(false)
    }
  }, [onChange])

  const selectPlace = (place: GeoPlaceResult) => {
    onChange({ latitude: place.latitude, longitude: place.longitude })
    setPlaceQuery(place.label.split(',')[0]?.trim() ?? place.label)
    setSearchOpen(false)
    setSearchResults([])
  }

  if (shouldUseOsmWebMap()) {
    return (
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackTitle}>Point GPS précis</Text>
        <Text style={styles.fallbackHint}>
          Configurez une clé Google Maps pour afficher la carte. Recherchez une adresse ou utilisez « Ma position ».
        </Text>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={placeQuery}
            onChangeText={setPlaceQuery}
            placeholder="Rechercher une adresse…"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchLoading ? <ActivityIndicator size="small" color={colors.brand600} /> : null}
        </View>
        {searchOpen && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            renderItem={({ item }) => (
              <Pressable onPress={() => selectPlace(item)} style={styles.resultRow}>
                <Ionicons name="location-outline" size={16} color={colors.brand600} />
                <Text style={styles.resultText} numberOfLines={2}>{item.label}</Text>
              </Pressable>
            )}
          />
        ) : null}
        <Pressable onPress={() => void useMyLocation()} style={styles.gpsBtn} disabled={gpsLoading}>
          {gpsLoading ? (
            <ActivityIndicator color={colors.brand600} size="small" />
          ) : (
            <>
              <Ionicons name="locate" size={16} color={colors.brand600} />
              <Text style={styles.gpsBtnText}>Ma position</Text>
            </>
          )}
        </Pressable>
        {latitude != null && longitude != null ? (
          <Text style={styles.coords}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Point GPS sur la carte</Text>
        <Pressable onPress={() => void useMyLocation()} style={styles.gpsBtn} disabled={gpsLoading}>
          {gpsLoading ? (
            <ActivityIndicator color={colors.brand600} size="small" />
          ) : (
            <>
              <Ionicons name="locate" size={16} color={colors.brand600} />
              <Text style={styles.gpsBtnText}>Ma position</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          value={placeQuery}
          onChangeText={text => {
            setPlaceQuery(text)
            if (text.trim().length >= 2) setSearchOpen(true)
          }}
          placeholder="Rechercher une adresse…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {searchLoading ? <ActivityIndicator size="small" color={colors.brand600} /> : null}
      </View>

      {searchOpen && searchResults.length > 0 ? (
        <View style={styles.resultsBox}>
          {searchResults.map(item => (
            <Pressable key={item.id} onPress={() => selectPlace(item)} style={styles.resultRow}>
              <Ionicons name="location-outline" size={16} color={colors.brand600} />
              <Text style={styles.resultText} numberOfLines={2}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: pin.lat,
            longitude: pin.lng,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }}
          onMapReady={() => setMapReady(true)}
        >
          <Marker
            draggable
            coordinate={{ latitude: pin.lat, longitude: pin.lng }}
            onDragEnd={e => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate
              onChange({ latitude: lat, longitude: lng })
            }}
          />
        </MapView>
      </View>
      {latitude != null && longitude != null ? (
        <Text style={styles.coords}>{latitude.toFixed(5)}, {longitude.toFixed(5)}</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  gpsBtnText: { fontFamily: fonts.bold, fontSize: 12, color: colors.brand600 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: homeLayout.radiusLg,
    paddingHorizontal: 10,
    backgroundColor: colors.surface,
    minHeight: 44,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 8,
  },
  resultsBox: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  resultsList: { maxHeight: 180 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  resultText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.text, lineHeight: 18 },
  mapWrap: {
    height: 180,
    borderRadius: homeLayout.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  coords: { fontFamily: fonts.medium, fontSize: 11, color: colors.textMuted },
  fallbackBox: {
    gap: 8,
    padding: 12,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceContainerLow,
  },
  fallbackTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  fallbackHint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
})
