'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export interface DispatchMapCourier {
  id: string
  label: string
  lat: number | null
  lng: number | null
  is_online: boolean
  active_jobs: number
}

export interface DispatchMapJob {
  id: string
  label: string
  lat: number | null
  lng: number | null
  status: string
  is_urgent?: boolean
}

interface Props {
  couriers: DispatchMapCourier[]
  jobs: DispatchMapJob[]
  selectedJobId?: string | null
  onSelectJob?: (jobId: string) => void
  className?: string
}

function courierIcon(online: boolean, busy: boolean) {
  const color = !online ? '#94a3b8' : busy ? '#6366f1' : '#10b981'
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function jobIcon(urgent: boolean, selected: boolean) {
  const color = urgent ? '#ef4444' : '#f59e0b'
  const ring = selected ? '0 0 0 3px rgba(99,102,241,.45)' : '0 1px 4px rgba(0,0,0,.35)'
  return L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:4px;background:${color};border:2px solid white;box-shadow:${ring};transform:rotate(45deg)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  })
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap()
  const key = points.map(p => p.join(',')).join('|')

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    map.fitBounds(L.latLngBounds(points), { padding: [32, 32], maxZoom: 14 })
  }, [map, key, points])

  return null
}

export function LogisticsDispatchMap({
  couriers,
  jobs,
  selectedJobId,
  onSelectJob,
  className,
}: Props) {
  const points = useMemo(() => {
    const pts: Array<[number, number]> = []
    for (const c of couriers) {
      if (c.lat != null && c.lng != null) pts.push([c.lat, c.lng])
    }
    for (const j of jobs) {
      if (j.lat != null && j.lng != null) pts.push([j.lat, j.lng])
    }
    return pts
  }, [couriers, jobs])

  const center = useMemo((): [number, number] => {
    if (points.length === 0) return [5.3599517, -4.0082563]
    const sum = points.reduce((acc, p) => [acc[0] + p[0], acc[1] + p[1]] as [number, number], [0, 0])
    return [sum[0] / points.length, sum[1] / points.length]
  }, [points])

  useEffect(() => {
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 200)
    return () => window.clearTimeout(t)
  }, [points.length])

  return (
    <div className={className ?? 'h-72 lg:h-80 w-full rounded-[28px] overflow-hidden border border-slate-200 bg-slate-100'}>
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />

        {couriers.map(c => {
          if (c.lat == null || c.lng == null) return null
          const busy = c.active_jobs > 0
          return (
            <Marker
              key={`c-${c.id}`}
              position={[c.lat, c.lng]}
              icon={courierIcon(c.is_online, busy)}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <span className="text-xs font-semibold">{c.label}</span>
                <br />
                <span className="text-[10px]">{c.is_online ? (busy ? 'En course' : 'Disponible') : 'Hors ligne'}</span>
              </Tooltip>
            </Marker>
          )
        })}

        {jobs.map(j => {
          if (j.lat == null || j.lng == null) return null
          return (
            <Marker
              key={`j-${j.id}`}
              position={[j.lat, j.lng]}
              icon={jobIcon(!!j.is_urgent, j.id === selectedJobId)}
              eventHandlers={{
                click: () => onSelectJob?.(j.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                <span className="text-xs font-semibold">{j.label}</span>
                {j.is_urgent && <span className="text-[10px] text-red-600 block">Urgent</span>}
              </Tooltip>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
