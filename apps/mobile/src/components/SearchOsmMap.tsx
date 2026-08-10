import type { ApiMerchant } from '@laplasse/api-client'
import type { ComponentType } from 'react'
import { useEffect, useMemo, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import RNWebView from 'react-native-webview'
import type { WebViewMessageEvent } from 'react-native-webview/lib/WebViewTypes'
import type { UserCoordinates } from '@/src/hooks/useSearchMobileNearby'

const WebView = RNWebView as ComponentType<Record<string, unknown>>
import {
  buildMapUpdateScript,
  buildSearchMapHtml,
  type SearchMapPayload,
} from '@/src/lib/searchMapHtml'

interface SearchOsmMapProps {
  merchants: ApiMerchant[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: { lat: number; lng: number }
  userLocation?: UserCoordinates | null
  radiusKm?: number
}

export function SearchOsmMap({
  merchants,
  selectedId,
  onSelect,
  center,
  userLocation,
  radiusKm = 2,
}: SearchOsmMapProps) {
  const webRef = useRef<{ injectJavaScript: (script: string) => void } | null>(null)
  const readyRef = useRef(false)
  const html = useMemo(() => buildSearchMapHtml(), [])

  const mappable = useMemo(
    () =>
      merchants.filter(
        m => m.location?.latitude != null && m.location?.longitude != null,
      ),
    [merchants],
  )

  const payload: SearchMapPayload = useMemo(
    () => ({
      center,
      userLocation: userLocation ?? null,
      radiusKm,
      selectedId,
      merchants: mappable.map(m => ({
        id: m.id,
        lat: m.location!.latitude!,
        lng: m.location!.longitude!,
      })),
    }),
    [center, userLocation, radiusKm, selectedId, mappable],
  )

  useEffect(() => {
    if (!readyRef.current) return
    webRef.current?.injectJavaScript(buildMapUpdateScript(payload))
  }, [payload])

  function onMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { type: string; id?: string }
      if (data.type === 'ready') {
        readyRef.current = true
        webRef.current?.injectJavaScript(buildMapUpdateScript(payload))
      }
      if (data.type === 'select' && data.id) onSelect(data.id)
    } catch {
      /* ignore */
    }
  }

  return (
    <View style={styles.host} pointerEvents="box-none">
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html }}
        style={styles.webview}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        {...(Platform.OS === 'android' ? { androidLayerType: 'hardware' as const } : {})}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: '#eef2f6',
  },
})
