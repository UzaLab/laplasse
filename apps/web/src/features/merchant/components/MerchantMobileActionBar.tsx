'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BedDouble,
  Calendar,
  MessageCircle,
  Phone,
  ShoppingBag,
  Store,
} from 'lucide-react'
import { getMerchantVertical } from '@/lib/merchantVertical'
import type { ProfileTabId } from '@/lib/merchantProfileTabs'
import { openBookingWithPrefill } from '@/lib/bookingPrefill'
import {
  MERCHANT_BOTTOM_DOCK_EVENT,
  type MerchantBottomDockDetail,
} from '@/lib/merchantMobileChrome'

interface ActionBtn {
  label: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

interface Props {
  categorySlug: string
  merchantSlug: string
  merchantId: string
  bookingEnabled?: boolean
  bookingCta?: string
  whatsapp?: string | null
  phone?: string | null
}

function tabHref(slug: string, tab: ProfileTabId) {
  return `/m/${slug}?tab=${tab}#profile-tabs`
}

function trackContact(merchantId: string, eventType: string) {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/${merchantId}/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType }),
  }).catch(() => {})
}

function buildActions(
  categorySlug: string,
  merchantSlug: string,
  bookingEnabled: boolean,
  bookingCta: string,
): ActionBtn[] {
  const vertical = getMerchantVertical(categorySlug)
  const reserve = (): ActionBtn => ({
    label: bookingCta,
    icon: <Calendar size={18} />,
    onClick: () => openBookingWithPrefill({}),
    variant: 'primary',
  })

  if (vertical === 'hotel') {
    const actions: ActionBtn[] = [
      {
        label: 'Chambres',
        icon: <BedDouble size={18} />,
        href: tabHref(merchantSlug, 'chambres'),
        variant: 'secondary',
      },
    ]
    if (bookingEnabled) actions.push(reserve())
    return actions
  }

  if (vertical === 'food') {
    const actions: ActionBtn[] = [{
      label: 'Commander',
      icon: <ShoppingBag size={18} />,
      href: tabHref(merchantSlug, 'menu'),
      variant: 'primary',
    }]
    if (bookingEnabled) {
      actions.unshift({
        label: bookingCta,
        icon: <Calendar size={18} />,
        onClick: () => openBookingWithPrefill({}),
        variant: 'secondary',
      })
    }
    return actions
  }

  if (vertical === 'retail') {
    return [{
      label: 'Boutique',
      icon: <Store size={18} />,
      href: tabHref(merchantSlug, 'boutique'),
      variant: 'primary',
    }]
  }

  if (vertical === 'appointment') {
    const tab: ProfileTabId = 'prestations'
    const label = categorySlug === 'pharmacies' ? 'Consultations' : 'Prestations'
    const actions: ActionBtn[] = [{
      label,
      icon: <Calendar size={18} />,
      href: tabHref(merchantSlug, tab),
      variant: 'secondary',
    }]
    if (bookingEnabled) actions.push(reserve())
    return actions
  }

  if (vertical === 'default' && bookingEnabled) {
    return [reserve()]
  }

  return []
}

/** Masque la barre si un dock bas (panier menu…) ou le formulaire réservation est visible. */
function useMobileActionBarVisible() {
  const [bottomDockActive, setBottomDockActive] = useState(false)
  const [reservationVisible, setReservationVisible] = useState(false)

  useEffect(() => {
    const onDock = (e: Event) => {
      const detail = (e as CustomEvent<MerchantBottomDockDetail>).detail
      setBottomDockActive(Boolean(detail?.active))
    }
    window.addEventListener(MERCHANT_BOTTOM_DOCK_EVENT, onDock)
    return () => window.removeEventListener(MERCHANT_BOTTOM_DOCK_EVENT, onDock)
  }, [])

  useEffect(() => {
    const el = document.getElementById('reservation')
    if (!el) {
      setReservationVisible(false)
      return
    }
    const obs = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        setReservationVisible(
          Boolean(entry?.isIntersecting && entry.intersectionRatio >= 0.25),
        )
      },
      { threshold: [0, 0.25, 0.5] },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (bottomDockActive) return false
  if (reservationVisible) return false
  return true
}

export function MerchantMobileActionBar({
  categorySlug,
  merchantSlug,
  merchantId,
  bookingEnabled = true,
  bookingCta = 'Réserver',
  whatsapp,
  phone,
}: Props) {
  const actions = buildActions(categorySlug, merchantSlug, bookingEnabled, bookingCta)
  const visible = useMobileActionBarVisible()

  if (actions.length === 0 && !whatsapp && !phone) return null

  const btnBase =
    'flex items-center justify-center gap-2 h-12 rounded-2xl font-bold text-sm transition-colors active:scale-[0.98] min-w-0 flex-1'

  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div
        className={`pointer-events-auto mx-3 mb-3 p-2 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-[22px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex items-center gap-2 ${
          visible ? '' : 'pointer-events-none'
        }`}
        style={{ marginBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackContact(merchantId, 'WHATSAPP_CLICK')}
            className={`${btnBase} max-w-[3rem] flex-none bg-emerald-500 text-white hover:bg-emerald-600`}
            aria-label="WhatsApp"
            style={{ textDecoration: 'none' }}
          >
            <MessageCircle size={20} />
          </a>
        )}
        {!whatsapp && phone && (
          <a
            href={`tel:${phone}`}
            onClick={() => trackContact(merchantId, 'CALL_CLICK')}
            className={`${btnBase} max-w-[3rem] flex-none bg-slate-100 text-slate-800`}
            aria-label="Appeler"
            style={{ textDecoration: 'none' }}
          >
            <Phone size={20} />
          </a>
        )}

        {actions.map(action => {
          const className = `${btnBase} ${
            action.variant === 'primary'
              ? 'bg-slate-900 text-white hover:bg-slate-800'
              : 'bg-white text-slate-900 border border-slate-200'
          }`
          if (action.href) {
            return (
              <Link
                key={action.label}
                href={action.href}
                className={className}
                style={{ textDecoration: 'none' }}
              >
                {action.icon}
                <span className="truncate">{action.label}</span>
              </Link>
            )
          }
          return (
            <button key={action.label} type="button" onClick={action.onClick} className={className}>
              {action.icon}
              <span className="truncate">{action.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
