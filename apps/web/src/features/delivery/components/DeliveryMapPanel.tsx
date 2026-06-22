'use client'

interface DeliveryMapPanelProps {
  latitude: number
  longitude: number
  status: string
}

function embedUrl(lat: number, lng: number): string {
  const delta = 0.018
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(',')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`
}

export function DeliveryMapPanel({ latitude, longitude, status }: DeliveryMapPanelProps) {
  if (status === 'DELIVERED' || status === 'CANCELLED' || status === 'FAILED') {
    return null
  }

  const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">Position du livreur</p>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-brand-600 hover:text-brand-700"
        >
          Ouvrir dans Maps
        </a>
      </div>
      <iframe
        title="Carte livraison"
        src={embedUrl(latitude, longitude)}
        className="w-full h-52 border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="text-[11px] text-slate-400 px-4 py-2">
        Position approximative — mise à jour à chaque étape de livraison.
      </p>
    </div>
  )
}
