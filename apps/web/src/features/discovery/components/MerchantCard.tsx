'use client'

import Link from 'next/link'
import { Heart, BadgeCheck, Star, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Merchant } from '@/types/merchant'

interface MerchantCardProps {
  merchant: Merchant
  compact?: boolean
}

export function MerchantCard({ merchant, compact = false }: MerchantCardProps) {
  const [isFav, setIsFav] = useState(false)

  const imageHeight = compact ? '140px' : '180px'

  return (
    <Link
      href={`/m/${merchant.slug}`}
      className="block no-underline"
      style={{ color: 'inherit' }}
    >
      <article
        className="relative overflow-hidden bg-white transition-transform hover:-translate-y-1 active:scale-[0.98]"
        style={{
          borderRadius: '24px',
          boxShadow: 'var(--shadow-sm)',
          transition: 'var(--transition)',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.boxShadow = 'var(--shadow-md)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')
        }
      >
        {/* Image */}
        <div
          className="relative w-full bg-gray-100"
          style={{
            height: imageHeight,
            backgroundImage: merchant.cover_image
              ? `url(${merchant.cover_image})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Badge sponsorisé */}
          {merchant.is_sponsored && (
            <span
              className="absolute left-3 top-3 text-white"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Sponsorisé
            </span>
          )}

          {/* Bouton favori */}
          <button
            onClick={(e) => {
              e.preventDefault()
              setIsFav(!isFav)
            }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 transition-transform hover:scale-110"
            style={{ boxShadow: 'var(--shadow-sm)' }}
            aria-label="Ajouter aux favoris"
          >
            <Heart
              size={16}
              className={cn(
                'transition-colors',
                isFav ? 'fill-[#FF5A5F] text-[#FF5A5F]' : 'text-[#717171]',
              )}
            />
          </button>
        </div>

        {/* Infos */}
        <div style={{ padding: compact ? '12px' : '16px' }}>
          {/* Nom + note */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3
              className="flex items-center gap-1.5 font-bold leading-tight"
              style={{ fontSize: compact ? '16px' : '18px', color: 'var(--text-main)' }}
            >
              {merchant.business_name}
              {merchant.verification_status === 'VERIFIED' && (
                <BadgeCheck
                  size={compact ? 14 : 16}
                  className="shrink-0 text-blue-500"
                  aria-label="Vérifié"
                />
              )}
            </h3>

            {merchant.rating && (
              <div
                className="flex shrink-0 items-center gap-1 font-semibold"
                style={{ fontSize: compact ? '13px' : '14px', color: 'var(--text-main)' }}
              >
                <Star
                  size={compact ? 12 : 14}
                  className="fill-[#FFB400] text-[#FFB400]"
                />
                {merchant.rating}
                {!compact && merchant.review_count && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                    ({merchant.review_count})
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Catégorie + localisation ou distance */}
          <p
            className="mb-3"
            style={{
              fontSize: compact ? '13px' : '14px',
              color: 'var(--text-muted)',
              marginBottom: compact ? '8px' : '12px',
            }}
          >
            {merchant.category.name}
            {merchant.location?.district && ` • ${merchant.location.district}`}
            {compact && merchant.distance_km && ` • ${merchant.distance_km}km`}
          </p>

          {/* Tags */}
          {merchant.tags && merchant.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {merchant.is_open !== undefined && (
                <Tag
                  variant={merchant.is_open ? 'open' : 'closed'}
                >
                  {merchant.is_open ? 'Ouvert' : 'Fermé'}
                </Tag>
              )}
              {merchant.tags.map((tag) => (
                <Tag key={tag} variant={tag === 'Ferme bientôt' ? 'warning' : 'default'}>
                  {tag === 'WhatsApp' ? (
                    <span className="flex items-center gap-1">
                      <MessageCircle size={12} />
                      WhatsApp
                    </span>
                  ) : (
                    tag
                  )}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

// ─── Tag interne ───────────────────────────────────────────────────────────────

type TagVariant = 'default' | 'open' | 'closed' | 'warning'

interface TagProps {
  children: React.ReactNode
  variant?: TagVariant
}

function Tag({ children, variant = 'default' }: TagProps) {
  const styles: Record<TagVariant, React.CSSProperties> = {
    default: { background: 'var(--background)', color: 'var(--text-main)' },
    open: { background: '#E8F5E9', color: '#2E7D32' },
    closed: { background: '#F5F5F5', color: '#757575' },
    warning: { background: '#FEE2E2', color: '#DC2626' },
  }

  return (
    <span
      className="inline-flex items-center font-medium"
      style={{
        ...styles[variant],
        padding: '4px 10px',
        borderRadius: '8px',
        fontSize: '12px',
      }}
    >
      {children}
    </span>
  )
}
