import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import MapView, { Circle, Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps'
import { SearchOsmWebMap } from '@/src/components/SearchOsmWebMap'
import {
  deltaFromRadiusKm,
  isValidCoord,
  type SearchNativeMapProps,
} from '@/src/components/searchNativeMapShared'
import { shouldUseOsmWebMap } from '@/src/lib/googleMaps'
import { OSM_TILE_URL } from '@/src/lib/mapTiles'
import { colors } from '@/src/theme'

export function SearchNativeMap(props: SearchNativeMapProps) {
  if (shouldUseOsmWebMap()) {
    return <SearchOsmWebMap {...props} />
  }
  return <SearchNativeMapImpl {...props} />
}

function SearchNativeMapImpl({
  merchants,
  selectedId,
  onSelect,
  center,
  userLocation,
  radiusKm = 2,
  geoGranted = false,
}: SearchNativeMapProps) {
  const mapRef = useRef<MapView>(null)
  const [mapReady, setMapReady] = useState(false)

  const mappable = useMemo(
    () =>
      merchants.filter(
        m =>
          isValidCoord(m.location?.latitude)
          && isValidCoord(m.location?.longitude),
      ),
    [merchants],
  )

  const safeCenter = useMemo(() => {
    if (isValidCoord(center.lat) && isValidCoord(center.lng)) {
      return { lat: center.lat, lng: center.lng }
    }
    return { lat: 5.3599517, lng: -4.0082563 }
  }, [center.lat, center.lng])

  const region = useMemo(() => {
    const deltas = deltaFromRadiusKm(userLocation && geoGranted ? radiusKm : 0.08, safeCenter.lat)
    return {
      latitude: safeCenter.lat,
      longitude: safeCenter.lng,
      ...deltas,
    }
  }, [safeCenter.lat, safeCenter.lng, radiusKm, userLocation, geoGranted])

  useEffect(() => {
    if (!mapReady) return
    mapRef.current?.animateToRegion(region, 280)
  }, [region, mapReady])

  const focusMerchant = useCallback(
    (merchantId: string) => {
      if (!mapReady) return
      const merchant = mappable.find(m => m.id === merchantId)
      if (!merchant?.location) return
      mapRef.current?.animateToRegion(
        {
          latitude: merchant.location.latitude!,
          longitude: merchant.location.longitude!,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        220,
      )
    },
    [mappable, mapReady],
  )

  useEffect(() => {
    if (selectedId) focusMerchant(selectedId)
  }, [selectedId, focusMerchant])

  const showUserLocation = geoGranted && Boolean(userLocation)

  return (
    <View style={styles.host} pointerEvents="box-none">
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        mapType="none"
        initialRegion={region}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        loadingEnabled
        onMapReady={() => setMapReady(true)}
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} flipY={false} />
        {showUserLocation && userLocation && radiusKm ? (
          <Circle
            center={{
              latitude: userLocation.lat,
              longitude: userLocation.lng,
            }}
            radius={radiusKm * 1000}
            strokeColor="rgba(217, 119, 6, 0.85)"
            fillColor="rgba(245, 158, 11, 0.12)"
            strokeWidth={2}
          />
        ) : null}

        {mappable.map(merchant => {
          const selected = merchant.id === selectedId
          return (
            <Marker
              key={merchant.id}
              coordinate={{
                latitude: merchant.location!.latitude!,
                longitude: merchant.location!.longitude!,
              }}
              title={merchant.business_name}
              pinColor={Platform.OS === 'ios' ? (selected ? colors.brand500 : colors.slate900) : undefined}
              onPress={() => onSelect(merchant.id)}
              zIndex={selected ? 2 : 1}
            />
          )
        })}
      </MapView>
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  map: {
    flex: 1,
    backgroundColor: '#eef2f6',
  },
})
