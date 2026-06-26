import Link from 'next/link'
import { Check, ShoppingBag } from 'lucide-react'
import { BRAND_B2B_PITCH } from '@/lib/brandCopy'

export function B2BSection() {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Décor dots */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-12">

        {/* Texte */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">
            Vous tenez un établissement de qualité ?
          </h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto md:mx-0">
            {BRAND_B2B_PITCH}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/pro/register"
              className="bg-brand-500 text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/20 text-center"
            >
              Inscrire mon établissement
            </Link>
            <Link
              href="/pro"
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-full font-bold hover:bg-white/20 transition-colors text-center"
            >
              Découvrir les offres Pro
            </Link>
          </div>
        </div>

        {/* Card mock — desktop */}
        <div className="flex-1 w-full max-w-md hidden md:block">
          <div className="bg-slate-800 p-6 rounded-[32px] border border-slate-700 shadow-2xl transform rotate-3">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-700 rounded-full" />
              <div>
                <div className="w-32 h-4 bg-slate-600 rounded-full mb-2" />
                <div className="w-20 h-3 bg-slate-700 rounded-full" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-slate-700/50 p-4 rounded-2xl flex justify-between items-center border border-slate-600">
                <div className="w-24 h-3 bg-slate-500 rounded-full" />
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-green-400" />
                </div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-2xl flex justify-between items-center border border-slate-600">
                <div className="w-32 h-3 bg-slate-500 rounded-full" />
                <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center">
                  <ShoppingBag size={16} className="text-brand-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
