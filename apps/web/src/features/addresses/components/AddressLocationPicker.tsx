'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { coordsFromGeoEntity } from '@/lib/cityCoords'

const pinIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface GeoHint {
  latitude?: number | null
  longitude?: number | null
  slug?: string
  name?: string
  country?: string
}

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (coords: { latitude: number; longitude: number } | null) => void
  city?: GeoHint | null
  commune?: GeoHint | null
  className?: string
}

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [map, lat, lng])
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

export function AddressLocationPicker({
  latitude,
  longitude,
  onChange,
  city,
  commune,
  className,
}: Props) {
  const [gpsLoading, setGpsLoading] = useState(false)

  const defaultCenter = useMemo(() => {
    if (latitude != null && longitude != null) return { lat: latitude, lng: longitude }
    if (commune) {
      return coordsFromGeoEntity({
        latitude: commune.latitude,
        longitude: commune.longitude,
        slug: commune.slug,
        name: commune.name,
        country: commune.country,
      })
    }
    if (city) {
      return coordsFromGeoEntity({
        latitude: city.latitude,
        longitude: city.longitude,
        slug: city.slug,
        name: city.name,
        country: city.country,
      })
    }
    return coordsFromGeoEntity({})
  }, [latitude, longitude, commune, city])

  const pin = latitude != null && longitude != null
    ? { lat: latitude, lng: longitude }
    : defaultCenter

  useEffect(() => {
    if (latitude == null && longitude == null && commune?.latitude != null && commune.longitude != null) {
      onChange({ latitude: commune.latitude!, longitude: commune.longitude! })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commune?.id, city?.id])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  return (
    <div className={className ?? 'space-y-2'}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Point GPS sur la carte
        </p>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={gpsLoading}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-800 disabled:opacity-50"
        >
          {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
          Ma position
        </button>
      </div>
      <div className="h-52 w-full rounded-2xl overflow-hidden border border-slate-200">
        <MapContainer
          center={[pin.lat, pin.lng]}
          zoom={15}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter lat={pin.lat} lng={pin.lng} />
          <DraggablePin
            position={[pin.lat, pin.lng]}
            onDrag={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
          />
        </MapContainer>
      </div>
      <p className="text-[11px] text-slate-400">
        Déplacez le pin pour indiquer l&apos;entrée exacte — utilisé pour le suivi livreur.
        {latitude != null && longitude != null && (
          <span className="block font-mono text-slate-500 mt-0.5">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </p>
    </div>
  )
}
