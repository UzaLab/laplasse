import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppShell } from '@/src/components/AppShell'
import { LoadingState, StatTile } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { formatFcfa } from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout } from '@/src/theme'

export default function PartnerDashboardScreen() {
  const router = useRouter()
  const partner = useAuthStore(s => s.user?.logistics_partner)

  const statsQuery = useQuery({
    queryKey: ['partner-stats'],
    queryFn: () => getApiClient().getPartnerStats(),
    enabled: !!partner,
  })

  if (!partner) return <LoadingState />

  const stats = statsQuery.data

  return (
    <AppShell
      title={partner.trade_name ?? partner.legal_name}
      subtitle={`${partner.city} · ${partner._count?.couriers ?? 0} livreurs`}
    >
      {statsQuery.isLoading ? (
        <LoadingState />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.stats}>
            <StatTile label="Score" value={`${stats?.score ?? 0} (${stats?.grade ?? '—'})`} />
            <StatTile label="Flotte en ligne" value={`${stats?.fleet.online ?? 0}/${stats?.fleet.total ?? 0}`} />
            <StatTile label="Missions actives" value={String(stats?.jobs.active ?? 0)} />
            <StatTile label="En attente" value={String(stats?.jobs.pending ?? 0)} />
          </View>

          <View style={styles.financeCard}>
            <Text style={styles.financeTitle}>Finances (30 j)</Text>
            <Text style={styles.financeLine}>Commissions : {formatFcfa(stats?.finances.partner_commission ?? 0)}</Text>
            <Text style={styles.financeLine}>Frais livraison : {formatFcfa(stats?.finances.delivery_fees_total ?? 0)}</Text>
            <Text style={styles.financeLine}>Payouts livreurs : {formatFcfa(stats?.finances.courier_payouts ?? 0)}</Text>
          </View>

          <Pressable style={styles.linkCard} onPress={() => router.push('/(partner)/dispatch')}>
            <Text style={styles.linkTitle}>Ouvrir le dispatch</Text>
            <Text style={styles.linkHint}>Assigner les courses en attente</Text>
          </Pressable>
        </ScrollView>
      )}
    </AppShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  financeCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 6,
  },
  financeTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 4 },
  financeLine: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  linkCard: {
    backgroundColor: '#e0f2fe',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  linkTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#0369a1' },
  linkHint: { fontFamily: fonts.regular, fontSize: 13, color: '#0284c7', marginTop: 4 },
})
