'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'

import { cn } from '@/lib/utils'

export interface FilterLiveMultiSelectOption {
  value: string
  label: string
}

interface FilterLiveMultiSelectProps {
  label: string
  placeholder?: string
  searchPlaceholder?: string
  options: FilterLiveMultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  loading?: boolean
  emptyMessage?: string
}

export function FilterLiveMultiSelect({
  label,
  placeholder = 'Sélectionner…',
  searchPlaceholder = 'Rechercher…',
  options,
  selected,
  onChange,
  loading = false,
  emptyMessage = 'Aucun résultat',
}: FilterLiveMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabels = useMemo(
    () => selected
      .map(value => options.find(o => o.value === value)?.label ?? value),
    [options, selected],
  )

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(o => o.label.toLowerCase().includes(q))
  }, [options, query])

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
      return
    }
    onChange([...selected, value])
  }

  const remove = (value: string) => {
    onChange(selected.filter(v => v !== value))
  }

  return (
    <div ref={containerRef} className="relative">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors',
          open
            ? 'border-brand-400 ring-1 ring-brand-500/20 bg-white'
            : 'border-slate-200 bg-slate-50 hover:border-slate-300',
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn('text-sm font-medium truncate', selected.length ? 'text-slate-900' : 'text-slate-400')}>
          {loading
            ? 'Chargement…'
            : selected.length
              ? `${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`
              : placeholder}
        </span>
        <ChevronDown size={16} className={cn('shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selected.map((value, i) => (
            <span
              key={value}
              className="inline-flex items-center gap-1 max-w-full pl-2.5 pr-1 py-1 rounded-lg bg-brand-50 text-brand-800 border border-brand-100 text-xs font-bold"
            >
              <span className="truncate">{selectedLabels[i]}</span>
              <button
                type="button"
                onClick={() => remove(value)}
                className="shrink-0 w-5 h-5 rounded-md hover:bg-brand-100 flex items-center justify-center"
                aria-label={`Retirer ${selectedLabels[i]}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 inset-x-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent outline-none text-sm text-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Effacer la recherche"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <ul className="max-h-44 overflow-y-auto py-1" role="listbox" aria-multiselectable>
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">{emptyMessage}</li>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selected.includes(option.value)
                return (
                  <li key={option.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => toggle(option.value)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                        isSelected ? 'bg-brand-50 text-brand-900' : 'text-slate-700 hover:bg-slate-50',
                      )}
                    >
                      <span
                        className={cn(
                          'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                          isSelected
                            ? 'bg-brand-500 border-brand-500 text-white'
                            : 'border-slate-300 bg-white',
                        )}
                      >
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </span>
                      <span className="truncate font-medium">{option.label}</span>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
