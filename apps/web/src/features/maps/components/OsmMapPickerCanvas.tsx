'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

function MapRecenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], zoom)
  }, [map, lat, lng, zoom])
  return null
}

function DraggablePin({
  position,
  onDrag,
}: {
  position: [number, number]
  onDrag: (lat: number, lng: number) => void
}) {
  const markerRef = useRef<L.Marker | null>(null)

  return (
    <Marker
      draggable
      position={position}
      icon={pinIcon}
      ref={markerRef}
      eventHandlers={{
        dragend: () => {
          const ll = markerRef.current?.getLatLng()
          if (ll) onDrag(ll.lat, ll.lng)
        },
      }}
    />
  )
}

interface Props {
  lat: number
  lng: number
  zoom: number
  onDrag: (lat: number, lng: number) => void
  className?: string
}

export function OsmMapPickerCanvas({ lat, lng, zoom, onDrag, className }: Props) {
  return (
    <div className={className ?? 'laplasse-leaflet-map h-52 w-full rounded-2xl border border-slate-200'}>
      <MapContainer
        center={[lat, lng]}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapRecenter lat={lat} lng={lng} zoom={zoom} />
        <DraggablePin
          position={[lat, lng]}
          onDrag={onDrag}
        />
      </MapContainer>
    </div>
  )
}
