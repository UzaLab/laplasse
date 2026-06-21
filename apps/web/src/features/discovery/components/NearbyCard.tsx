'use client'

import Link from 'next/link'
import { Star, BadgeCheck, MapPin } from 'lucide-react'
import { ApiMerchant } from '@/lib/api'
import { FavoriteButton } from './FavoriteButton'
import { WhatsAppLink } from './WhatsAppLink'
import { MerchantCardPreview } from './MerchantCardPreview'

export function NearbyCard({ merchant }: { merchant: ApiMerchant }) {
  return (
    <article className="min-w-[280px] bg-white overflow-hidden rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:-translate-y-1 transition-transform duration-300 group">

      <Link
        href={`/m/${merchant.slug}`}
        className="block"
        style={{ textDecoration: 'none', color: 'inherit' }}
      >
        {/* Image */}
        <div className="relative overflow-hidden h-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={merchant.cover_image ?? ''}
            alt={merchant.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          <FavoriteButton
            merchantId={merchant.id}
            merchantSlug={merchant.slug}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90"
          />

          {merchant.location?.district && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/70 text-white backdrop-blur-sm">
              <MapPin size={11} />
              {merchant.location.district}
            </div>
          )}
        </div>

        {/* Infos principales */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-1">
              {merchant.business_name}
              {merchant.verification_status === 'VERIFIED' && (
                <BadgeCheck size={14} className="text-slate-600 shrink-0" />
              )}
            </h3>
            {merchant.review_count > 0 && (
              <div className="flex items-center gap-1 font-semibold text-sm shrink-0 text-slate-700">
                <Star size={12} className="text-slate-700" />
                {merchant.review_count}
              </div>
            )}
          </div>

          <p className="text-sm text-slate-500">
            {merchant.category.name} · {merchant.location?.city}
          </p>
        </div>
      </Link>

      <div className="px-4 pb-3">
        <MerchantCardPreview merchant={merchant} />
      </div>

      {(merchant.whatsapp || (merchant.tags?.length ?? 0) > 0) && (
        <div className="px-4 pb-4 flex items-center gap-2 flex-wrap">
          {merchant.whatsapp && (
            <WhatsAppLink
              phone={merchant.whatsapp}
              merchantId={merchant.id}
              iconSize={11}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1 hover:bg-emerald-100 transition-colors"
            />
          )}
          {merchant.tags?.filter(t => t !== 'WhatsApp').map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
