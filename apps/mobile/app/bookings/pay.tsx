import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { BookingPaymentSession } from '@laplasse/api-client'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function BookingPaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>()
  const hydrated = useAuthStore(s => s.hydrated)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [session, setSession] = useState<BookingPaymentSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!hydrated) return
    if (!isAuthenticated) {
      router.replace('/(auth)/login')
      return
    }
    if (!bookingId) {
      router.back()
      return
    }
    void (async () => {
      try {
        const data = await getApiClient().getBookingPayment(String(bookingId))
        if (!data.payment_required || !data.payment) {
          router.replace({
            pathname: '/bookings/confirmation',
            params: { bookingId: String(bookingId), status: 'success' },
          } as never)
          return
        }
        setSession(data)
      } catch (e) {
        notify.error(
          'Paiement indisponible',
          e instanceof Error ? e.message : 'Impossible de charger le paiement.',
        )
        router.back()
      } finally {
        setReady(true)
      }
    })()
  }, [hydrated, isAuthenticated, bookingId, router])

  async function confirm(simulateResult: 'success' | 'failure') {
    if (!session?.payment) return
    setLoading(true)
    try {
      const result = await getApiClient().confirmBookingPayment(
        session.booking_id,
        session.payment.id,
        simulateResult,
      )
      if (simulateResult === 'success') {
        notify.success('Paiement confirmé', 'Votre acompte a été enregistré.')
        router.replace({
          pathname: '/bookings/confirmation',
          params: {
            bookingId: session.booking_id,
            status: 'success',
            merchantName: session.merchant_name ?? '',
          },
        } as never)
      } else {
        notify.warning('Paiement refusé', result.message ?? 'Réessayez ou payez plus tard.')
      }
    } catch (e) {
      notify.error(
        'Erreur de paiement',
        e instanceof Error ? e.message : 'Paiement impossible',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!ready || !session?.payment) {
    return (
      <PublicScreenShell activeRoute="profile">
        <PublicTopBar />
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand500} />
        </View>
      </PublicScreenShell>
    )
  }

  return (
    <PublicScreenShell activeRoute="profile">
      <PublicTopBar />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: layout.bottomNavHeight + insets.bottom + 24 },
        ]}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="card-outline" size={28} color={colors.brand700} />
        </View>
        <Text style={styles.title}>Payer l&apos;acompte</Text>
        <Text style={styles.subtitle}>{session.merchant_name}</Text>

        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Montant à payer maintenant</Text>
          <Text style={styles.amountValue}>
            {formatPrice(session.payment.amount, session.payment.currency)}
          </Text>
          <Text style={styles.amountRef}>Réf. {session.payment.reference}</Text>
        </View>

        <Text style={styles.instructions}>{session.payment.instructions}</Text>

        <PrimaryButton
          label="Confirmer le paiement"
          onPress={() => void confirm('success')}
          loading={loading}
        />
        <SecondaryButton
          label="Simuler un échec"
          onPress={() => void confirm('failure')}
        />

        <Pressable
          onPress={() =>
            router.replace({
              pathname: '/bookings/confirmation',
              params: { bookingId: session.booking_id, status: 'pending' },
            } as never)
          }
          style={styles.laterBtn}
        >
          <Text style={styles.laterText}>Payer plus tard</Text>
        </Pressable>
      </ScrollView>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.gutter, gap: 16 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  amountBox: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  amountLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  amountValue: { fontFamily: fonts.extrabold, fontSize: 32, color: colors.text },
  amountRef: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight, marginTop: 4 },
  instructions: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  laterBtn: { alignItems: 'center', paddingVertical: 12 },
  laterText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },
})
