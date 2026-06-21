import { Image as ImageIcon } from 'lucide-react'
import type { ApiMerchantDetail } from '@/lib/api'

interface Props {
  merchant: ApiMerchantDetail
}

export function MerchantGalleryTab({ merchant }: Props) {
  if (merchant.media.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-white rounded-3xl border border-slate-100">
        <ImageIcon size={40} className="text-slate-200 mx-auto mb-4" />
        <p className="font-bold text-slate-700">Aucune photo pour le moment</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {merchant.media.map((m, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={m.id}
          src={m.url}
          alt={`${merchant.business_name} — photo ${i + 1}`}
          className={`w-full object-cover rounded-2xl hover:opacity-95 transition-opacity ${
            i === 0 && merchant.media.length > 2 ? 'h-52 md:col-span-2 md:row-span-2 md:h-full min-h-[12rem]' : 'h-40 md:h-44'
          }`}
        />
      ))}
    </div>
  )
}
