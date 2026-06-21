'use client'

import { useMemo, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import {
  buildSelectedModifiers,
  computeMenuUnitPrice,
  type MenuModifierGroup,
  validateLocalModifierSelections,
} from '@/lib/menuModifiers'
import { formatPrice } from '@/lib/marketplaceApi'

interface MenuItemSummary {
  id: string
  name: string
  price: number
  currency: string
  description?: string | null
  modifier_groups: MenuModifierGroup[]
}

interface Props {
  item: MenuItemSummary
  open: boolean
  onClose: () => void
  onConfirm: (quantity: number, optionIds: string[]) => Promise<void> | void
  submitting?: boolean
}

export function MenuItemModifierSheet({ item, open, onClose, onConfirm, submitting }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const unitPrice = useMemo(
    () => computeMenuUnitPrice(item.price, buildSelectedModifiers(item.modifier_groups, selectedOptionIds)),
    [item.modifier_groups, item.price, selectedOptionIds],
  )

  if (!open) return null

  const toggleOption = (group: MenuModifierGroup, optionId: string) => {
    setError(null)
    setSelectedOptionIds(prev => {
      const inGroup = prev.filter(id => group.options.some(o => o.id === id))
      const has = inGroup.includes(optionId)
      if (group.max_select <= 1) {
        const withoutGroup = prev.filter(id => !group.options.some(o => o.id === id))
        return has ? withoutGroup : [...withoutGroup, optionId]
      }
      if (has) return prev.filter(id => id !== optionId)
      if (inGroup.length >= group.max_select) return prev
      return [...prev, optionId]
    })
  }

  const handleConfirm = async () => {
    const validation = validateLocalModifierSelections(item.modifier_groups, selectedOptionIds)
    if (!validation.ok) {
      setError(validation.message)
      return
    }
    await onConfirm(quantity, selectedOptionIds)
    setQuantity(1)
    setSelectedOptionIds([])
    setError(null)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-slate-900">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-slate-500 mt-1">{item.description}</p>
            )}
            <p className="text-sm font-bold text-orange-600 mt-2">
              {formatPrice(unitPrice, item.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {item.modifier_groups.map(group => (
            <section key={group.id}>
              <div className="mb-3">
                <p className="font-bold text-slate-900">{group.name}</p>
                <p className="text-xs text-slate-500">
                  {group.min_select > 0 ? 'Obligatoire · ' : 'Optionnel · '}
                  {group.max_select === 1 ? '1 choix' : `Jusqu'à ${group.max_select} choix`}
                </p>
              </div>
              <div className="space-y-2">
                {group.options.filter(o => o.is_available).map(option => {
                  const active = selectedOptionIds.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleOption(group, option.id)}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-colors ${
                        active
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-slate-200 hover:border-orange-200'
                      }`}
                    >
                      <span className="font-semibold text-slate-800 text-sm">{option.name}</span>
                      <span className="text-sm font-bold text-slate-600 tabular-nums">
                        {option.price_delta > 0 ? `+${formatPrice(option.price_delta, item.currency)}` : 'Inclus'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
          {error && (
            <p className="text-sm font-semibold text-red-600">{error}</p>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-lg bg-white font-bold text-slate-700"
            >
              −
            </button>
            <span className="w-8 text-center font-bold tabular-nums">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-9 h-9 rounded-lg bg-white font-bold text-slate-700"
            >
              +
            </button>
          </div>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleConfirm()}
            className="flex-1 inline-flex items-center justify-center gap-2 h-12 bg-slate-900 text-white rounded-2xl font-bold disabled:opacity-60"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Ajouter · {formatPrice(unitPrice * quantity, item.currency)}
          </button>
        </div>
      </div>
    </div>
  )
}
