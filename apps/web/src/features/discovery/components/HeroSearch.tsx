'use client'

import { Search, MapPin, ChevronDown, SlidersHorizontal, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface HeroSearchProps {
  city?: string
  district?: string
}

export function HeroSearch({ city = 'Abidjan', district = 'Cocody' }: HeroSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header
      className="relative overflow-hidden text-white"
      style={{
        background: 'linear-gradient(135deg, #FF5A5F 0%, #FF8A71 100%)',
        padding: '40px 24px 32px',
        borderBottomLeftRadius: '32px',
        borderBottomRightRadius: '32px',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Formes de fond décoratives */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 80% 20%, white 0%, transparent 40%), radial-gradient(circle at 10% 80%, white 0%, transparent 40%)',
        }}
      />

      {/* Header top : localisation + profil */}
      <div className="relative z-10 mb-6 flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium backdrop-blur-sm"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <MapPin size={16} />
          <span>
            {district}, {city}
          </span>
          <ChevronDown size={14} />
        </button>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white"
          style={{ color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}
          aria-label="Profil"
        >
          <User size={18} />
        </button>
      </div>

      {/* Titre hero */}
      <h1
        className="relative z-10 mb-6 font-bold leading-tight"
        style={{ fontSize: 'clamp(24px, 6vw, 28px)' }}
      >
        Découvre les meilleurs
        <br />
        lieux autour de toi
      </h1>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="relative z-10">
        <div
          className={cn(
            'flex cursor-text items-center gap-3 bg-white px-5 py-3.5 transition-transform active:scale-[0.98]',
          )}
          style={{
            borderRadius: '24px',
            boxShadow: 'var(--shadow-float)',
          }}
        >
          <Search size={20} color="var(--text-muted)" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Établissements, produits, services…"
            className="w-full border-none bg-transparent text-base font-medium outline-none placeholder:font-normal"
            style={{ color: 'var(--text-main)' }}
          />
          <div className="h-6 w-px" style={{ background: '#EAEAEA' }} />
          <button type="button" aria-label="Filtres">
            <SlidersHorizontal size={20} color="var(--primary)" />
          </button>
        </div>
      </form>
    </header>
  )
}
