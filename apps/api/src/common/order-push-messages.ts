import type { DeliveryType, OrderStatus } from '../../generated/prisma/client'

export function buildOrderStatusPushMessage(
  status: OrderStatus,
  deliveryType: DeliveryType,
  sellerName?: string | null,
): { title: string; body: string } {
  const shop = sellerName?.trim() || 'La boutique'

  switch (status) {
    case 'CONFIRMED':
      return {
        title: 'Commande confirmée',
        body: `${shop} a confirmé votre commande. Préparation en cours.`,
      }
    case 'PREPARING':
      return {
        title: 'Commande en préparation',
        body: `${shop} prépare votre commande.`,
      }
    case 'READY':
      if (deliveryType === 'PICKUP') {
        return {
          title: 'Prête à retirer',
          body: `Votre commande chez ${shop} est prête. Vous pouvez passer la récupérer.`,
        }
      }
      return {
        title: 'Prête pour expédition',
        body: `Votre commande chez ${shop} est prête et sera bientôt expédiée.`,
      }
    case 'OUT_FOR_DELIVERY':
      return {
        title: 'Commande en route',
        body: 'Votre commande est en cours de livraison.',
      }
    case 'DELIVERED':
      return {
        title: 'Commande livrée',
        body: 'Votre commande a été livrée. Bon appétit !',
      }
    case 'COMPLETED':
      return {
        title: 'Commande terminée',
        body: deliveryType === 'PICKUP'
          ? 'Retrait confirmé. Merci pour votre achat !'
          : 'Commande finalisée. Merci pour votre achat !',
      }
    case 'CANCELLED':
      return {
        title: 'Commande annulée',
        body: 'Votre commande a été annulée.',
      }
    case 'REFUNDED':
      return {
        title: 'Commande remboursée',
        body: 'Votre commande a été remboursée.',
      }
    default:
      return {
        title: 'Mise à jour commande',
        body: 'Le statut de votre commande a été mis à jour.',
      }
  }
}
