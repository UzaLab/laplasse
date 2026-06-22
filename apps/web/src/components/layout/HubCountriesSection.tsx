'use client'

import { COUNTRY_HUB_ENTRIES } from '@/lib/country'

export function HubCountriesSection() {
  return (
    <section className="py-20 bg-white border-y border-slate-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            Disponible dans toute la zone UEMOA
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto">
            Chaque pays dispose de son espace dédié avec des établissements locaux,
            des paiements adaptés et une expérience pensée pour votre marché.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {COUNTRY_HUB_ENTRIES.map(entry => (
            <article
              key={entry.code}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 text-center"
            >
              <span className="text-4xl mb-4 block" aria-hidden>
                {entry.flag}
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg mb-1">
                {entry.label}
              </h3>
              <p className="text-sm font-semibold text-brand-600 mb-2">
                {entry.city}
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                {entry.tagline}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
