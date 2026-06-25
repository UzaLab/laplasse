import { MapPin, Store, Wifi, Car, Music, Wind, Utensils, Wine } from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'
import { coordsFromCityName } from '@/lib/cityCoords'
import { StaticLocationMapLazy } from '@/features/maps/components/StaticLocationMapLazy'
import { DirectionsLinkButton } from '@/features/maps/components/DirectionsLinkButton'

function TagIcon({ name }: { name: string }) {
  const map: Record<string, React.ReactNode> = {
    'Wi-Fi': <Wifi size={18} className="text-brand-500" />,
    Wifi: <Wifi size={18} className="text-brand-500" />,
    Parking: <Car size={18} className="text-brand-500" />,
    'Live Music': <Music size={18} className="text-brand-500" />,
    Climatisé: <Wind size={18} className="text-brand-500" />,
    Végétarien: <Utensils size={18} className="text-brand-500" />,
    Cocktails: <Wine size={18} className="text-brand-500" />,
  }
  return <>{map[name] ?? <Store size={18} className="text-brand-500" />}</>
}

function resolveMapCoords(location: NonNullable<ApiMerchantDetail['location']>) {
  if (location.latitude != null && location.longitude != null) {
    return { lat: location.latitude, lng: location.longitude, precise: true }
  }
  const fallback = coordsFromCityName(location.city)
  return { lat: fallback.lat, lng: fallback.lng, precise: false }
}

interface Props {
  merchant: ApiMerchantDetail
}

export function MerchantInfoTab({ merchant }: Props) {
  const hasContent =
    merchant.description ||
    merchant.tags.length > 0 ||
    merchant.location

  if (!hasContent) {
    return (
      <p className="text-center text-slate-500 py-12">
        Aucune information supplémentaire pour le moment.
      </p>
    )
  }

  const mapCoords = merchant.location ? resolveMapCoords(merchant.location) : null

  return (
    <div className="space-y-10">
      {merchant.description && (
        <section>
          <h3 className="text-lg font-extrabold text-slate-900 mb-3">À propos</h3>
          <p className="text-slate-600 leading-relaxed">{merchant.description}</p>
        </section>
      )}

      {merchant.tags.length > 0 && (
        <section>
          <h3 className="text-lg font-extrabold text-slate-900 mb-4">Services & équipements</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-3">
            {merchant.tags.map(tag => (
              <div key={tag} className="flex items-center gap-2.5 text-slate-700 font-medium text-sm">
                <TagIcon name={tag} />
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {merchant.location && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-brand-500" /> Adresse
            </h3>
            {mapCoords && (
              <DirectionsLinkButton latitude={mapCoords.lat} longitude={mapCoords.lng} />
            )}
          </div>
          <p className="text-slate-600 mb-4">
            {[merchant.location.address, merchant.location.district, merchant.location.city]
              .filter(Boolean)
              .join(', ')}
          </p>
          {mapCoords && (
            <>
              <StaticLocationMapLazy
                latitude={mapCoords.lat}
                longitude={mapCoords.lng}
                label={`Localisation de ${merchant.business_name}`}
              />
              {!mapCoords.precise && (
                <p className="text-xs text-slate-400 mt-2">
                  Position approximative (centre-ville). L&apos;établissement n&apos;a pas encore renseigné de point GPS exact.
                </p>
              )}
            </>
          )}
        </section>
      )}
    </div>
  )
}
