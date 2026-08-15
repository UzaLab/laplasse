import type { Order } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { formatOrderRef } from '@/src/lib/orderUtils'

export function buildOrderReceiptText(order: Order): string {
  const seller =
    order.shop?.name ?? order.merchant?.business_name ?? 'Vendeur'
  const lines: string[] = [
    'LaPlasse — Reçu de commande',
    formatOrderRef(order.id),
    '',
    `Vendeur : ${seller}`,
    `Date : ${new Date(order.created_at).toLocaleString('fr-FR')}`,
    `Statut : ${order.status}`,
  ]

  if (order.payment?.reference) {
    lines.push(`Réf. paiement : ${order.payment.reference}`)
  }

  lines.push('', 'Articles :')
  for (const item of order.items ?? []) {
    const variant = item.variant_name ? ` (${item.variant_name})` : ''
    lines.push(
      `- ${item.product_name}${variant} × ${item.quantity} : ${formatPrice(item.line_total, order.currency)}`,
    )
  }

  lines.push('')
  lines.push(`Sous-total : ${formatPrice(order.subtotal, order.currency)}`)
  if ((order.discount_amount ?? 0) > 0) {
    lines.push(`Remise : -${formatPrice(order.discount_amount ?? 0, order.currency)}`)
  }
  if ((order.delivery_fee ?? 0) > 0) {
    lines.push(`Livraison : ${formatPrice(order.delivery_fee ?? 0, order.currency)}`)
  }
  lines.push(`Total : ${formatPrice(order.total, order.currency)}`)
  lines.push('', `Généré le ${new Date().toLocaleDateString('fr-FR')}`)

  return lines.join('\n')
}
