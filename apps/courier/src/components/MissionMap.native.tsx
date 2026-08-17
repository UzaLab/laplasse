import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import type { MissionMapProps } from '@/src/components/MissionMap'
import { MissionMapOsmWeb } from '@/src/components/MissionMapOsmWeb'
import { missionMapCenter } from '@/src/components/missionMapHtml'
import { shouldUseOsmWebMap } from '@/src/lib/googleMaps'
import { colors, fonts } from '@/src/theme'

export function MissionMap(props: MissionMapProps) {
  if (shouldUseOsmWebMap()) {
    return <MissionMapOsmWeb {...props} />
  }
  return <MissionMapGoogle {...props} />
}

function MissionMapGoogle({
  pickupLabel,
  dropoffLabel,
  courierLat,
  courierLng,
}: MissionMapProps) {
  const { lat, lng } = missionMapCenter(courierLat, courierLng)

  const region = useMemo(
    () => ({
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.06,
      longitudeDelta: 0.06,
    }),
    [lat, lng],
  )

  return (
    <View style={styles.wrap}>
      <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={region}>
        {courierLat != null && courierLng != null ? (
          <Marker
            coordinate={{ latitude: courierLat, longitude: courierLng }}
            title="Vous"
            pinColor="#059669"
          />
        ) : null}
        {pickupLabel ? (
          <Marker coordinate={{ latitude: lat + 0.008, longitude: lng - 0.01 }} title="Retrait" description={pickupLabel} />
        ) : null}
        {dropoffLabel ? (
          <Marker coordinate={{ latitude: lat - 0.006, longitude: lng + 0.012 }} title="Livraison" description={dropoffLabel} />
        ) : null}
      </MapView>
      {!courierLat || !courierLng ? (
        <Text style={styles.gpsHint}>Position GPS simulée — activez la localisation sur mobile</Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  map: { flex: 1 },
  gpsHint: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 4,
    borderRadius: 8,
  },
})
