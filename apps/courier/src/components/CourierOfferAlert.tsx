import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, Vibration, View } from 'react-native'
import { getApiClient } from '@/src/lib/api'
import { formatFcfa } from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, radii } from '@/src/theme'

export function CourierOfferAlert() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const profile = useAuthStore(s => s.user?.courier_profile)
  const isOnline = profile?.is_online ?? false
  const canWork = profile?.status === 'ACTIVE'
  const [dismissedId, setDismissedId] = useState<string | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const { data: jobs = [] } = useQuery({
    queryKey: ['courier-jobs-available'],
    queryFn: () => getApiClient().getCourierAvailableJobs(),
    enabled: !!profile && canWork && isOnline,
    refetchInterval: 3_000,
  })

  const urgentJob = useMemo(
    () => jobs.find(j => j.offered_to_me && (j.offer_seconds_left ?? 0) > 0) ?? null,
    [jobs],
  )

  const visible = !!urgentJob && urgentJob.id !== dismissedId

  useEffect(() => {
    if (!visible || !urgentJob) return
    setSecondsLeft(urgentJob.offer_seconds_left ?? 30)
    Vibration.vibrate([0, 400, 200, 400, 200, 400])
  }, [visible, urgentJob?.id, urgentJob?.offer_seconds_left])

  useEffect(() => {
    if (!visible || secondsLeft == null || secondsLeft <= 0) return
    const t = setInterval(() => {
      setSecondsLeft(prev => (prev != null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [visible, secondsLeft])

  const acceptMutation = useMutation({
    mutationFn: (jobId: string) => getApiClient().acceptCourierJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
      void queryClient.invalidateQueries({ queryKey: ['courier-active-job'] })
      router.push('/(courier)/missions')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (jobId: string) => getApiClient().rejectCourierJob(jobId),
    onSuccess: () => {
      if (urgentJob) setDismissedId(urgentJob.id)
      void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
    },
  })

  if (!visible || !urgentJob) return null

  const shopName = urgentJob.order.shop_name ?? 'Commerce'
  const busy = acceptMutation.isPending || rejectMutation.isPending

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NOUVELLE COURSE</Text>
          </View>
          <Text style={styles.title}>Acceptez maintenant</Text>
          <Text style={styles.shop}>{shopName}</Text>
          <Text style={styles.meta}>
            {formatFcfa(urgentJob.order.delivery_fee)} · {urgentJob.order.delivery_district ?? urgentJob.dropoff_address ?? 'Livraison'}
          </Text>
          <View style={styles.timerWrap}>
            <Text style={styles.timer}>{secondsLeft ?? 0}s</Text>
            <Text style={styles.timerHint}>pour répondre</Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              style={[styles.rejectBtn, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => void rejectMutation.mutateAsync(urgentJob.id)}
            >
              <Text style={styles.rejectText}>Refuser</Text>
            </Pressable>
            <Pressable
              style={[styles.acceptBtn, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => void acceptMutation.mutateAsync(urgentJob.id)}
            >
              <Text style={styles.acceptText}>Accepter</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => {
              setDismissedId(urgentJob.id)
              router.push('/(courier)/missions')
            }}
          >
            <Text style={styles.detailsLink}>Voir le détail →</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.emerald500,
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.extrabold,
    fontSize: 11,
    color: '#fff',
    letterSpacing: 0.8,
  },
  title: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  shop: { fontFamily: fonts.bold, fontSize: 18, color: colors.emerald700 },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  timerWrap: { alignItems: 'center', paddingVertical: 12 },
  timer: { fontFamily: fonts.extrabold, fontSize: 48, color: colors.danger, lineHeight: 52 },
  timerHint: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  rejectText: { fontFamily: fonts.bold, fontSize: 15, color: colors.textMuted },
  acceptBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: colors.emerald600,
    alignItems: 'center',
  },
  acceptText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  btnDisabled: { opacity: 0.6 },
  detailsLink: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.emerald600,
    textAlign: 'center',
    marginTop: 8,
  },
})
