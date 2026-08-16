import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FlatList, StyleSheet, Text } from 'react-native'
import { AppShell } from '@/src/components/AppShell'
import { PartnerJobCard } from '@/src/components/PartnerJobCard'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, layout } from '@/src/theme'

export default function PartnerDispatchScreen() {
  const queryClient = useQueryClient()

  const jobsQuery = useQuery({
    queryKey: ['partner-jobs'],
    queryFn: () => getApiClient().getPartnerJobs(),
    refetchInterval: 15_000,
  })

  const fleetQuery = useQuery({
    queryKey: ['partner-fleet'],
    queryFn: () => getApiClient().getPartnerFleet(),
  })

  const assignMutation = useMutation({
    mutationFn: ({ jobId, courierId }: { jobId: string; courierId: string }) =>
      getApiClient().assignPartnerJob(jobId, courierId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['partner-jobs'] })
      void queryClient.invalidateQueries({ queryKey: ['partner-stats'] })
    },
  })

  const pendingJobs = (jobsQuery.data ?? []).filter(j => !j.courier_profile && j.status !== 'DELIVERED')

  return (
    <AppShell title="Dispatch" subtitle="Courses à assigner">
      {jobsQuery.isLoading || fleetQuery.isLoading ? (
        <LoadingState />
      ) : (
        <>
          {assignMutation.isError ? (
            <Text style={styles.error}>{(assignMutation.error as Error).message}</Text>
          ) : null}
          <FlatList
            data={pendingJobs}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <EmptyState title="Aucune course en attente" subtitle="Les nouvelles missions apparaîtront ici." />
            }
            renderItem={({ item }) => (
              <PartnerJobCard
                job={item}
                fleet={fleetQuery.data ?? []}
                loading={assignMutation.isPending}
                onAssign={async (jobId, courierId) => {
                  await assignMutation.mutateAsync({ jobId, courierId })
                }}
              />
            )}
          />
        </>
      )}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  list: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 12 },
  error: { color: colors.danger, fontFamily: fonts.medium, fontSize: 13, paddingHorizontal: layout.pageGutter },
})
