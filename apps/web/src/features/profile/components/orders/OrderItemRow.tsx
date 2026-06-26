import Link from 'next/link'
import type { OrderItem } from '@/lib/marketplaceApi'
import { formatPrice, PLACEHOLDER_PRODUCT_IMAGE } from '@/lib/marketplaceApi'
import {
  formatModifiersLabel,
  groupModifiersByLabel,
  parseSelectedModifiers,
} from '@/lib/menuModifiers'

export function orderItemImageUrl(item: OrderItem): string {
  return (
    item.product?.image_url
    ?? item.menu_item?.image_url
    ?? PLACEHOLDER_PRODUCT_IMAGE
  )
}

export function orderItemHref(
  item: OrderItem,
  ctx: { merchantSlug?: string | null; shopSlug?: string | null },
): string | null {
  const productSlug = item.product?.slug
  if (!productSlug) return null
  if (ctx.merchantSlug) return `/m/${ctx.merchantSlug}/p/${productSlug}`
  if (ctx.shopSlug) return `/m/${ctx.shopSlug}/p/${productSlug}`
  return null
}

export function orderItemMetaLines(item: OrderItem): Array<{ label?: string; value: string }> {
  const lines: Array<{ label?: string; value: string }> = []
  const modifiers = parseSelectedModifiers(item.modifiers)
  const modifierGroups = groupModifiersByLabel(modifiers)
  const modifiersFlat = formatModifiersLabel(modifiers)

  if (item.variant_name && item.menu_item_id) {
    if (modifierGroups.length === 0) {
      lines.push({ value: item.variant_name })
    }
  } else if (item.variant_name) {
    lines.push({ value: item.variant_name })
  }

  for (const { group, options } of modifierGroups) {
    lines.push({ label: group, value: options.join(', ') })
  }

  if (
    item.variant_name
    && modifiersFlat
    && item.variant_name !== modifiersFlat
    && !item.menu_item_id
    && modifierGroups.length === 0
  ) {
    lines.push({ value: item.variant_name })
  }

  return lines
}

interface OrderItemRowProps {
  item: OrderItem
  merchantSlug?: string | null
  shopSlug?: string | null
}

export function OrderItemRow({ item, merchantSlug, shopSlug }: OrderItemRowProps) {
  const metaLines = orderItemMetaLines(item)
  const href = orderItemHref(item, { merchantSlug, shopSlug })

  const nameEl = href ? (
    <Link
      href={href}
      className="text-sm font-bold text-slate-900 leading-snug line-clamp-2 hover:text-amber-600 transition-colors block"
      style={{ textDecoration: 'none' }}
    >
      {item.product_name}
    </Link>
  ) : (
    <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
      {item.product_name}
    </h3>
  )

  return (
    <div className="flex gap-3 sm:gap-4">
      {href ? (
        <Link
          href={href}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 block"
          style={{ textDecoration: 'none' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={orderItemImageUrl(item)}
            alt=""
            className="w-full h-full object-cover"
          />
        </Link>
      ) : (
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={orderItemImageUrl(item)}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 min-w-0 space-y-1">
        {nameEl}

        {metaLines.map(line => (
          <p key={`${line.label ?? ''}-${line.value}`} className="text-xs text-slate-500 leading-relaxed">
            {line.label ? (
              <>
                <span className="font-semibold text-slate-600">{line.label} : </span>
                {line.value}
              </>
            ) : (
              line.value
            )}
          </p>
        ))}

        <p className="text-xs text-slate-400 pt-0.5">
          Qté {item.quantity}
          <span className="mx-1.5 text-slate-300">·</span>
          {formatPrice(item.unit_price)}/u
        </p>

        <p className="text-sm font-extrabold text-amber-600 tabular-nums">
          {formatPrice(item.line_total)}
        </p>
      </div>
    </div>
  )
}
