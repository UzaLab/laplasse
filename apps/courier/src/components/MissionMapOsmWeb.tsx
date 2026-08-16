import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { buildMissionMapHtml, missionMapCenter } from '@/src/components/missionMapHtml'
import type { MissionMapProps } from '@/src/components/MissionMap'
import { colors, fonts } from '@/src/theme'

/** Carte mission OSM via WebView — fallback Android sans clé Google Maps SDK. */
export function MissionMapOsmWeb({
  pickupLabel,
  dropoffLabel,
  courierLat,
  courierLng,
}: MissionMapProps) {
  const { lat, lng } = missionMapCenter(courierLat, courierLng)

  const html = useMemo(
    () => buildMissionMapHtml({ lat, lng, pickupLabel, dropoffLabel }),
    [lat, lng, pickupLabel, dropoffLabel],
  )

  return (
    <View style={styles.wrap}>
      <WebView
        style={styles.map}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        scrollEnabled={false}
        bounces={false}
      />
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
