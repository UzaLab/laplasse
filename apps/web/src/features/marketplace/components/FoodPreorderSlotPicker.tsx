'use client'

import { Clock } from 'lucide-react'
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
            Le restaurant est fermé — choisissez un créneau pendant ses prochaines heures d&apos;ouverture.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.map(slot => {
          const selected = value === slot.at
          return (
            <button
              key={slot.at}
              type="button"
              onClick={() => onChange(slot.at)}
              className={cn(
                'text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-colors',
                selected
                  ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-200'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-200 hover:bg-blue-50/50',
              )}
            >
              {slot.label}
            </button>
          )
        })}
      </div>
      {!value && (
        <p className="text-xs font-medium text-amber-700">
          Sélectionnez un créneau pour continuer.
        </p>
      )}
    </div>
  )
}
