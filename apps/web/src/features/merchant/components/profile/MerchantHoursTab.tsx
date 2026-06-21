import { Clock } from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'

const DAY_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface Props {
  merchant: ApiMerchantDetail
}

export function MerchantHoursTab({ merchant }: Props) {
  if (merchant.hours.length === 0) {
    return (
      <p className="text-center text-slate-500 py-12">
        Horaires non renseignés.
      </p>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl">
        {merchant.hours.map(h => {
          const isToday = new Date().getDay() === h.day
          return (
            <div
              key={h.day}
              className={`flex justify-between items-center py-3 px-4 rounded-xl text-sm ${
                isToday
                  ? 'bg-brand-50 border border-brand-200 font-bold'
                  : 'bg-white border border-slate-100 text-slate-600'
              }`}
            >
              <span className={`flex items-center gap-2 ${isToday ? 'text-brand-700' : ''}`}>
                {isToday && <Clock size={14} className="text-brand-500" />}
                {DAY_NAMES[h.day]}
              </span>
              {h.is_closed ? (
                <span className="text-red-500 font-medium">Fermé</span>
              ) : (
                <span className="tabular-nums">
                  {h.open_time ?? '--'} – {h.close_time ?? '--'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
