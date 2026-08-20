import { useEffect, useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { getApiClient } from '@/src/lib/api'
import { shouldUseOsmWebMap } from '@/src/lib/googleMaps'
import { openDirectionsFromTo, openDirectionsTo } from '@/src/lib/mapsUtils'
import { colors, fonts, homeLayout } from '@/src/theme'

const TERMINAL_STATUSES = new Set(['DELIVERED', 'CANCELLED', 'FAILED'])

interface Props {
  status: string
  courierLatitude: number | null
  courierLongitude: number | null
  dropoffLatitude: number | null
  dropoffLongitude: number | null
  dropoffAddress?: string | null
}

function isValidCoord(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value)
}

export function DeliveryTrackMap({
  status,
  courierLatitude,
  courierLongitude,
  dropoffLatitude,
  dropoffLongitude,
  dropoffAddress,
}: Props) {
  if (shouldUseOsmWebMap()) {
    return (
      <DeliveryTrackMapFallback
        status={status}
        courierLatitude={courierLatitude}
        courierLongitude={courierLongitude}
        dropoffLatitude={dropoffLatitude}
        dropoffLongitude={dropoffLongitude}
        dropoffAddress={dropoffAddress}
      />
    )
  }

  return (
    <DeliveryTrackMapNative
      status={status}
      courierLatitude={courierLatitude}
      courierLongitude={courierLongitude}
      dropoffLatitude={dropoffLatitude}
      dropoffLongitude={dropoffLongitude}
    />
  )
}

function DeliveryTrackMapNative({
  status,
  courierLatitude,
  courierLongitude,
  dropoffLatitude,
  dropoffLongitude,
}: Props) {
  const mapRef = useRef<MapView>(null)
  const [mapReady, setMapReady] = useState(false)
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([])
  const routeKeyRef = useRef('')

  const isTerminal = TERMINAL_STATUSES.has(status)
  const hasDropoff = isValidCoord(dropoffLatitude) && isValidCoord(dropoffLongitude)
  const hasCourier = !isTerminal && isValidCoord(courierLatitude) && isValidCoord(courierLongitude)

  const mapPoints = useMemo(() => {
    const points: Array<{ latitude: number; longitude: number }> = []
    if (hasDropoff) {
      points.push({ latitude: dropoffLatitude, longitude: dropoffLongitude })
    }
    if (hasCourier) {
      points.push({ latitude: courierLatitude, longitude: courierLongitude })
    }
    return points
  }, [hasDropoff, hasCourier, dropoffLatitude, dropoffLongitude, courierLatitude, courierLongitude])

  const initialRegion = useMemo(() => {
    const center = mapPoints[0] ?? { latitude: 5.3599517, longitude: -4.0082563 }
    return {
      ...center,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04,
    }
  }, [mapPoints])

  useEffect(() => {
    if (!mapReady || mapPoints.length === 0) return
    if (mapPoints.length === 1) {
      mapRef.current?.animateToRegion(
        { ...mapPoints[0], latitudeDelta: 0.02, longitudeDelta: 0.02 },
        250,
      )
      return
    }
    mapRef.current?.fitToCoordinates(mapPoints, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    })
  }, [mapReady, mapPoints])

  useEffect(() => {
    if (isTerminal || !hasCourier || !hasDropoff) {
      setRouteCoords([])
      routeKeyRef.current = ''
      return
    }

    const key = `${courierLatitude.toFixed(4)},${courierLongitude.toFixed(4)};${dropoffLatitude.toFixed(4)},${dropoffLongitude.toFixed(4)}`
    if (key === routeKeyRef.current) return
    routeKeyRef.current = key

    let cancelled = false
    void getApiClient()
      .getGeoDirections({
        originLat: courierLatitude,
        originLng: courierLongitude,
        destLat: dropoffLatitude,
        destLng: dropoffLongitude,
        mode: 'driving',
      })
      .then(result => {
        if (cancelled || result.polyline.length < 2) return
        setRouteCoords(
          result.polyline.map(([lat, lng]) => ({ latitude: lat, longitude: lng })),
        )
      })
      .catch(() => {
        if (cancelled) return
        setRouteCoords([
          { latitude: courierLatitude, longitude: courierLongitude },
          { latitude: dropoffLatitude, longitude: dropoffLongitude },
        ])
      })

    return () => {
      cancelled = true
    }
  }, [
    isTerminal,
    hasCourier,
    hasDropoff,
    courierLatitude,
    courierLongitude,
    dropoffLatitude,
    dropoffLongitude,
  ])

  if (!hasDropoff && !hasCourier) {
    return (
      <View style={styles.emptyMap}>
        <Ionicons name="map-outline" size={36} color={colors.textLight} />
        <Text style={styles.emptyText}>
          La carte s&apos;affichera dès qu&apos;un livreur sera en route.
        </Text>
      </View>
    )
  }

  const canOpenRoute = hasCourier && hasDropoff

  return (
    <View style={styles.wrap}>
      <View style={styles.mapHeader}>
        <Text style={styles.mapTitle}>Position en direct</Text>
        {canOpenRoute ? (
          <Pressable
            onPress={() =>
              void openDirectionsFromTo(
                courierLatitude,
                courierLongitude,
                dropoffLatitude,
                dropoffLongitude,
              )
            }
            style={styles.mapsLink}
          >
            <Ionicons name="navigate" size={14} color={colors.brand600} />
            <Text style={styles.mapsLinkText}>Maps</Text>
          </Pressable>
        ) : hasDropoff ? (
          <Pressable
            onPress={() => void openDirectionsTo(dropoffLatitude, dropoffLongitude)}
            style={styles.mapsLink}
          >
            <Ionicons name="navigate" size={14} color={colors.brand600} />
            <Text style={styles.mapsLinkText}>Maps</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsCompass={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          loadingEnabled
          onMapReady={() => setMapReady(true)}
        >
          {hasDropoff ? (
            <Marker
              coordinate={{ latitude: dropoffLatitude, longitude: dropoffLongitude }}
              title="Livraison"
              pinColor={Platform.OS === 'ios' ? colors.brand600 : undefined}
            />
          ) : null}

          {hasCourier ? (
            <Marker
              coordinate={{ latitude: courierLatitude, longitude: courierLongitude }}
              title="Livreur"
              pinColor={Platform.OS === 'ios' ? colors.emerald700 : undefined}
            />
          ) : null}

          {routeCoords.length > 1 ? (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#059669"
              strokeWidth={4}
            />
          ) : null}
        </MapView>
      </View>

      <Text style={styles.mapHint}>
        {hasCourier
          ? 'Position du livreur mise à jour en temps réel.'
          : 'Point de livraison — le livreur apparaîtra dès qu\'il sera en route.'}
      </Text>
    </View>
  )
}

function DeliveryTrackMapFallback({
  status,
  courierLatitude,
  courierLongitude,
  dropoffLatitude,
  dropoffLongitude,
  dropoffAddress,
}: Props) {
  const isTerminal = TERMINAL_STATUSES.has(status)
  const hasDropoff = isValidCoord(dropoffLatitude) && isValidCoord(dropoffLongitude)
  const hasCourier = !isTerminal && isValidCoord(courierLatitude) && isValidCoord(courierLongitude)

  return (
    <View style={styles.fallbackWrap}>
      <Text style={styles.mapTitle}>Suivi sur carte</Text>
      <Text style={styles.fallbackHint}>
        Configurez une clé Google Maps native pour afficher la carte intégrée.
      </Text>
      {hasDropoff ? (
        <Pressable
          style={styles.fallbackBtn}
          onPress={() => void openDirectionsTo(dropoffLatitude, dropoffLongitude)}
        >
          <Ionicons name="location" size={16} color={colors.brand600} />
          <Text style={styles.fallbackBtnText}>
            {dropoffAddress?.trim() ? 'Voir le point de livraison' : 'Ouvrir dans Google Maps'}
          </Text>
        </Pressable>
      ) : null}
      {hasCourier ? (
        <Pressable
          style={styles.fallbackBtn}
          onPress={() =>
            void openDirectionsFromTo(
              courierLatitude,
              courierLongitude,
              dropoffLatitude!,
              dropoffLongitude!,
            )
          }
        >
          <Ionicons name="navigate" size={16} color={colors.brand600} />
          <Text style={styles.fallbackBtnText}>Itinéraire livreur → livraison</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  mapTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  mapsLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mapsLinkText: { fontFamily: fonts.bold, fontSize: 12, color: colors.brand600 },
  mapWrap: {
    height: 240,
    backgroundColor: colors.border,
  },
  mapHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyMap: {
    height: 180,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  fallbackWrap: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 10,
  },
  fallbackHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  fallbackBtnText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand600 },
})
