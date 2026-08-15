import { OSM_TILE_URL } from '@/src/lib/mapTiles'

type MapMerchant = {
  id: string
  name: string
  lat: number
  lng: number
}

export function buildSearchMapHtml(input: {
  center: { lat: number; lng: number }
  merchants: MapMerchant[]
  selectedId: string | null
  userLocation?: { lat: number; lng: number } | null
  radiusKm?: number
}): string {
  const payload = JSON.stringify(input).replace(/</g, '\\u003c')
  const tileUrl = OSM_TILE_URL

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #eef2f6; }
    .leaflet-control-attribution { font-size: 10px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const DATA = ${payload};
    const map = L.map('map', { zoomControl: false, attributionControl: true });
    L.tileLayer('${tileUrl}', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

    const markers = {};
    let circle = null;

    function post(type, payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...payload }));
      }
    }

    function pinIcon(active) {
      const color = active ? '#f59e0b' : '#0f172a';
      const size = active ? 14 : 11;
      return L.divIcon({
        className: '',
        html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:9999px;background:' + color + ';border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.25);"></div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
    }

    function render() {
      Object.keys(markers).forEach(id => {
        map.removeLayer(markers[id]);
        delete markers[id];
      });
      if (circle) {
        map.removeLayer(circle);
        circle = null;
      }

      DATA.merchants.forEach(m => {
        const marker = L.marker([m.lat, m.lng], {
          icon: pinIcon(m.id === DATA.selectedId),
        }).addTo(map);
        marker.on('click', () => post('select', { id: m.id }));
        markers[m.id] = marker;
      });

      if (DATA.userLocation && DATA.radiusKm) {
        circle = L.circle([DATA.userLocation.lat, DATA.userLocation.lng], {
          radius: DATA.radiusKm * 1000,
          color: 'rgba(217, 119, 6, 0.85)',
          fillColor: 'rgba(245, 158, 11, 0.12)',
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(map);
      }

      const points = DATA.merchants.map(m => [m.lat, m.lng]);
      if (DATA.userLocation) points.push([DATA.userLocation.lat, DATA.userLocation.lng]);

      if (DATA.userLocation && DATA.radiusKm) {
        map.setView([DATA.userLocation.lat, DATA.userLocation.lng], DATA.radiusKm <= 3 ? 14 : DATA.radiusKm <= 6 ? 13 : 12);
      } else if (points.length === 0) {
        map.setView([DATA.center.lat, DATA.center.lng], 13);
      } else if (points.length === 1) {
        map.setView(points[0], 14);
      } else {
        map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
      }

      setTimeout(() => map.invalidateSize(), 50);
      setTimeout(() => map.invalidateSize(), 300);
    }

    render();
  </script>
</body>
</html>`
}
