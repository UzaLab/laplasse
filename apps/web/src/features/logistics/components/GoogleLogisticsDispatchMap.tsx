'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import { loadGoogleMaps } from '@/features/maps/googleMapsLoader'
import { cn } from '@/lib/utils'
import type { DispatchMapCourier, DispatchMapJob } from './LogisticsDispatchMap'

interface Props {
  couriers: DispatchMapCourier[]
  jobs: DispatchMapJob[]
  selectedJobId?: string | null
  onSelectJob?: (jobId: string) => void
  className?: string
  title?: string
  subtitle?: string
  onFailed?: () => void
}

export function GoogleLogisticsDispatchMap({
  couriers,
  jobs,
  selectedJobId,
  onSelectJob,
  className,
  title = 'Carte live',
  subtitle,
  onFailed,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<google.maps.Marker[]>([])
  const onSelectJobRef = useRef(onSelectJob)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onSelectJobRef.current = onSelectJob
  }, [onSelectJob])

  const points = useMemo(() => {
    const pts: Array<{ lat: number; lng: number }> = []
    for (const c of couriers) {
      if (c.lat != null && c.lng != null) pts.push({ lat: c.lat, lng: c.lng })
    }
    for (const j of jobs) {
      if (j.lat != null && j.lng != null) pts.push({ lat: j.lat, lng: j.lng })
    }
    return pts
  }, [couriers, jobs])

  const center = useMemo(() => {
    if (points.length === 0) return { lat: 5.3599517, lng: -4.0082563 }
    const sum = points.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 },
    )
    return { lat: sum.lat / points.length, lng: sum.lng / points.length }
  }, [points])

  const onlineCount = couriers.filter(c => c.is_online).length
  const jobCount = jobs.length
  const resolvedSubtitle = subtitle ?? (
    points.length === 0
      ? 'Position des livreurs et courses dès qu\'une localisation est disponible.'
      : `${onlineCount} livreur${onlineCount !== 1 ? 's' : ''} localisé${onlineCount !== 1 ? 's' : ''}${jobCount > 0 ? ` · ${jobCount} course${jobCount !== 1 ? 's' : ''}` : ''}`
  )

  useEffect(() => {
    if (failed || !containerRef.current) return

    let cancelled = false

    void loadGoogleMaps()
      .then(google => {
        if (cancelled || !containerRef.current) return

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom: 12,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'cooperative',
          })
        }

        const map = mapRef.current
        overlaysRef.current.forEach(m => m.setMap(null))
        overlaysRef.current = []

        const bounds = new google.maps.LatLngBounds()

        for (const c of couriers) {
          if (c.lat == null || c.lng == null) continue
          const busy = c.active_jobs > 0
          const color = !c.is_online ? '#94a3b8' : busy ? '#6366f1' : '#10b981'
          const pos = { lat: c.lat, lng: c.lng }
          bounds.extend(pos)
          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: c.label,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 7,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            },
          })
          overlaysRef.current.push(marker)
        }

        for (const j of jobs) {
          if (j.lat == null || j.lng == null) continue
          const selected = j.id === selectedJobId
          const color = j.is_urgent ? '#ef4444' : '#f59e0b'
          const pos = { lat: j.lat, lng: j.lng }
          bounds.extend(pos)
          const marker = new google.maps.Marker({
            map,
            position: pos,
            title: j.label,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: selected ? 6 : 5,
              fillColor: color,
              fillOpacity: 1,
              strokeColor: selected ? '#6366f1' : '#ffffff',
              strokeWeight: selected ? 2 : 1,
              rotation: 45,
            },
          })
          marker.addListener('click', () => onSelectJobRef.current?.(j.id))
          overlaysRef.current.push(marker)
        }

        if (points.length > 1) {
          map.fitBounds(bounds, 32)
        } else if (points.length === 1) {
          map.setCenter(points[0])
          map.setZoom(13)
        } else {
          map.setCenter(center)
          map.setZoom(12)
        }
      })
      .catch(() => {
        setFailed(true)
        onFailed?.()
      })

    return () => {
      cancelled = true
    }
  }, [center, couriers, failed, jobs, points, selectedJobId, onFailed])

  if (failed) return null

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
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </section>
  )
}
