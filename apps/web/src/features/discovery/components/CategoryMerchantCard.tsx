'use client'

import Link from 'next/link'
import { BadgeCheck, MapPin, MessageCircle } from 'lucide-react'
import type { ApiMerchant } from '@/lib/api'
import { CategoryIcon } from '@/lib/icons'
import { MerchantCardPreview } from '@/features/discovery/components/MerchantCardPreview'

export function CategoryMerchantCard({ merchant }: { merchant: ApiMerchant }) {
  return (
    <article className="bg-white rounded-[24px] border border-slate-100 hover:border-brand-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      <Link href={`/m/${merchant.slug}`} className="block" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="relative h-48 overflow-hidden bg-slate-100">
          {merchant.cover_image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={merchant.cover_image}
              alt={merchant.business_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CategoryIcon name={merchant.category.icon} slug={merchant.category.slug} size={40} className="text-slate-300" />
            </div>
          )}
          {merchant.verification_status === 'VERIFIED' && (
            <div className="absolute top-3 left-3 bg-blue-500/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <BadgeCheck size={11} /> Vérifié
            </div>
          )}
        </div>

        <div className="p-5 pb-3">
          <h3 className="font-bold text-slate-900 text-lg mb-1 flex items-center gap-1.5">
            {merchant.business_name}
            {merchant.verification_status === 'VERIFIED' && (
              <BadgeCheck size={14} className="text-slate-600 shrink-0" />
            )}
          </h3>

          {merchant.location && (
            <p className="text-sm text-slate-500 flex items-center gap-1 mb-3">
              <MapPin size={12} />
              {merchant.location.district ?? merchant.location.city}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {merchant.whatsapp && (
              <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MessageCircle size={10} /> WhatsApp
              </span>
            )}
            {merchant.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-100 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="px-5 pb-5">
        <MerchantCardPreview merchant={merchant} />
      </div>
    </article>
  )
}
