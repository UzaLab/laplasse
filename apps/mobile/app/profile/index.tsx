import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import {
  ProfileBadge,
  ProfileCard,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { getApiClient } from '@/src/lib/api'
import {
  BOOKING_STATUS_LABELS,
  getBookingCardMeta,
  getBookingPricingSummary,
  getBookingWhenDisplay,
  isBookingUpcoming,
} from '@/src/lib/bookingDisplay'
import { fetchUpcomingBookings } from '@/src/lib/profileApi'
import { profileTheme } from '@/src/lib/profileTheme'
import { formatOrderRef, getSellerName } from '@/src/lib/orderUtils'
import { OrderStatusBadge } from '@/src/components/OrderStatusBadge'
import { useAuthStore } from '@/src/stores/authStore'
import { layout } from '@/src/theme'

const TIER_LABELS: Record<string, string> = {
  EXPLORER: 'Explorateur',
  LOCAL: 'Local',
  INSIDER: 'Insider',
  AMBASSADOR: 'Ambassadeur',
}

const QUICK_ACTIONS = [
  { href: '/profile/loyalty', icon: 'trophy-outline' as const, title: 'Mes points', sub: 'Niveaux & récompenses' },
  { href: '/profile/referral', icon: 'gift-outline' as const, title: 'Parrainage', sub: 'Invitez vos amis' },
  { href: '/profile/notifications', icon: 'notifications-outline' as const, title: 'Notifications', sub: 'Vos alertes' },
]

export default function ProfileDashboardScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const firstName = user?.full_name?.split(' ')[0] ?? 'toi'

  const bookingsQuery = useQuery({
    queryKey: ['profile-upcoming-bookings'],
    queryFn: () => fetchUpcomingBookings(20),
  })

  const ordersQuery = useQuery({
    queryKey: ['profile-recent-orders'],
    queryFn: async () => {
      const orders = await getApiClient().getMyOrders()
      return orders.slice(0, 3)
    },
  })

  const favoritesQuery = useQuery({
    queryKey: ['profile-favorites-preview'],
    queryFn: () => getApiClient().getFavoriteMerchants(),
  })

  const loyaltyQuery = useQuery({
    queryKey: ['loyalty-account'],
    queryFn: () => getApiClient().getLoyaltyAccount(),
  })

  const nextBooking = (bookingsQuery.data ?? []).find(isBookingUpcoming)
  const points = loyaltyQuery.data?.account.points ?? 0
  const tierLabel = TIER_LABELS[loyaltyQuery.data?.account.tier ?? 'EXPLORER'] ?? 'Explorateur'
  const ptsToNext = loyaltyQuery.data?.pointsToNext
  const nextTier = loyaltyQuery.data?.tiers?.find(t => !t.active && t.min > points)

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title={`Bonjour, ${firstName} !`}
        subtitle="Ravi de vous revoir. Voici un résumé de vos activités récentes."
      />

      <ProfileCard dark>
        {nextBooking ? (
          <View style={styles.bookingHero}>
            {nextBooking.merchant.cover_image ? (
              <Image
                source={{ uri: nextBooking.merchant.cover_image }}
                style={styles.bookingCover}
              />
            ) : (
              <View style={[styles.bookingCover, styles.bookingCoverFallback]}>
                <Ionicons name="location-outline" size={28} color="#64748b" />
              </View>
            )}
            <View style={styles.bookingBody}>
              <ProfileBadge label="Prochaine réservation" tone="amber" />
              <Text style={styles.bookingMerchant}>{nextBooking.merchant.business_name}</Text>
              <Text style={styles.bookingWhen}>{getBookingWhenDisplay(nextBooking).headline}</Text>
              {getBookingWhenDisplay(nextBooking).subline ? (
                <Text style={styles.bookingSub}>{getBookingWhenDisplay(nextBooking).subline}</Text>
              ) : null}
              {getBookingCardMeta(nextBooking).length > 0 ? (
                <Text style={styles.bookingMeta}>{getBookingCardMeta(nextBooking).join(' · ')}</Text>
              ) : null}
              {getBookingPricingSummary(nextBooking) ? (
                <Text style={styles.bookingPrice}>{getBookingPricingSummary(nextBooking)}</Text>
              ) : null}
              {nextBooking.status === 'PENDING' ? (
                <Text style={styles.bookingStatus}>{BOOKING_STATUS_LABELS.PENDING}</Text>
              ) : null}
              <View style={styles.bookingActions}>
                <Pressable
                  style={styles.bookingPrimaryBtn}
                  onPress={() => router.push(`/m/${nextBooking.merchant.slug}` as never)}
                >
                  <Text style={styles.bookingPrimaryText}>Voir l&apos;établissement</Text>
                </Pressable>
                <Pressable
                  style={styles.bookingGhostBtn}
                  onPress={() => router.push('/profile/bookings' as never)}
                >
                  <Text style={styles.bookingGhostText}>Mes réservations</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyBooking}>
            <ProfileBadge label="Réservations" tone="neutral" />
            <Text style={styles.emptyBookingTitle}>Aucune réservation à venir</Text>
            <Text style={styles.emptyBookingSub}>Explorez les établissements près de chez vous.</Text>
            <Pressable
              style={styles.exploreCta}
              onPress={() => router.push('/(tabs)/search' as never)}
            >
              <Text style={styles.exploreCtaText}>Explorer</Text>
            </Pressable>
          </View>
        )}
      </ProfileCard>

      <ProfileCard>
        <View style={styles.loyaltyTop}>
          <View style={styles.loyaltyIcon}>
            <Ionicons name="trophy" size={22} color={profileTheme.accent} />
          </View>
          <ProfileBadge label="LaPlasse Club" tone="neutral" />
        </View>
        <Text style={styles.loyaltyLabel}>Points fidélité</Text>
        <View style={styles.loyaltyPointsRow}>
          <Text style={styles.loyaltyPoints}>{points.toLocaleString('fr-FR')}</Text>
          <Text style={styles.loyaltyPtsUnit}>pts</Text>
        </View>
        <Text style={styles.loyaltyTier}>
          Statut <Text style={styles.loyaltyTierBold}>{tierLabel}</Text>
          {ptsToNext != null && nextTier
            ? ` — ${ptsToNext} pts avant ${nextTier.label}`
            : null}
        </Text>
        <Pressable
          style={styles.loyaltyLink}
          onPress={() => router.push('/profile/loyalty' as never)}
        >
          <Text style={styles.loyaltyLinkText}>Voir mes points</Text>
          <Ionicons name="chevron-forward" size={16} color={profileTheme.accent} />
        </Pressable>
      </ProfileCard>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Commandes récentes</Text>
          <Pressable onPress={() => router.push('/profile/orders' as never)}>
            <Text style={styles.sectionLink}>Tout voir</Text>
          </Pressable>
        </View>
        {(ordersQuery.data ?? []).length === 0 ? (
          <ProfileCard>
            <Text style={styles.emptyText}>Aucune commande pour le moment.</Text>
          </ProfileCard>
        ) : (
          (ordersQuery.data ?? []).map(order => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/orders/${order.id}` as never)}
            >
              <ProfileCard>
                <View style={styles.orderTop}>
                  <Text style={styles.orderRef}>{formatOrderRef(order.id)}</Text>
                  <OrderStatusBadge status={order.status} />
                </View>
                <Text style={styles.orderSeller}>{getSellerName(order)}</Text>
                <Text style={styles.orderTotal}>{formatPrice(order.total, order.currency)}</Text>
              </ProfileCard>
            </Pressable>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Favoris</Text>
          <Pressable onPress={() => router.push('/favoris' as never)}>
            <Text style={styles.sectionLink}>Tout voir</Text>
          </Pressable>
        </View>
        {(favoritesQuery.data ?? []).length === 0 ? (
          <ProfileCard>
            <Text style={styles.emptyText}>Aucun favori enregistré.</Text>
          </ProfileCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.favTrack}>
            {(favoritesQuery.data ?? []).slice(0, 6).map(fav => (
              <Pressable
                key={fav.id}
                style={styles.favCard}
                onPress={() => router.push(`/m/${fav.slug}` as never)}
              >
                {fav.cover_image ? (
                  <Image source={{ uri: fav.cover_image }} style={styles.favCover} />
                ) : (
                  <View style={[styles.favCover, styles.favCoverFallback]}>
                    <Ionicons name="storefront-outline" size={24} color={profileTheme.textLight} />
                  </View>
                )}
                <Text style={styles.favName} numberOfLines={2}>{fav.business_name}</Text>
                <Text style={styles.favCat} numberOfLines={1}>{fav.category.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        {QUICK_ACTIONS.map(action => (
          <Pressable
            key={action.href}
            onPress={() => router.push(action.href as never)}
          >
            <ProfileCard>
              <View style={styles.quickRow}>
                <View style={styles.quickIcon}>
                  <Ionicons name={action.icon} size={20} color={profileTheme.accent} />
                </View>
                <View style={styles.quickText}>
                  <Text style={styles.quickTitle}>{action.title}</Text>
                  <Text style={styles.quickSub}>{action.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={profileTheme.textLight} />
              </View>
            </ProfileCard>
          </Pressable>
        ))}
      </View>
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  bookingHero: { gap: 16 },
  bookingCover: { width: '100%', height: 140, borderRadius: 20 },
  bookingCoverFallback: {
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingBody: { gap: 8 },
  bookingMerchant: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 20,
    color: '#fff',
  },
  bookingWhen: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 14,
    color: '#cbd5e1',
  },
  bookingSub: { fontFamily: profileTheme.fonts.medium, fontSize: 13, color: '#94a3b8' },
  bookingMeta: { fontFamily: profileTheme.fonts.medium, fontSize: 13, color: '#cbd5e1' },
  bookingPrice: { fontFamily: profileTheme.fonts.bold, fontSize: 14, color: profileTheme.navIconActive },
  bookingStatus: { fontFamily: profileTheme.fonts.medium, fontSize: 12, color: '#94a3b8' },
  bookingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bookingPrimaryBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  bookingPrimaryText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.navActiveBg,
  },
  bookingGhostBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  bookingGhostText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: '#fff',
  },
  emptyBooking: { gap: 10, alignItems: 'flex-start' },
  emptyBookingTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 18,
    color: '#fff',
  },
  emptyBookingSub: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  exploreCta: {
    marginTop: 4,
    backgroundColor: profileTheme.navIconActive,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  exploreCtaText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.navActiveBg,
  },
  loyaltyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loyaltyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: profileTheme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loyaltyLabel: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 11,
    color: profileTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  loyaltyPointsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  loyaltyPoints: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 36,
    color: profileTheme.text,
  },
  loyaltyPtsUnit: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: profileTheme.textLight,
  },
  loyaltyTier: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 14,
    color: profileTheme.textMuted,
  },
  loyaltyTierBold: { color: profileTheme.text, fontFamily: profileTheme.fonts.bold },
  loyaltyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: profileTheme.borderLight,
    paddingTop: 14,
    marginTop: 4,
  },
  loyaltyLinkText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: profileTheme.accent,
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 18,
    color: profileTheme.text,
  },
  sectionLink: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.accent,
  },
  emptyText: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderRef: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.text },
  orderSeller: { fontFamily: profileTheme.fonts.medium, fontSize: 14, color: profileTheme.textMuted },
  orderTotal: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.accent },
  favTrack: { gap: 12, paddingRight: 8 },
  favCard: {
    width: 140,
    backgroundColor: profileTheme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: profileTheme.border,
    overflow: 'hidden',
  },
  favCover: { width: '100%', height: 90 },
  favCoverFallback: {
    backgroundColor: profileTheme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favName: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.text,
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  favCat: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 11,
    color: profileTheme.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: profileTheme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: { flex: 1 },
  quickTitle: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.text },
  quickSub: { fontFamily: profileTheme.fonts.regular, fontSize: 12, color: profileTheme.textMuted, marginTop: 2 },
})
