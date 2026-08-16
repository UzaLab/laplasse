import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { CourierJobCard } from '@/src/components/CourierJobCard'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { MissionMap } from '@/src/components/MissionMap'
import { LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout } from '@/src/theme'

export default function CourierMissionScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>()
  const profile = useAuthStore(s => s.user?.courier_profile)

  const jobQuery = useQuery({
    queryKey: ['courier-job', jobId],
    queryFn: async () => {
      const active = await getApiClient().getCourierActiveJob()
      if (active?.id === jobId) return active
      const history = await getApiClient().getCourierJobHistory()
      return history.find(j => j.id === jobId) ?? active
    },
    enabled: !!jobId,
  })

  if (jobQuery.isLoading) {
    return (
      <CourierShell showBack>
        <LoadingState />
      </CourierShell>
    )
  }

  const job = jobQuery.data
  if (!job) {
    return (
      <CourierShell showBack>
        <Text style={styles.missing}>Mission introuvable</Text>
      </CourierShell>
    )
  }

  return (
    <CourierShell showBack>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CourierPageHeader title="Mission" subtitle={job.order.shop_name} />
        <MissionMap
          pickupLabel={job.pickup_address ?? job.order.shop_address}
          dropoffLabel={job.dropoff_address ?? job.order.delivery_address}
          courierLat={profile?.current_latitude}
          courierLng={profile?.current_longitude}
        />
        <CourierJobCard job={job} mode="active" />
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: 32, gap: 16 },
  missing: { padding: 24, fontFamily: fonts.medium, color: colors.textMuted, textAlign: 'center' },
})
