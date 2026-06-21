'use client'

import Link from 'next/link'
import { ArrowLeft, Compass, Home, Search } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col selection:bg-brand-200 selection:text-brand-900">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="relative max-w-lg w-full text-center">
          <div
            aria-hidden
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none"
          />

          <p className="text-[8rem] sm:text-[10rem] font-extrabold leading-none text-slate-100 select-none">
            404
          </p>

          <div className="relative -mt-12 sm:-mt-16 space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 mb-2">
              <Compass size={28} strokeWidth={1.75} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Cette adresse n&apos;existe pas
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-md mx-auto">
              La page que vous cherchez a peut-être été déplacée, supprimée, ou l&apos;URL contient une erreur.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 pt-6">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors shadow-sm"
                style={{ textDecoration: 'none' }}
              >
                <Home size={18} />
                Accueil
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 text-slate-800 font-bold rounded-2xl hover:bg-slate-50 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <Search size={18} />
                Explorer
              </Link>
            </div>

            <button
              type="button"
              onClick={() => typeof window !== 'undefined' && window.history.back()}
              className="inline-flex items-center justify-center gap-1.5 mt-4 text-sm font-semibold text-slate-400 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Retour à la page précédente
            </button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  )
}
