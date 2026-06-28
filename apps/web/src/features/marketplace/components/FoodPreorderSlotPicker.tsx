'use client'

import { Clock, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FoodScheduling } from '@/lib/marketplaceApi'

interface Props {
  scheduling: FoodScheduling
  value: string | null
  onChange: (iso: string) => void
  className?: string
}

export function FoodPreorderSlotPicker({ scheduling, value, onChange, className }: Props) {
  if (!scheduling.requires_preorder) return null

  const { slots } = scheduling
  if (!slots.length) return null

  return (
    <div className={cn('bg-white rounded-3xl border border-blue-100 shadow-sm p-6 space-y-4', className)}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Créneau de livraison / retrait</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Le restaurant est fermé — choisissez un créneau lors de ses prochaines ouvertures.
          </p>
        </div>
      </div>
      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
          Date et heure
        </span>
        <div className="relative">
          <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-4 py-3.5 pr-10 text-sm font-semibold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          >
            <option value="" disabled>
              Sélectionnez un créneau…
            </option>
            {slots.map(slot => (
              <option key={slot.at} value={slot.at}>
                {slot.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
      </label>
      {!value && (
        <p className="text-xs font-medium text-amber-700">
          Sélectionnez un créneau pour continuer.
        </p>
      )}
    </div>
  )
}
