'use client'

import Link from 'next/link'
import { BedDouble, Calendar, ShoppingBag, Store, UtensilsCrossed } from 'lucide-react'
import { getMerchantVertical } from '@/lib/merchantVertical'
import type { ProfileTabId } from '@/lib/merchantProfileTabs'

interface Props {
  categorySlug: string
  merchantSlug: string
  bookingEnabled?: boolean
  bookingCta?: string
}

function scrollToReservation() {
  document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function tabHref(slug: string, tab: ProfileTabId) {
  return `/m/${slug}?tab=${tab}#profile-tabs`
}

export function MerchantContextualCTAs({
  categorySlug,
  merchantSlug,
  bookingEnabled = true,
  bookingCta = 'Réserver',
}: Props) {
  const vertical = getMerchantVertical(categorySlug)
  const boutiqueTabHref = tabHref(merchantSlug, 'boutique')

  const primaryClass =
    'flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-sm transition-colors'
  const primaryBtn = `${primaryClass} bg-slate-900 text-white hover:bg-slate-800`
  const secondaryBtn = `${primaryClass} bg-white text-slate-900 border border-slate-200 hover:border-brand-300 hover:bg-brand-50`

  if (vertical === 'food') {
    const menuHref = tabHref(merchantSlug, 'menu')
    return (
      <div className="flex flex-col gap-3 mb-5">
        <Link href={menuHref} className={primaryBtn} style={{ textDecoration: 'none' }}>
          <UtensilsCrossed size={18} /> Voir le menu
        </Link>
        <Link href={menuHref} className={secondaryBtn} style={{ textDecoration: 'none' }}>
          <ShoppingBag size={18} /> Commander
        </Link>
        {bookingEnabled && (
          <button type="button" onClick={scrollToReservation} className={secondaryBtn}>
            <Calendar size={18} /> {bookingCta}
          </button>
        )}
      </div>
    )
  }

  if (vertical === 'hotel') {
    return (
      <div className="flex flex-col gap-3 mb-5">
        <Link href={tabHref(merchantSlug, 'chambres')} className={primaryBtn} style={{ textDecoration: 'none' }}>
          <BedDouble size={18} /> Voir les chambres
        </Link>
        <button type="button" onClick={scrollToReservation} className={secondaryBtn}>
          <Calendar size={18} /> {bookingCta}
        </button>
      </div>
    )
  }

  if (vertical === 'retail') {
    return (
      <div className="mb-5">
        <Link href={boutiqueTabHref} className={primaryBtn} style={{ textDecoration: 'none' }}>
          <Store size={18} /> Voir la boutique
        </Link>
      </div>
    )
  }

  if (vertical === 'appointment') {
    const tab: ProfileTabId = 'prestations'
    return (
      <div className="flex flex-col gap-3 mb-5">
        <Link href={tabHref(merchantSlug, tab)} className={primaryBtn} style={{ textDecoration: 'none' }}>
          <Calendar size={18} /> Voir les {categorySlug === 'pharmacies' ? 'consultations' : 'prestations'}
        </Link>
        {bookingEnabled && (
          <button type="button" onClick={scrollToReservation} className={secondaryBtn}>
            {bookingCta}
          </button>
        )}
      </div>
    )
  }

  if (vertical === 'default') {
    if (!bookingEnabled) return null
    return (
      <div className="mb-5">
        <button type="button" onClick={scrollToReservation} className={primaryBtn}>
          <Calendar size={18} /> {bookingCta}
        </button>
      </div>
    )
  }

  return null
}
