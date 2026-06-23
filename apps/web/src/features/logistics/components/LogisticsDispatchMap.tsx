'use client'

import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import { cn } from '@/lib/utils'

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
  title?: string
  subtitle?: string
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

function MapResizeFix({ pointCount }: { pointCount: number }) {
  const map = useMap()

  useEffect(() => {
    const t = window.setTimeout(() => {
      map.invalidateSize()
      window.dispatchEvent(new Event('resize'))
    }, 200)
    return () => window.clearTimeout(t)
  }, [map, pointCount])

  return null
}

export function LogisticsDispatchMap({
  couriers,
  jobs,
  selectedJobId,
  onSelectJob,
  className,
  title = 'Carte live',
  subtitle,
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
    const sum = points.reduce(
      (acc, p) => [acc[0] + p[0], acc[1] + p[1]] as [number, number],
      [0, 0],
    )
    return [sum[0] / points.length, sum[1] / points.length]
  }, [points])

  const onlineCount = couriers.filter(c => c.is_online).length
  const jobCount = jobs.length
  const resolvedSubtitle = subtitle ?? (
    points.length === 0
      ? 'Position des livreurs et courses dès qu\'une localisation est disponible.'
      : `${onlineCount} livreur${onlineCount !== 1 ? 's' : ''} localisé${onlineCount !== 1 ? 's' : ''}${jobCount > 0 ? ` · ${jobCount} course${jobCount !== 1 ? 's' : ''}` : ''}`
  )

  return (
    <section
      className={cn(
        'logistics-dispatch-map relative z-20 bg-white rounded-[28px] border border-slate-100 shadow-sm',
        className,
      )}
    >
      <div className="px-5 py-4 border-b border-slate-50 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-900">
            <MapPin size={16} className="text-indigo-600 shrink-0" />
            <p className="text-sm font-extrabold">{title}</p>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{resolvedSubtitle}</p>
        </div>
      </div>

      <div className="logistics-dispatch-map__canvas h-72 lg:h-80 w-full">
        <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds points={points} />
          <MapResizeFix pointCount={points.length} />

          {couriers.map(c => {
            if (c.lat == null || c.lng == null) return null
            const busy = c.active_jobs > 0
            return (
              <Marker
                key={`c-${c.id}`}
                position={[c.lat, c.lng]}
                icon={courierIcon(c.is_online, busy)}
              >
                <Popup closeButton className="logistics-map-popup">
                  <div className="text-xs leading-snug min-w-[120px]">
                    <p className="font-bold text-slate-900">{c.label}</p>
                    <p className="text-slate-500 mt-0.5">
                      {c.is_online ? (busy ? 'En course' : 'Disponible') : 'Hors ligne'}
                    </p>
                  </div>
                </Popup>
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
                <Popup closeButton className="logistics-map-popup">
                  <div className="text-xs leading-snug min-w-[120px]">
                    <p className="font-bold text-slate-900">{j.label}</p>
                    {j.is_urgent && <p className="text-red-600 font-semibold mt-0.5">Urgent</p>}
                    {onSelectJob && (
                      <button
                        type="button"
                        className="mt-2 text-[11px] font-bold text-indigo-600"
                        onClick={() => onSelectJob(j.id)}
                      >
                        Sélectionner
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <div className="px-5 py-3 border-t border-slate-50 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Disponible
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> En course
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Hors ligne
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 rotate-45" /> Course
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500 rotate-45" /> Urgent
        </span>
      </div>
    </section>
  )
}
