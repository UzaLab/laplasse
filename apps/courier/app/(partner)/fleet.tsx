import { useQuery } from '@tanstack/react-query'
import { FlatList, StyleSheet } from 'react-native'
import { AppShell } from '@/src/components/AppShell'
import { FleetCourierRow } from '@/src/components/PartnerJobCard'
import { EmptyState, LoadingState } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { layout } from '@/src/theme'

export default function PartnerFleetScreen() {
  const fleetQuery = useQuery({
    queryKey: ['partner-fleet'],
    queryFn: () => getApiClient().getPartnerFleet(),
    refetchInterval: 30_000,
  })

  return (
    <AppShell title="Flotte" subtitle="Livreurs rattachés">
      {fleetQuery.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={fleetQuery.data ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="Flotte vide"
              subtitle="Invitez des livreurs via le portail web ou liez un compte par email."
            />
          }
          renderItem={({ item }) => <FleetCourierRow courier={item} />}
        />
      )}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  list: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 12 },
})
