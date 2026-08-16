import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import type { DeliveryJobStatus } from '@laplasse/api-client'
import { CourierJobCard } from '@/src/components/CourierJobCard'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, layout } from '@/src/theme'

type Tab = 'available' | 'active' | 'history'

export default function CourierMissionsScreen() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('available')
  const [actionError, setActionError] = useState('')

  const availableQuery = useQuery({
    queryKey: ['courier-jobs-available'],
    queryFn: () => getApiClient().getCourierAvailableJobs(),
    refetchInterval: tab === 'available' ? 3_000 : false,
  })

  const activeQuery = useQuery({
    queryKey: ['courier-active-job'],
    queryFn: () => getApiClient().getCourierActiveJob(),
    refetchInterval: tab === 'active' ? 15_000 : false,
  })

  const historyQuery = useQuery({
    queryKey: ['courier-jobs-history'],
    queryFn: () => getApiClient().getCourierJobHistory(),
    enabled: tab === 'history',
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['courier-jobs-available'] })
    void queryClient.invalidateQueries({ queryKey: ['courier-active-job'] })
    void queryClient.invalidateQueries({ queryKey: ['courier-jobs-history'] })
  }

  const acceptMutation = useMutation({
    mutationFn: (jobId: string) => getApiClient().acceptCourierJob(jobId),
    onSuccess: () => { setActionError(''); invalidate() },
    onError: (e: Error) => setActionError(e.message),
  })

  const rejectMutation = useMutation({
    mutationFn: (jobId: string) => getApiClient().rejectCourierJob(jobId),
    onSuccess: invalidate,
    onError: (e: Error) => setActionError(e.message),
  })

  const advanceMutation = useMutation({
    mutationFn: ({ jobId, status, proofOtp }: { jobId: string; status: DeliveryJobStatus; proofOtp?: string }) =>
      getApiClient().advanceCourierJob(jobId, status, proofOtp),
    onSuccess: () => { setActionError(''); invalidate() },
    onError: (e: Error) => setActionError(e.message),
  })

  const loading =
    tab === 'available' ? availableQuery.isLoading
      : tab === 'active' ? activeQuery.isLoading
        : historyQuery.isLoading

  const data =
    tab === 'available' ? (availableQuery.data ?? [])
      : tab === 'active' ? (activeQuery.data ? [activeQuery.data] : [])
        : (historyQuery.data ?? [])

  const busy = acceptMutation.isPending || rejectMutation.isPending || advanceMutation.isPending

  return (
    <CourierShell>
      <View style={styles.headerWrap}>
        <CourierPageHeader title="Missions" subtitle="Offres, course active et historique" />
      </View>

      <View style={styles.tabs}>
        {([
          ['available', 'Disponibles'],
          ['active', 'Active'],
          ['history', 'Historique'],
        ] as const).map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            style={[styles.tab, tab === id && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      {loading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title={tab === 'available' ? 'Aucune offre' : tab === 'active' ? 'Pas de mission active' : 'Historique vide'}
              subtitle={tab === 'available' ? 'Restez en ligne pour recevoir des courses.' : undefined}
            />
          }
          renderItem={({ item }) => (
            <CourierJobCard
              job={item}
              mode={tab}
              loading={busy}
              onAccept={async id => { await acceptMutation.mutateAsync(id) }}
              onReject={async id => { await rejectMutation.mutateAsync(id) }}
              onAdvance={async (id, status, proofOtp) => {
                await advanceMutation.mutateAsync({ jobId: id, status, proofOtp })
              }}
            />
          )}
        />
      )}
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: layout.pageGutter, paddingTop: 8 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: layout.pageGutter, paddingBottom: 8, paddingTop: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.emerald50, borderColor: colors.emerald600 },
  tabText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  tabTextActive: { color: colors.emerald700 },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13, paddingHorizontal: layout.pageGutter },
  list: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 12 },
})
