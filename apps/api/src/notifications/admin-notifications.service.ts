import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationQueueService } from '../queue/notification-queue.service'
import {
  adminComplaintOpenData,
  adminCourierKycData,
  adminDeliveryDisputeData,
  adminMerchantPendingData,
  adminProductPendingData,
  adminProductReviewPendingData,
  adminReviewPendingData,
  adminShopPendingData,
} from './admin-notification-links'

const MODERATOR_ROLES = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'] as const

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name)
  private adminIdsCache: { ids: string[]; expiresAt: number } | null = null

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationQueue: NotificationQueueService,
  ) {}

  private async moderatorUserIds(): Promise<string[]> {
    const now = Date.now()
    if (this.adminIdsCache && this.adminIdsCache.expiresAt > now) {
      return this.adminIdsCache.ids
    }

    const users = await this.prisma.user.findMany({
      where: {
        role: { in: [...MODERATOR_ROLES] },
        is_active: true,
      },
      select: { id: true },
    })

    const ids = users.map(u => u.id)
    this.adminIdsCache = { ids, expiresAt: now + 60_000 }
    return ids
  }

  private async notifyModerators(payload: {
    type: string
    title: string
    body: string
    data?: Record<string, unknown> | null
  }) {
    const userIds = await this.moderatorUserIds()
    if (!userIds.length) {
      this.logger.warn(`Aucun modérateur actif — notification ignorée [${payload.type}]`)
      return
    }

    await Promise.all(
      userIds.map(userId =>
        this.notificationQueue.enqueuePush({
          userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? undefined,
        }),
      ),
    )
  }

  merchantPendingReview(merchantId: string, businessName: string) {
    return this.notifyModerators({
      type: 'admin_merchant_pending',
      title: 'Nouvel établissement à valider',
      body: `${businessName} attend votre validation.`,
      data: adminMerchantPendingData(merchantId),
    }).catch(err => this.logger.warn(`admin_merchant_pending: ${(err as Error).message}`))
  }

  shopPendingReview(shopId: string, shopName: string) {
    return this.notifyModerators({
      type: 'admin_shop_pending',
      title: 'Boutique à valider',
      body: `${shopName} a demandé la publication sur le marketplace.`,
      data: adminShopPendingData(shopId),
    }).catch(err => this.logger.warn(`admin_shop_pending: ${(err as Error).message}`))
  }

  productPendingReview(productId: string, productName: string) {
    return this.notifyModerators({
      type: 'admin_product_pending',
      title: 'Produit à modérer',
      body: `${productName} est en attente de validation.`,
      data: adminProductPendingData(productId),
    }).catch(err => this.logger.warn(`admin_product_pending: ${(err as Error).message}`))
  }

  reviewPending(reviewId: string, merchantName: string) {
    return this.notifyModerators({
      type: 'admin_review_pending',
      title: 'Nouvel avis à modérer',
      body: `Avis sur ${merchantName} en attente de publication.`,
      data: adminReviewPendingData(reviewId),
    }).catch(err => this.logger.warn(`admin_review_pending: ${(err as Error).message}`))
  }

  productReviewPending(reviewId: string, productName: string) {
    return this.notifyModerators({
      type: 'admin_product_review_pending',
      title: 'Avis produit à modérer',
      body: `Nouvel avis sur ${productName}.`,
      data: adminProductReviewPendingData(reviewId),
    }).catch(err => this.logger.warn(`admin_product_review_pending: ${(err as Error).message}`))
  }

  complaintOpen(complaintId: string, merchantName: string, reason: string) {
    return this.notifyModerators({
      type: 'admin_complaint_open',
      title: 'Nouveau signalement',
      body: `${merchantName} — ${reason}`,
      data: adminComplaintOpenData(complaintId),
    }).catch(err => this.logger.warn(`admin_complaint_open: ${(err as Error).message}`))
  }

  courierKycPending(courierId: string, displayName: string) {
    return this.notifyModerators({
      type: 'admin_courier_kyc',
      title: 'KYC livreur à valider',
      body: `${displayName} a soumis son dossier livreur.`,
      data: adminCourierKycData(courierId),
    }).catch(err => this.logger.warn(`admin_courier_kyc: ${(err as Error).message}`))
  }

  deliveryDispute(disputeId: string, orderId: string, shopName: string, reason: string) {
    return this.notifyModerators({
      type: 'admin_delivery_dispute',
      title: 'Litige livraison',
      body: `${shopName} — ${reason}`,
      data: adminDeliveryDisputeData(disputeId, orderId),
    }).catch(err => this.logger.warn(`admin_delivery_dispute: ${(err as Error).message}`))
  }
}
