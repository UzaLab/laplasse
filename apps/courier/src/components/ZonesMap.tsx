import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import type { MapZonePoint } from '@/src/lib/geoCoords'
import { DEFAULT_MAP_CENTER } from '@/src/lib/mapTiles'
import { colors } from '@/src/theme'

function buildZonesMapHtml(zones: MapZonePoint[]) {
  const zonesJson = JSON.stringify(zones)
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;height:100%;width:100%;}</style>
</head><body>
<div id="map"></div>
<script>
  var zones = ${zonesJson};
  var defaultCenter = [${DEFAULT_MAP_CENTER.latitude}, ${DEFAULT_MAP_CENTER.longitude}];
  var map = L.map('map', { zoomControl: true, scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  if (!zones.length) {
    map.setView(defaultCenter, 12);
  } else {
    var bounds = L.latLngBounds([]);
    zones.forEach(function(z) {
      var r = z.radiusMeters || 2800;
      L.marker([z.lat, z.lng]).addTo(map).bindPopup(z.label || '');
      L.circle([z.lat, z.lng], {
        radius: r,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: zones.length > 1 ? 0.18 : 0.12,
        weight: 2
      }).addTo(map);
      var dLat = r / 111320;
      var dLng = r / (111320 * Math.cos(z.lat * Math.PI / 180));
      bounds.extend([z.lat - dLat, z.lng - dLng]);
      bounds.extend([z.lat + dLat, z.lng + dLng]);
    });
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 13 });
  }
</script>
</body></html>`
}

export function ZonesMap({ zones }: { zones: MapZonePoint[] }) {
  const html = useMemo(() => buildZonesMapHtml(zones), [zones])

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
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: 288,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  map: { flex: 1 },
})
