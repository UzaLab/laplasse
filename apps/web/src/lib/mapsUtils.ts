/** Lien Google Maps avec itinéraire depuis la position utilisateur (si fournie). */
export function googleMapsDirectionsUrl(
  destLat: number,
  destLng: number,
  originLat?: number | null,
  originLng?: number | null,
): string {
  const destination = `${destLat},${destLng}`
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode: 'driving',
  })
  if (originLat != null && originLng != null) {
    params.set('origin', `${originLat},${originLng}`)
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Embed OpenStreetMap (iframe) centré sur un point. */
export function osmEmbedUrl(lat: number, lng: number, delta = 0.012): string {
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`
}

/** Ouvre Google Maps avec itinéraire ; tente la géoloc utilisateur d'abord. */
export function openDirectionsTo(destLat: number, destLng: number): void {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    window.open(googleMapsDirectionsUrl(destLat, destLng), '_blank', 'noopener,noreferrer')
    return
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      window.open(
        googleMapsDirectionsUrl(destLat, destLng, pos.coords.latitude, pos.coords.longitude),
        '_blank',
        'noopener,noreferrer',
      )
    },
    () => {
      window.open(googleMapsDirectionsUrl(destLat, destLng), '_blank', 'noopener,noreferrer')
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  )
}
