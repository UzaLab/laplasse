'use client'

import { Star } from 'lucide-react'
import { SearchAutocomplete } from './SearchAutocomplete'

export function HeroSection() {
  return (
    <header className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Blob amber */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-100 rounded-full blur-[100px] -z-10 opacity-60 translate-x-1/3 -translate-y-1/3" />
      {/* Blob blue */}
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full blur-[80px] -z-10 opacity-60 -translate-x-1/3 translate-y-1/3" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

        {/* Texte gauche */}
        <div className="flex-1 text-center lg:text-left">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold uppercase tracking-widest mb-6 shadow-sm">
            <Star size={13} className="fill-brand-500 text-brand-500" />
            Abidjan Premium Lifestyle
          </div>

          {/* Titre */}
          <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
            L&apos;élégance ivoirienne,{' '}
            <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-amber-300">
              à portée de clic.
            </span>
          </h1>

          {/* Sous-titre */}
          <p className="text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0">
            Réservez votre table dans les lieux les plus exclusifs et achetez leurs produits
            signatures directement depuis notre marketplace hybride.
          </p>

          {/* Barre de recherche avec autocomplete */}
          <div className="max-w-2xl mx-auto lg:mx-0">
            <SearchAutocomplete
              placeholder="Restaurant, Spa, Concept Store…"
              size="lg"
              navigateTo="search"
            />
          </div>
        </div>

        {/* Image droite — desktop uniquement */}
        <div className="flex-1 relative hidden lg:block w-full max-w-lg">
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-100 to-transparent rounded-[40px] transform rotate-3 scale-105 -z-10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800"
            className="w-full h-[500px] object-cover rounded-[40px] shadow-2xl border-4 border-white"
            alt="Restaurant Abidjan"
          />

          {/* Mini card flottante */}
          <div className="absolute -bottom-8 -left-12 glass-panel p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce [animation-duration:3s]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=200"
              className="w-14 h-14 rounded-xl object-cover shadow-sm"
              alt="Produit"
            />
            <div>
              <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                Acheté à l'instant
              </p>
              <p className="font-bold text-slate-900 text-sm">Coffret Épices Chef</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
