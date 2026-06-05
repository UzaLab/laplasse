'use client'

import { useEffect } from 'react'
import { MessageCircle, Phone, Globe } from 'lucide-react'

function track(merchantId: string, eventType: string) {
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/${merchantId}/interaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType }),
  }).catch(() => {})
}

interface MerchantTrackerProps {
  merchantId: string
}

/** Enregistre la vue de page au montage */
export function MerchantViewTracker({ merchantId }: MerchantTrackerProps) {
  useEffect(() => {
    track(merchantId, 'VIEW')
  }, [merchantId])
  return null
}

interface ContactLinkProps {
  merchantId: string
  eventType: string
  href: string
  children: React.ReactNode
  className?: string
  external?: boolean
}

function TrackedLink({ merchantId, eventType, href, children, className, external }: ContactLinkProps) {
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={() => track(merchantId, eventType)}
      className={className}
      style={{ textDecoration: 'none' }}
    >
      {children}
    </a>
  )
}

interface MerchantContactProps {
  merchantId: string
  whatsapp: string | null
  phone: string | null
  website: string | null
}

/** Boutons de contact avec tracking des clics */
export function MerchantContactButtons({ merchantId, whatsapp, phone, website }: MerchantContactProps) {
  return (
    <div className="space-y-3">
      {whatsapp && (
        <TrackedLink
          merchantId={merchantId}
          eventType="WHATSAPP_CLICK"
          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
          external
          className="flex items-center gap-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-2xl transition-colors shadow-lg shadow-emerald-500/20"
        >
          <MessageCircle size={18} /> WhatsApp
        </TrackedLink>
      )}
      {phone && (
        <TrackedLink
          merchantId={merchantId}
          eventType="CALL_CLICK"
          href={`tel:${phone}`}
          className="flex items-center gap-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-4 rounded-2xl transition-colors"
        >
          <Phone size={18} /> {phone}
        </TrackedLink>
      )}
      {website && (
        <TrackedLink
          merchantId={merchantId}
          eventType="WEBSITE_CLICK"
          href={website}
          external
          className="flex items-center gap-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-3 px-4 rounded-2xl transition-colors"
        >
          <Globe size={18} /> Site web
        </TrackedLink>
      )}
    </div>
  )
}
