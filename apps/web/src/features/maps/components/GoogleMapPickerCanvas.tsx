'use client'

import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '@/features/maps/googleMapsLoader'

interface Props {
  lat: number
  lng: number
  zoom: number
  onDrag: (lat: number, lng: number) => void
  onFailed?: () => void
  className?: string
}

export function GoogleMapPickerCanvas({
  lat,
  lng,
  zoom,
  onDrag,
  onFailed,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markerRef = useRef<google.maps.Marker | null>(null)
  const onDragRef = useRef(onDrag)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    onDragRef.current = onDrag
  }, [onDrag])

  useEffect(() => {
    if (failed || !containerRef.current) return

    let cancelled = false

    void loadGoogleMaps()
      .then(google => {
        if (cancelled || !containerRef.current) return

        const center = { lat, lng }

        if (!mapRef.current) {
          mapRef.current = new google.maps.Map(containerRef.current, {
            center,
            zoom,
            disableDefaultUI: true,
            zoomControl: true,
            gestureHandling: 'greedy',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        } else {
          mapRef.current.setCenter(center)
          mapRef.current.setZoom(zoom)
        }

        if (!markerRef.current) {
          markerRef.current = new google.maps.Marker({
            position: center,
            map: mapRef.current,
            draggable: true,
          })
          markerRef.current.addListener('dragend', () => {
            const pos = markerRef.current?.getPosition()
            if (pos) onDragRef.current(pos.lat(), pos.lng())
          })
        } else {
          markerRef.current.setPosition(center)
        }
      })
      .catch(() => {
        setFailed(true)
        onFailed?.()
      })

    return () => {
      cancelled = true
    }
  }, [failed, lat, lng, zoom, onFailed])

  if (failed) return null

  return (
    <div
      ref={containerRef}
      className={className ?? 'h-52 w-full rounded-2xl overflow-hidden border border-slate-200'}
    />
  )
}
