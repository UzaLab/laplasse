'use client'

import { useEffect, useMemo } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import type { ApiMerchant } from '@/lib/api'
import { brandColors } from '@/lib/brandColors'
import type { UserCoordinates } from './useSearchMobileNearby'

interface SearchMobileMapProps {
  merchants: ApiMerchant[]
  selectedId: string | null
  onSelect: (id: string) => void
  center: { lat: number; lng: number }
  userLocation?: UserCoordinates | null
  radiusKm?: number
}

function FitMapView({
  center,
  points,
  userLocation,
  radiusKm,
}: {
  center: { lat: number; lng: number }
  points: Array<{ lat: number; lng: number }>
  userLocation?: UserCoordinates | null
  radiusKm?: number
}) {
  const map = useMap()

  useEffect(() => {
    const allPoints = [...points]
    if (userLocation) {
      allPoints.push(userLocation)
    }

    if (userLocation && radiusKm) {
      map.setView([userLocation.lat, userLocation.lng], radiusKm <= 3 ? 14 : radiusKm <= 6 ? 13 : 12)
      return
    }

    if (allPoints.length === 0) {
      map.setView([center.lat, center.lng], 13)
      return
    }
    if (allPoints.length === 1) {
      map.setView([allPoints[0].lat, allPoints[0].lng], 14)
      return
    }
    const bounds = L.latLngBounds(allPoints.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [88, 48], maxZoom: 15 })
  }, [map, center, points, userLocation, radiusKm])

  return null
}

function createPinIcon(active: boolean) {
  const size = active ? 48 : 40
  const { 500: brand500, slate200, white } = brandColors
  const html = `
    <div style="position:relative;width:${size}px;height:${size + 8}px;display:flex;justify-content:center;">
      <div style="
        width:${active ? 48 : 40}px;height:${active ? 48 : 40}px;border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        background:${active ? brand500 : white};
        border:${active ? `2px solid ${white}` : `1px solid ${slate200}`};
        box-shadow:0 4px 12px rgba(15,23,42,0.15);
      ">
        <span style="width:${active ? 12 : 10}px;height:${active ? 12 : 10}px;border-radius:9999px;background:${active ? white : brand500};"></span>
      </div>
      <div style="
        position:absolute;bottom:0;left:50%;transform:translateX(-50%);
        width:0;height:0;
        border-left:${active ? 8 : 6}px solid transparent;
        border-right:${active ? 8 : 6}px solid transparent;
        border-top:${active ? 10 : 8}px solid ${active ? brand500 : white};
      "></div>
    </div>
  `

  return L.divIcon({
    className: 'search-mobile-map-pin !bg-transparent !border-0',
    html,
    iconSize: [size, size + 8],
    iconAnchor: [size / 2, size + 8],
  })
}

const userLocationIcon = L.divIcon({
  className: 'search-mobile-user-pin !bg-transparent !border-0',
  html: `
    <div style="position:relative;width:18px;height:18px;">
      <div style="width:18px;height:18px;border-radius:9999px;background:${brandColors.slate900};border:3px solid ${brandColors.white};box-shadow:0 2px 8px rgba(15,23,42,0.35);"></div>
      <div style="position:absolute;inset:-8px;border-radius:9999px;border:2px solid rgba(245,158,11,0.45);"></div>
    </div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

export function SearchMobileMap({
  merchants,
  selectedId,
  onSelect,
  center,
  userLocation,
  radiusKm = 2,
}: SearchMobileMapProps) {
  const mappable = useMemo(
    () =>
      merchants.filter(
        m => m.location?.latitude != null && m.location?.longitude != null,
      ),
    [merchants],
  )

  const points = useMemo(
    () =>
      mappable.map(m => ({
        lat: m.location!.latitude!,
        lng: m.location!.longitude!,
      })),
    [mappable],
  )

  const mapCenter = userLocation ?? center

  return (
    <div className="laplasse-leaflet-map absolute inset-0 z-0 bg-slate-100">
      <MapContainer
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={13}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitMapView
          center={center}
          points={points}
          userLocation={userLocation}
          radiusKm={radiusKm}
        />

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: brandColors[500],
                fillColor: brandColors[400],
                fillOpacity: 0.1,
                weight: 2,
              }}
            />
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
              zIndexOffset={2000}
            />
          </>
        )}

        {mappable.map(merchant => {
          const lat = merchant.location!.latitude!
          const lng = merchant.location!.longitude!
          const active = merchant.id === selectedId

          return (
            <Marker
              key={merchant.id}
              position={[lat, lng]}
              icon={createPinIcon(active)}
              eventHandlers={{
                click: () => onSelect(merchant.id),
              }}
              zIndexOffset={active ? 1000 : 0}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
