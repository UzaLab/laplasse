import { useQuery } from '@tanstack/react-query'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppShell } from '@/src/components/AppShell'
import { Card, LoadingState, StatTile } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { formatFcfa } from '@/src/lib/labels'
import { colors, fonts, layout } from '@/src/theme'

export default function PartnerFinancesScreen() {
  const statsQuery = useQuery({
    queryKey: ['partner-stats'],
    queryFn: () => getApiClient().getPartnerStats(),
  })

  if (statsQuery.isLoading) {
    return (
      <AppShell title="Finances">
        <LoadingState />
      </AppShell>
    )
  }

  const stats = statsQuery.data
  const kpis = stats?.kpis

  return (
    <AppShell title="Finances" subtitle={`Période ${stats?.finances.period_days ?? 30} jours`}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.stats}>
          <StatTile label="Commissions" value={formatFcfa(stats?.finances.partner_commission ?? 0)} />
          <StatTile label="Frais livraison" value={formatFcfa(stats?.finances.delivery_fees_total ?? 0)} />
          <StatTile label="Payouts livreurs" value={formatFcfa(stats?.finances.courier_payouts ?? 0)} />
          <StatTile label="Part plateforme" value={formatFcfa(stats?.finances.platform_share ?? 0)} />
        </View>

        <Card>
          <Text style={styles.cardTitle}>Qualité opérationnelle</Text>
          <Text style={styles.line}>Taux de succès : {kpis?.success_rate ?? 0}%</Text>
          <Text style={styles.line}>Acceptation offres : {kpis?.acceptance_rate ?? 0}%</Text>
          <Text style={styles.line}>Ponctualité : {kpis?.on_time_rate ?? 0}%</Text>
          <Text style={styles.line}>Note moyenne : {kpis?.rating_avg?.toFixed(1) ?? '—'} ★</Text>
        </Card>
      </ScrollView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 8 },
  line: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 4 },
})
