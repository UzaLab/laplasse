import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
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

  if (shouldUseOsmWebMap()) {
    return (
      <View style={styles.fallbackBox}>
        <Text style={styles.fallbackTitle}>Point GPS précis</Text>
        <Text style={styles.fallbackHint}>
          Configurez une clé Google Maps pour afficher la carte. Utilisez « Ma position » pour enregistrer vos coordonnées.
        </Text>
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
