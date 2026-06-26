'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Crosshair, Loader2, MapPin, Search, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { coordsFromGeoEntity } from '@/lib/cityCoords'
import { getCountryCode } from '@/lib/country'
import { searchGeoPlaces, type GeoPlaceResult } from '@/lib/geoApi'
import { useDebounce } from '@/lib/hooks/useDebounce'

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

export function AddressLocationPicker({
  latitude,
  longitude,
  onChange,
  city,
  commune,
  className,
}: Props) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [placeQuery, setPlaceQuery] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchResults, setSearchResults] = useState<GeoPlaceResult[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [mapZoom, setMapZoom] = useState(15)
  const searchRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(placeQuery, 450)
  const countryCode = city?.country ?? getCountryCode()

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
  }, [commune?.latitude, commune?.longitude, latitude, longitude, onChange])

  useEffect(() => {
    const q = debouncedQuery.trim()
    if (q.length < 2) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    let cancelled = false
    setSearchLoading(true)

    void searchGeoPlaces(q, {
      country: countryCode,
      lat: pin.lat,
      lng: pin.lng,
      limit: 8,
    }).then(res => {
      if (cancelled) return
      setSearchResults(res.ok ? res.data : [])
      setSearchLoading(false)
      setSearchOpen(true)
    })

    return () => { cancelled = true }
  }, [debouncedQuery, countryCode, pin.lat, pin.lng])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setMapZoom(16)
        setGpsLoading(false)
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const selectPlace = (place: GeoPlaceResult) => {
    onChange({ latitude: place.latitude, longitude: place.longitude })
    setMapZoom(17)
    setPlaceQuery(place.label.split(',')[0]?.trim() ?? place.label)
    setSearchOpen(false)
    setSearchResults([])
  }

  const searchHint = [commune?.name, city?.name].filter(Boolean).join(', ')

  return (
    <div className={className ?? 'laplasse-leaflet-host space-y-2'}>
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

      <div ref={searchRef} className="relative z-30">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
        <input
          type="search"
          value={placeQuery}
          onChange={e => {
            setPlaceQuery(e.target.value)
            setSearchOpen(true)
          }}
          onFocus={() => {
            if (searchResults.length) setSearchOpen(true)
          }}
          placeholder={searchHint ? `Rechercher un lieu (${searchHint})…` : 'Rechercher une adresse ou un lieu…'}
          className="w-full h-10 pl-9 pr-9 text-sm border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 bg-white"
          autoComplete="off"
        />
        {placeQuery && (
          <button
            type="button"
            onClick={() => {
              setPlaceQuery('')
              setSearchResults([])
              setSearchOpen(false)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}

        {searchOpen && (searchLoading || searchResults.length > 0 || debouncedQuery.trim().length >= 2) && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {searchLoading && (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                Recherche OpenStreetMap…
              </div>
            )}
            {!searchLoading && searchResults.length === 0 && debouncedQuery.trim().length >= 2 && (
              <p className="px-3 py-3 text-sm text-slate-400">Aucun lieu trouvé.</p>
            )}
            {!searchLoading && searchResults.map(place => (
              <button
                key={place.id}
                type="button"
                onClick={() => selectPlace(place)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-start gap-2"
              >
                <MapPin size={14} className="text-brand-500 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-800 line-clamp-1">
                    {place.label.split(',')[0]}
                  </span>
                  <span className="block text-xs text-slate-400 line-clamp-2">{place.label}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="laplasse-leaflet-map h-52 w-full rounded-2xl border border-slate-200">
        <MapContainer
          center={[pin.lat, pin.lng]}
          zoom={mapZoom}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapRecenter lat={pin.lat} lng={pin.lng} zoom={mapZoom} />
          <DraggablePin
            position={[pin.lat, pin.lng]}
            onDrag={(lat, lng) => onChange({ latitude: lat, longitude: lng })}
          />
        </MapContainer>
      </div>
      <p className="text-[11px] text-slate-400">
        Recherchez un lieu ou déplacez le pin pour indiquer l&apos;entrée exacte.
        {latitude != null && longitude != null && (
          <span className="block font-mono text-slate-500 mt-0.5">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </span>
        )}
      </p>
    </div>
  )
}
