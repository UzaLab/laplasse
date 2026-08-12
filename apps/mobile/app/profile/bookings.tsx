import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ProfileBadge,
  ProfileCard,
  ProfileFilterTabs,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { getApiClient } from '@/src/lib/api'
import {
  BOOKING_STATUS_LABELS,
  BOOKING_TYPE_LABELS,
  getBookingCardMeta,
  getBookingPricingSummary,
  getBookingWhenDisplay,
} from '@/src/lib/bookingDisplay'
import { fetchMyBookings } from '@/src/lib/profileApi'
import { notify } from '@/src/lib/notify'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

type Tab = 'upcoming' | 'history'

export default function ProfileBookingsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('upcoming')
  const [page, setPage] = useState(1)

  const bookingsQuery = useQuery({
    queryKey: ['my-bookings', tab, page],
    queryFn: () => fetchMyBookings(tab, page, 8),
  })

  const cancelMutation = useMutation({
    mutationFn: (id: string) => getApiClient().cancelMyBooking(id),
    onSuccess: () => {
      notify.success('Réservation annulée')
      void queryClient.invalidateQueries({ queryKey: ['my-bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['profile-upcoming-bookings'] })
    },
    onError: (e: Error) => notify.error('Annulation impossible', e.message),
  })

  const data = bookingsQuery.data
  const items = data?.items ?? []

  function confirmCancel(id: string) {
    Alert.alert('Annuler la réservation', 'Cette action est définitive.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Annuler', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ])
  }

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Mes réservations"
        subtitle="Consultez vos rendez-vous à venir et votre historique."
      />

      <ProfileFilterTabs
        tabs={[
          { id: 'upcoming' as const, label: 'À venir' },
          { id: 'history' as const, label: 'Historique' },
        ]}
        active={tab}
        onChange={next => {
          setTab(next)
          setPage(1)
        }}
      />

      {bookingsQuery.isLoading ? (
        <ActivityIndicator color={profileTheme.accent} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <ProfileCard>
          <Text style={styles.emptyTitle}>Aucune réservation</Text>
          <Text style={styles.emptySub}>
            {tab === 'upcoming'
              ? 'Réservez un spa, un restaurant ou un hôtel via LaPlasse.'
              : 'Votre historique apparaîtra ici.'}
          </Text>
          <Pressable
            style={styles.exploreBtn}
            onPress={() => router.push('/(tabs)/search' as never)}
          >
            <Text style={styles.exploreBtnText}>Explorer</Text>
          </Pressable>
        </ProfileCard>
      ) : (
        items.map(booking => {
          const when = getBookingWhenDisplay(booking)
          const meta = getBookingCardMeta(booking)
          const price = getBookingPricingSummary(booking)
          const canCancel = tab === 'upcoming' && ['PENDING', 'CONFIRMED'].includes(booking.status)

          return (
            <ProfileCard key={booking.id}>
              <View style={styles.cardTop}>
                {booking.merchant.cover_image ? (
                  <Image source={{ uri: booking.merchant.cover_image }} style={styles.cover} />
                ) : (
                  <View style={[styles.cover, styles.coverFallback]}>
                    <Ionicons name="calendar-outline" size={22} color={profileTheme.textLight} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.badgesRow}>
                    <ProfileBadge
                      label={BOOKING_TYPE_LABELS[booking.booking_type]}
                      tone="neutral"
                    />
                    <ProfileBadge
                      label={BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                      tone={
                        booking.status === 'CONFIRMED'
                          ? 'success'
                          : booking.status === 'PENDING'
                            ? 'warning'
                            : 'neutral'
                      }
                    />
                  </View>
                  <Text style={styles.merchant}>{booking.merchant.business_name}</Text>
                  <Text style={styles.when}>{when.headline}</Text>
                  {when.subline ? <Text style={styles.sub}>{when.subline}</Text> : null}
                  {meta.length > 0 ? <Text style={styles.meta}>{meta.join(' · ')}</Text> : null}
                  {price ? <Text style={styles.price}>{price}</Text> : null}
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.secondaryBtn}
                  onPress={() => router.push(`/m/${booking.merchant.slug}` as never)}
                >
                  <Text style={styles.secondaryBtnText}>Établissement</Text>
                </Pressable>
                {canCancel ? (
                  <Pressable
                    style={styles.dangerBtn}
                    onPress={() => confirmCancel(booking.id)}
                  >
                    <Text style={styles.dangerBtnText}>Annuler</Text>
                  </Pressable>
                ) : null}
              </View>
            </ProfileCard>
          )
        })
      )}

      {(data?.totalPages ?? 1) > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage(p => p - 1)}
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Précédent</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {page} / {data?.totalPages ?? 1}
          </Text>
          <Pressable
            disabled={page >= (data?.totalPages ?? 1)}
            onPress={() => setPage(p => p + 1)}
            style={[styles.pageBtn, page >= (data?.totalPages ?? 1) && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Suivant</Text>
          </Pressable>
        </View>
      ) : null}
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  emptyTitle: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 16,
    color: profileTheme.text,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: profileTheme.navActiveBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  exploreBtnText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  cover: { width: 72, height: 72, borderRadius: 16 },
  coverFallback: {
    backgroundColor: profileTheme.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  merchant: { fontFamily: profileTheme.fonts.bold, fontSize: 16, color: profileTheme.text },
  when: { fontFamily: profileTheme.fonts.semibold, fontSize: 13, color: profileTheme.textMuted },
  sub: { fontFamily: profileTheme.fonts.regular, fontSize: 12, color: profileTheme.textLight },
  meta: { fontFamily: profileTheme.fonts.medium, fontSize: 12, color: profileTheme.textMuted },
  price: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.accent },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: profileTheme.border,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.text,
  },
  dangerBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  dangerBtnText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.danger,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: profileTheme.surface,
    borderWidth: 1,
    borderColor: profileTheme.border,
  },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.text },
  pageInfo: { fontFamily: profileTheme.fonts.medium, fontSize: 13, color: profileTheme.textMuted },
})
