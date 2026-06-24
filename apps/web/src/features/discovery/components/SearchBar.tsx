'use client'

import { Search, X } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Établissements, produits, services…',
  className,
  autoFocus,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      className={cn(
        'flex items-center gap-3 bg-white border-2 border-slate-200 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/10 rounded-2xl px-4 py-3 transition-all duration-200 shadow-sm',
        className,
      )}
    >
      <Search size={18} className="text-slate-400 shrink-0" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 min-w-0 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-base font-medium [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
