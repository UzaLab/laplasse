'use client'

import { useMemo } from 'react'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { coordsFromGeoEntity } from '@/lib/cityCoords'

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface Props {
  latitude: number
  longitude: number
  label?: string
  className?: string
  heightClass?: string
}

export function StaticLocationMap({
  latitude,
  longitude,
  label,
  className,
  heightClass = 'h-56',
}: Props) {
  const center = useMemo(
    () => coordsFromGeoEntity({ latitude, longitude }),
    [latitude, longitude],
  )

  return (
    <div className={className ?? 'w-full rounded-2xl overflow-hidden border border-slate-200'}>
      <div className={`laplasse-leaflet-map ${heightClass} w-full`}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={16}
          scrollWheelZoom={false}
          dragging
          className="h-full w-full"
          aria-label={label ?? 'Carte de localisation'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={pinIcon} />
        </MapContainer>
      </div>
    </div>
  )
}
