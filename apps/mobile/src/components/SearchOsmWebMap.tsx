import type { ApiMerchant } from '@laplasse/api-client'
import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { UserCoordinates } from '@/src/hooks/useSearchMobileNearby'
import { buildSearchMapHtml } from '@/src/lib/searchMapHtml'

interface SearchOsmWebMapProps {
  merchants: ApiMerchant[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: { lat: number; lng: number }
  userLocation?: UserCoordinates | null
  radiusKm?: number
}

export function SearchOsmWebMap({
  merchants,
  selectedId,
  onSelect,
  center,
  userLocation,
  radiusKm,
}: SearchOsmWebMapProps) {
  const mappable = useMemo(
    () =>
      merchants
        .filter(m => m.location?.latitude != null && m.location?.longitude != null)
        .map(m => ({
          id: m.id,
          name: m.business_name,
          lat: m.location!.latitude!,
          lng: m.location!.longitude!,
        })),
    [merchants],
  )

  const html = useMemo(
    () =>
      buildSearchMapHtml({
        center,
        merchants: mappable,
        selectedId,
        userLocation: userLocation ?? null,
        radiusKm,
      }),
    [center, mappable, selectedId, userLocation, radiusKm],
  )

  return (
    <View style={styles.host} pointerEvents="box-none">
      <WebView
        style={styles.map}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        onMessage={event => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as { type?: string; id?: string }
            if (data.type === 'select' && data.id) onSelect(data.id)
          } catch {
            // ignore malformed messages
          }
        }}
      />
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
