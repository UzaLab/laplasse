/** Liens in-app / push pour les alertes modération admin. */

export function adminMerchantPendingData(merchantId: string) {
  return {
    merchant_id: merchantId,
    href: `/admin/merchants/${merchantId}`,
  }
}

export function adminShopPendingData(shopId: string) {
  return {
    shop_id: shopId,
    href: `/admin/shops/${shopId}`,
  }
}

export function adminProductPendingData(productId: string) {
  return {
    product_id: productId,
    href: `/admin/products/${productId}`,
  }
}

export function adminReviewPendingData(reviewId: string) {
  return {
    review_id: reviewId,
    href: '/admin/reviews',
  }
}

export function adminProductReviewPendingData(reviewId: string) {
  return {
    review_id: reviewId,
    href: '/admin/product-reviews',
  }
}

export function adminComplaintOpenData(complaintId: string) {
  return {
    complaint_id: complaintId,
    href: '/admin/complaints',
  }
}

export function adminCourierKycData(courierId: string) {
  return {
    courier_id: courierId,
    href: '/admin/delivery/couriers',
  }
}

export function adminDeliveryDisputeData(disputeId: string, orderId: string) {
  return {
    dispute_id: disputeId,
    order_id: orderId,
    href: '/admin/delivery/disputes',
  }
}
