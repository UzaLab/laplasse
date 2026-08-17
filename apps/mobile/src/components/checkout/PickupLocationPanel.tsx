import { Pressable, StyleSheet, Text, View } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import type { CartPickupLocation } from '@laplasse/api-client'
import { shouldUseOsmWebMap } from '@/src/lib/googleMaps'
import { openDirectionsTo, openDirectionsToAddress } from '@/src/lib/mapsUtils'
import { colors, fonts, homeLayout } from '@/src/theme'

export function PickupLocationPanel({ locations }: { locations: CartPickupLocation[] }) {
  if (!locations.length) return null

  return (
    <View style={styles.wrap}>
      {locations.map(loc => {
        const hasCoords = loc.latitude != null && loc.longitude != null
        const hasAddress = Boolean(loc.address?.trim())

        return (
          <View key={loc.id} style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Ionicons name="location" size={18} color={colors.brand600} />
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{loc.name}</Text>
                <Text style={styles.address}>
                  {hasAddress
                    ? loc.address
                    : 'Adresse exacte non renseignée — contactez l\'établissement si besoin.'}
                </Text>
              </View>
            </View>
            {hasCoords && !shouldUseOsmWebMap() ? (
              <View style={styles.mapWrap}>
                <MapView
                  style={StyleSheet.absoluteFill}
                  provider={PROVIDER_GOOGLE}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  initialRegion={{
                    latitude: loc.latitude!,
                    longitude: loc.longitude!,
                    latitudeDelta: 0.008,
                    longitudeDelta: 0.008,
                  }}
                >
                  <Marker coordinate={{ latitude: loc.latitude!, longitude: loc.longitude! }} />
                </MapView>
              </View>
            ) : null}
            {hasCoords ? (
              <Pressable
                onPress={() => void openDirectionsTo(loc.latitude!, loc.longitude!)}
                style={styles.directionsBtn}
              >
                <Ionicons name="navigate" size={16} color={colors.brand600} />
                <Text style={styles.directionsText}>Itinéraire Google Maps</Text>
              </Pressable>
            ) : hasAddress ? (
              <Pressable
                onPress={() => void openDirectionsToAddress(loc.address!)}
                style={styles.directionsBtn}
              >
                <Ionicons name="navigate" size={16} color={colors.brand600} />
                <Text style={styles.directionsText}>Voir sur Google Maps</Text>
              </Pressable>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', gap: 12 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.brand50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
  address: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 2, lineHeight: 18 },
  mapWrap: {
    height: 140,
    borderRadius: homeLayout.radiusLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  directionsText: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand600 },
})
