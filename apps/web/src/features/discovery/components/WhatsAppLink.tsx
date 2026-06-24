'use client'

import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '@/lib/whatsapp'

interface WhatsAppLinkProps {
  phone: string
  merchantId?: string
  className?: string
  iconSize?: number
  label?: string
  iconOnly?: boolean
  onClick?: () => void
}

export function WhatsAppLink({
  phone,
  merchantId,
  className = '',
  iconSize = 12,
  label = 'WhatsApp',
  iconOnly = false,
  onClick,
}: WhatsAppLinkProps) {
  const href = getWhatsAppUrl(phone)
  if (href === '#') return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation()
        if (merchantId) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/merchants/${merchantId}/interaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_type: 'WHATSAPP_CLICK' }),
          }).catch(() => {})
        }
        onClick?.()
      }}
      className={className}
      style={{ textDecoration: 'none' }}
      aria-label={iconOnly ? 'Contacter sur WhatsApp' : undefined}
    >
      <MessageCircle size={iconSize} />
      {!iconOnly && label}
    </a>
  )
}
