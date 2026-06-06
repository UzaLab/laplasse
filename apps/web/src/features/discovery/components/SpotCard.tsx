'use client'

import Link from 'next/link'
import { Star, MapPin, Store, BadgeCheck, Plus, MessageCircle, Zap } from 'lucide-react'
import { ApiMerchant } from '@/lib/api'
import { FavoriteButton } from './FavoriteButton'

export interface SpotMerchantProps extends ApiMerchant {
  sub_category?: string
  has_reservation?: boolean
  has_marketplace?: boolean
  featured_product?: { name: string; price: string; image: string }
}

export function SpotCard({ merchant }: { merchant: SpotMerchantProps }) {
  return (
    <article className="bg-white rounded-[32px] p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">

      {/* Image */}
      <div className="h-56 rounded-[24px] overflow-hidden relative mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={merchant.cover_image ?? ''}
          alt={merchant.business_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Rating badge */}
        {merchant.review_count > 0 && (
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-bold text-slate-900 flex items-center gap-1 shadow-sm">
            <Star size={13} className="text-slate-700" />
            {merchant.review_count}
          </div>
        )}

        {/* Sponsored badge */}
        {merchant.is_sponsored && (
          <div className="absolute top-4 left-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-white shadow-sm">
            <Zap size={10} />
            Sponsorisé
          </div>
        )}

        {/* Verification badge */}
        {!merchant.is_sponsored && merchant.verification_status === 'VERIFIED' && (
          <div className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
            Vérifié
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-2">

        {/* Header : nom + favori */}
        <div className="flex justify-between items-start mb-4">
          <div>
            {merchant.sub_category && (
              <span className="text-brand-600 text-[10px] font-bold uppercase tracking-widest mb-1 block">
                {merchant.sub_category}
              </span>
            )}
            <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
              {merchant.business_name}
              {merchant.verification_status === 'VERIFIED' && (
                <BadgeCheck size={16} className="text-slate-600 shrink-0" />
              )}
            </h3>
          </div>
          <FavoriteButton
            merchantId={merchant.id}
            merchantSlug={merchant.slug}
            size={18}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-red-50 shrink-0"
            favoritedClassName="bg-red-50 text-red-500"
          />
        </div>

        {/* Localisation + WhatsApp */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-slate-500 flex items-center gap-1.5">
            <MapPin size={14} />
            {merchant.location?.district}, {merchant.location?.city}
          </p>
          {merchant.whatsapp && (
            <a
              href={`https://wa.me/${merchant.whatsapp.replace(/\s+/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              <MessageCircle size={12} />
              WhatsApp
            </a>
          )}
        </div>

        {/* Micro-Marketplace */}
        {merchant.has_marketplace && merchant.featured_product && (
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-4 group-hover:border-brand-200 transition-colors cursor-pointer mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shrink-0">
              <img
                src={merchant.featured_product.image}
                alt={merchant.featured_product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <Store size={12} className="text-brand-600" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  La Boutique
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {merchant.featured_product.name}
              </h4>
              <p className="text-xs font-bold text-brand-600 mt-0.5">
                {merchant.featured_product.price}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-900 group-hover:bg-brand-500 group-hover:text-white transition-colors">
              <Plus size={16} />
            </div>
          </div>
        )}

        {/* CTA Buttons */}
        <div className={`grid gap-3 ${merchant.has_reservation ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Link
            href={`/m/${merchant.slug}`}
            className="py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm text-center hover:bg-slate-50 transition-colors"
          >
            Voir le lieu
          </Link>
          {merchant.has_reservation && (
            <button className="py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/10">
              Réserver
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
