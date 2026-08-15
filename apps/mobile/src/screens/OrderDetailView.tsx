import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState, type ReactNode } from 'react'
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { ProfileShell } from '@/src/components/profile/ProfileShell'
import { CourierReviewPrompt } from '@/src/components/orders/CourierReviewPrompt'
import { DeliveryDisputeSheet } from '@/src/components/orders/DeliveryDisputeSheet'
import { OrderAgainButton } from '@/src/components/orders/OrderAgainButton'
import { OrderDeliveryEtaBanner } from '@/src/components/orders/OrderDeliveryEtaBanner'
import { OrderItemRow } from '@/src/components/orders/OrderItemRow'
import { OrderReturnSheet } from '@/src/components/orders/OrderReturnSheet'
import { OrderTimeline } from '@/src/components/orders/OrderTimeline'
import { SavStatusBanner } from '@/src/components/orders/SavStatusBanner'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { AppImage } from '@/src/components/ui/AppImage'
import { EmptyState, LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import {
  isDeliveryDisputeEligible,
  isFoodOrderSavMessage,
  isOrderReturnEligible,
} from '@/src/lib/orderSav'
import {
  formatOrderRef,
  getCourierName,
  getOrderDisplayStatus,
  getReadyStatusDetailLabel,
  getSellerName,
  getSellerPhone,
  ORDER_DETAIL_STATUS_LABELS,
  resolveOrderStatus,
} from '@/src/lib/orderUtils'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { profileTheme } from '@/src/lib/profileTheme'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, radii } from '@/src/theme'

const PLACEHOLDER_LOGO = 'https://cdn.laplasse.ci/static/product-placeholder.png'

function OrderDetailShell({ children }: { children: ReactNode }) {
  return <ProfileShell>{children}</ProfileShell>
}

function ActionPill({
  label,
  icon,
  onPress,
  disabled,
  primary,
}: {
  label: string
  icon: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  disabled?: boolean
  primary?: boolean
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={[
        styles.actionPill,
        primary && styles.actionPillPrimary,
        (disabled || !onPress) && styles.actionPillDisabled,
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={primary ? '#fff' : colors.textMuted}
      />
      <Text style={[styles.actionPillText, primary && styles.actionPillTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  )
}

export function OrderDetailView({ orderId }: { orderId: string }) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [returnOpen, setReturnOpen] = useState(false)
  const [disputeOpen, setDisputeOpen] = useState(false)

  const orderQuery = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getApiClient().getOrder(orderId),
    enabled: isAuthenticated && !!orderId,
    refetchInterval: query => {
      const order = query.state.data
      if (!order) return false
      const status = resolveOrderStatus(order)
      if (order.delivery_type !== 'DELIVERY') return false
      if (['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status)) return false
      if (order.delivery_job?.status === 'DELIVERED') return false
      return 12_000
    },
  })

  if (!isAuthenticated) {
    return (
      <OrderDetailShell>
        <View style={styles.center}>
          <EmptyState title="Connectez-vous" />
          <PrimaryButton label="Se connecter" onPress={() => router.push('/(auth)/login')} />
        </View>
      </OrderDetailShell>
    )
  }

  if (orderQuery.isLoading) {
    return (
      <OrderDetailShell>
        <LoadingState />
      </OrderDetailShell>
    )
  }

  const order = orderQuery.data
  if (!order) {
    return (
      <OrderDetailShell>
        <View style={styles.center}>
          <EmptyState title="Commande introuvable" />
          <Pressable onPress={() => router.push('/profile/orders' as never)} style={styles.backLink}>
            <Ionicons name="arrow-back" size={16} color={colors.brand700} />
            <Text style={styles.backLinkText}>Retour aux commandes</Text>
          </Pressable>
        </View>
      </OrderDetailShell>
    )
  }

  const effectiveStatus = resolveOrderStatus(order)
  const displayStatus = getOrderDisplayStatus(effectiveStatus)
  const statusDetail =
    effectiveStatus === 'READY'
      ? getReadyStatusDetailLabel(order.delivery_type)
      : ORDER_DETAIL_STATUS_LABELS[effectiveStatus] ?? effectiveStatus

  const merchantName = getSellerName(order)
  const supportPhone = getSellerPhone(order)
  const trackingToken = order.delivery_job?.tracking_token
  const trackingHref = trackingToken ? `/delivery/track/${trackingToken}` : null

  const pendingPayment = order.status === 'PENDING' && order.payment?.status === 'PENDING'
  const showTrack =
    displayStatus === 'active'
    && order.delivery_type === 'DELIVERY'
    && !!trackingToken
    && order.delivery_job?.status !== 'DELIVERED'

  const canDispute = isDeliveryDisputeEligible(order, effectiveStatus)
  const canReturn = isOrderReturnEligible({ ...order, status: effectiveStatus })
  const foodSavHint = isFoodOrderSavMessage({ ...order, status: effectiveStatus })
  const showEta =
    order.delivery_type === 'DELIVERY'
    && displayStatus === 'active'
    && order.delivery_job?.status !== 'DELIVERED'

  const createdAt = new Date(order.created_at)
  const sellerLogo = order.merchant?.logo ?? order.shop?.logo ?? PLACEHOLDER_LOGO
  const courierName = getCourierName(order)

  const openSupport = () => {
    if (!supportPhone) return
    void openWhatsApp(supportPhone, `Bonjour, j'ai une question sur ma commande ${formatOrderRef(order.id)}.`)
  }

  return (
    <OrderDetailShell>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.push('/profile/orders' as never)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={18} color={profileTheme.textMuted} />
          <Text style={styles.backBtnText}>Retour aux commandes</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionsRow}
        >
          {pendingPayment && order.payment?.id ? (
            <ActionPill
              label="Payer"
              icon="card-outline"
              primary
              onPress={() =>
                router.push({
                  pathname: '/payment' as never,
                  params: { paymentId: order.payment!.id!, orderId: order.id },
                })
              }
            />
          ) : null}
          {!pendingPayment && effectiveStatus === 'COMPLETED' ? (
            <OrderAgainButton order={order} effectiveStatus={effectiveStatus} />
          ) : null}
          <ActionPill
            label="Facture"
            icon="download-outline"
            onPress={() => router.push(`/orders/${order.id}/receipt` as never)}
          />
          <ActionPill
            label="Support"
            icon="headset-outline"
            onPress={supportPhone ? openSupport : undefined}
            disabled={!supportPhone}
          />
          {canDispute ? (
            <ActionPill label="Litige" icon="warning-outline" onPress={() => setDisputeOpen(true)} />
          ) : null}
          {canReturn ? (
            <ActionPill label="SAV" icon="cube-outline" onPress={() => setReturnOpen(true)} />
          ) : null}
        </ScrollView>

        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Commande {formatOrderRef(order.id)}</Text>
          <Text style={styles.headerDate}>
            Placée le{' '}
            {createdAt.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            , {createdAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.headerSeller}>{merchantName}</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusPill}>
              {displayStatus === 'active' ? <View style={styles.statusPulse} /> : null}
              <Text style={styles.statusPillText} numberOfLines={2}>{statusDetail}</Text>
            </View>
            {pendingPayment && order.payment?.id ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/payment' as never,
                    params: { paymentId: order.payment!.id!, orderId: order.id },
                  })
                }
                style={styles.payBtn}
              >
                <Ionicons name="card-outline" size={15} color="#fff" />
                <Text style={styles.payBtnText}>Payer</Text>
              </Pressable>
            ) : null}
            {showTrack && trackingHref ? (
              <Pressable
                onPress={() => router.push(trackingHref as never)}
                style={styles.trackBtn}
              >
                <Text style={styles.trackBtnText}>Suivre</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {showEta ? <OrderDeliveryEtaBanner orderId={order.id} enabled={showEta} /> : null}

        {(order.shop || order.merchant) ? (
          <View style={styles.sellerCard}>
            <AppImage uri={sellerLogo} style={styles.sellerLogo} contentFit="cover" />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerLabel}>
                {order.shop && !order.merchant ? 'Boutique' : 'Établissement'}
              </Text>
              <Text style={styles.sellerName} numberOfLines={1}>{merchantName}</Text>
              {order.shop && !order.merchant && order.shop.slug ? (
                <Text style={styles.sellerSlug}>@{order.shop.slug}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <SavStatusBanner order={order} />

        {foodSavHint ? (
          <View style={styles.foodSavHint}>
            <Text style={styles.foodSavTitle}>Retour restauration</Text>
            <Text style={styles.foodSavBody}>
              Pour une commande restaurant, contactez directement l&apos;établissement via WhatsApp ou
              téléphone.
            </Text>
          </View>
        ) : null}

        <CourierReviewPrompt order={order} effectiveStatus={effectiveStatus} />

        {order.delivery_job?.delivery_code && order.delivery_job.status === 'IN_TRANSIT' ? (
          <View style={styles.deliveryCodeCard}>
            <View style={styles.deliveryCodeText}>
              <View style={styles.deliveryCodeLabelRow}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#6ee7b7" />
                <Text style={styles.deliveryCodeLabel}>Code de livraison</Text>
              </View>
              <Text style={styles.deliveryCodeHint}>
                Donnez ce code au livreur à son arrivée pour confirmer la réception.
              </Text>
            </View>
            <Text style={styles.deliveryCodeValue}>{order.delivery_job.delivery_code}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suivi de commande</Text>
          <OrderTimeline status={effectiveStatus} deliveryType={order.delivery_type} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="cart-outline" size={20} color={colors.brand500} />
            <Text style={styles.cardTitleInline}>Articles</Text>
          </View>
          {(order.items ?? []).map((item, index) => (
            <View
              key={item.id}
              style={index > 0 ? styles.itemDivider : undefined}
            >
              <OrderItemRow
                item={item}
                merchantSlug={order.merchant?.slug}
                shopSlug={order.shop?.slug}
                currency={order.currency}
              />
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="car-outline" size={18} color={colors.brand500} />
            <Text style={styles.cardTitleInline}>Livraison</Text>
          </View>
          <View style={styles.metaBlock}>
            <Text style={styles.metaLabel}>Méthode</Text>
            <Text style={styles.metaValue}>
              {order.delivery_type === 'DELIVERY' ? 'Livraison à domicile' : 'Retrait sur place'}
            </Text>
          </View>
          {order.delivery_type === 'DELIVERY' && order.delivery_address ? (
            <>
              <View style={styles.divider} />
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Adresse</Text>
                <Text style={styles.metaValue}>{user?.full_name ?? 'Client'}</Text>
                <Text style={styles.metaMuted}>{order.delivery_address}</Text>
                {order.customer_phone ? (
                  <Text style={styles.metaPhone}>Tél. {order.customer_phone}</Text>
                ) : null}
              </View>
              {order.delivery_job ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.metaBlock}>
                    <Text style={styles.metaLabel}>Suivi livraison</Text>
                    {courierName ? (
                      <Text style={styles.metaValue}>Coursier : {courierName}</Text>
                    ) : null}
                    {trackingHref && showTrack ? (
                      <Pressable onPress={() => router.push(trackingHref as never)}>
                        <Text style={styles.trackLink}>Voir le suivi en direct →</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </>
              ) : null}
            </>
          ) : null}
          {order.customer_note ? (
            <>
              <View style={styles.divider} />
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Note</Text>
                <Text style={styles.metaMuted}>{order.customer_note}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card-outline" size={18} color={colors.brand500} />
            <Text style={styles.cardTitleInline}>Paiement</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Sous-total</Text>
            <Text style={styles.paymentValue}>{formatPrice(order.subtotal, order.currency)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.paymentTotalRow}>
            <Text style={styles.paymentTotalLabel}>Total</Text>
            <Text style={styles.paymentTotalValue}>{formatPrice(order.total, order.currency)}</Text>
          </View>
          {order.payment?.reference ? (
            <View style={styles.paymentRefBox}>
              <Ionicons name="card-outline" size={14} color={colors.textMuted} />
              <Text style={styles.paymentRefText}>
                Réf. {order.payment.reference}
                {order.payment.paid_at ? (
                  <> · Payé le {new Date(order.payment.paid_at).toLocaleDateString('fr-FR')}</>
                ) : null}
              </Text>
            </View>
          ) : null}
          <View style={styles.badgeWrap}>
            <OrderStatusBadge status={effectiveStatus} />
          </View>
        </View>

        {supportPhone ? (
          <View style={styles.contactRow}>
            <Pressable style={styles.contactBtn} onPress={openSupport}>
              <Ionicons name="logo-whatsapp" size={18} color="#16a34a" />
              <Text style={styles.contactText}>Support WhatsApp</Text>
            </Pressable>
            <Pressable
              style={styles.contactBtn}
              onPress={() => void Linking.openURL(`tel:${supportPhone}`)}
            >
              <Ionicons name="call-outline" size={18} color={colors.text} />
              <Text style={styles.contactText}>Appeler</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>

      <OrderReturnSheet order={order} open={returnOpen} onClose={() => setReturnOpen(false)} />
      <DeliveryDisputeSheet order={order} open={disputeOpen} onClose={() => setDisputeOpen(false)} />
    </OrderDetailShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    padding: 20,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 16,
  },
  center: { flex: 1, padding: 20, justifyContent: 'center', gap: 12 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center' },
  backLinkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: -4 },
  backBtnText: { fontFamily: profileTheme.fonts.semibold, fontSize: 14, color: profileTheme.textMuted },
  actionsRow: { gap: 8, paddingVertical: 2 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  actionPillPrimary: {
    backgroundColor: colors.brand500,
    borderColor: colors.brand500,
  },
  actionPillDisabled: { opacity: 0.5 },
  actionPillText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  actionPillTextPrimary: { color: '#fff' },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    overflow: 'hidden',
  },
  headerTitle: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.slate900 },
  headerDate: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  headerSeller: { fontFamily: fonts.medium, fontSize: 14, color: colors.textLight },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    flexShrink: 1,
    maxWidth: '100%',
  },
  statusPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand500,
  },
  statusPillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.brand800, flexShrink: 1 },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.brand500,
  },
  payBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  trackBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.slate900,
  },
  trackBtnText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerLogo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sellerInfo: { flex: 1, minWidth: 0 },
  sellerLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sellerName: { fontFamily: fonts.extrabold, fontSize: 16, color: colors.slate900 },
  sellerSlug: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  foodSavHint: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  foodSavTitle: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  foodSavBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  deliveryCodeCard: {
    backgroundColor: colors.slate900,
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  deliveryCodeText: { flex: 1, gap: 6 },
  deliveryCodeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deliveryCodeLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#6ee7b7',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  deliveryCodeHint: { fontFamily: fonts.regular, fontSize: 13, color: '#cbd5e1', lineHeight: 18 },
  deliveryCodeValue: {
    fontFamily: fonts.extrabold,
    fontSize: 28,
    color: '#fff',
    letterSpacing: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  cardTitle: {
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.slate900,
    marginBottom: 12,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitleInline: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.slate900 },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  metaBlock: { gap: 4, paddingVertical: 4 },
  metaLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight },
  metaValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.slate900 },
  metaMuted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  metaPhone: { fontFamily: fonts.medium, fontSize: 12, color: colors.brand700, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  trackLink: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand600, marginTop: 6 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  paymentLabel: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  paymentValue: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  paymentTotalLabel: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.slate900 },
  paymentTotalValue: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.slate900 },
  paymentRefBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginTop: 12,
  },
  paymentRefText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  badgeWrap: { marginTop: 12 },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: radii.button,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
})
