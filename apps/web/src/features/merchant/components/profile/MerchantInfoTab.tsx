import { MapPin, Store, Wifi, Car, Music, Wind, Utensils, Wine } from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'

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
          <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-brand-500" /> Adresse
          </h3>
          <p className="text-slate-600 mb-4">
            {[merchant.location.address, merchant.location.district, merchant.location.city]
              .filter(Boolean)
              .join(', ')}
          </p>
          <div className="w-full h-56 bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{
                backgroundImage: `url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Abidjan_OpenStreetMap.png/640px-Abidjan_OpenStreetMap.png')`,
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                <MapPin size={22} className="fill-current" />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
