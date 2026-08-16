import { DEFAULT_MAP_CENTER } from '@/src/lib/mapTiles'

export function buildMissionMapHtml(opts: {
  lat: number
  lng: number
  pickupLabel?: string | null
  dropoffLabel?: string | null
}) {
  const pickup = JSON.stringify(opts.pickupLabel ?? 'Retrait')
  const dropoff = JSON.stringify(opts.dropoffLabel ?? 'Livraison')
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
  var map = L.map('map', { zoomControl: false }).setView([${opts.lat}, ${opts.lng}], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
  L.marker([${opts.lat + 0.008}, ${opts.lng - 0.008}]).addTo(map).bindPopup(${pickup});
  L.marker([${opts.lat - 0.008}, ${opts.lng + 0.008}]).addTo(map).bindPopup(${dropoff});
  L.circleMarker([${opts.lat}, ${opts.lng}], { radius: 8, color: '#059669', fillColor: '#059669', fillOpacity: 0.9 }).addTo(map).bindPopup('Vous');
</script>
</body></html>`
}

export function missionMapCenter(
  courierLat?: number | null,
  courierLng?: number | null,
): { lat: number; lng: number } {
  return {
    lat: courierLat ?? DEFAULT_MAP_CENTER.latitude,
    lng: courierLng ?? DEFAULT_MAP_CENTER.longitude,
  }
}
