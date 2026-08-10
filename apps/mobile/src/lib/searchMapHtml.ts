export interface SearchMapMerchantPin {
  id: string
  lat: number
  lng: number
}

export interface SearchMapPayload {
  center: { lat: number; lng: number }
  userLocation: { lat: number; lng: number } | null
  radiusKm: number
  merchants: SearchMapMerchantPin[]
  selectedId: string | null
}

export function buildSearchMapHtml(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
  <style>
    html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; background: #eef2f6; }
    .merchant-pin { background: transparent; border: 0; }
    .merchant-pin-inner {
      width: 40px; height: 40px; border-radius: 9999px;
      display: flex; align-items: center; justify-content: center;
      background: #fff; border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(15,23,42,0.15);
      position: relative;
    }
    .merchant-pin-inner.active {
      width: 48px; height: 48px; background: #f59e0b; border: 2px solid #fff;
    }
    .merchant-pin-dot {
      width: 10px; height: 10px; border-radius: 9999px; background: #f59e0b;
    }
    .merchant-pin-inner.active .merchant-pin-dot { background: #fff; width: 12px; height: 12px; }
    .user-pin {
      width: 18px; height: 18px; border-radius: 9999px;
      background: #0f172a; border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(15,23,42,0.35);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const BRAND = '#f59e0b';
    let map, radiusCircle, userMarker;
    const merchantMarkers = new Map();

    function post(type, payload) {
      const msg = JSON.stringify({ type, ...payload });
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(msg);
      else if (window.parent) window.parent.postMessage(msg, '*');
    }

    function pinIcon(active) {
      return L.divIcon({
        className: 'merchant-pin',
        html: '<div class="merchant-pin-inner' + (active ? ' active' : '') + '"><div class="merchant-pin-dot"></div></div>',
        iconSize: active ? [48, 48] : [40, 40],
        iconAnchor: active ? [24, 48] : [20, 40],
      });
    }

    function fitView(data) {
      const points = data.merchants.map(m => [m.lat, m.lng]);
      if (data.userLocation) {
        points.push([data.userLocation.lat, data.userLocation.lng]);
        const zoom = data.radiusKm <= 3 ? 14 : data.radiusKm <= 6 ? 13 : 12;
        map.setView([data.userLocation.lat, data.userLocation.lng], zoom);
        return;
      }
      if (points.length === 0) {
        map.setView([data.center.lat, data.center.lng], 13);
        return;
      }
      if (points.length === 1) {
        map.setView(points[0], 14);
        return;
      }
      map.fitBounds(L.latLngBounds(points), { padding: [88, 48], maxZoom: 15 });
    }

    window.updateMap = function(data) {
      if (!map) {
        map = L.map('map', { zoomControl: false, attributionControl: false })
          .setView([data.center.lat, data.center.lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);
      }

      fitView(data);

      if (data.userLocation) {
        if (!userMarker) {
          userMarker = L.marker([data.userLocation.lat, data.userLocation.lng], {
            icon: L.divIcon({
              className: 'user-pin-wrap',
              html: '<div class="user-pin"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
            zIndexOffset: 2000,
          }).addTo(map);
        } else {
          userMarker.setLatLng([data.userLocation.lat, data.userLocation.lng]);
        }

        if (radiusCircle) map.removeLayer(radiusCircle);
        radiusCircle = L.circle([data.userLocation.lat, data.userLocation.lng], {
          radius: data.radiusKm * 1000,
          color: BRAND,
          fillColor: '#fbbf24',
          fillOpacity: 0.1,
          weight: 2,
        }).addTo(map);
      } else if (radiusCircle) {
        map.removeLayer(radiusCircle);
        radiusCircle = null;
      }

      const seen = new Set();
      data.merchants.forEach(m => {
        seen.add(m.id);
        const active = m.id === data.selectedId;
        const existing = merchantMarkers.get(m.id);
        if (existing) {
          existing.setIcon(pinIcon(active));
          existing.setZIndexOffset(active ? 1000 : 0);
        } else {
          const marker = L.marker([m.lat, m.lng], {
            icon: pinIcon(active),
            zIndexOffset: active ? 1000 : 0,
          }).addTo(map);
          marker.on('click', () => post('select', { id: m.id }));
          merchantMarkers.set(m.id, marker);
        }
      });

      merchantMarkers.forEach((marker, id) => {
        if (!seen.has(id)) {
          map.removeLayer(marker);
          merchantMarkers.delete(id);
        }
      });

      setTimeout(() => map.invalidateSize(), 50);
    };

    post('ready', {});
  <\/script>
</body>
</html>`
}

export function buildMapUpdateScript(payload: SearchMapPayload): string {
  return `window.updateMap && window.updateMap(${JSON.stringify(payload)}); true;`
}
