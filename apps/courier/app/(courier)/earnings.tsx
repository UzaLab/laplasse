import { useQuery } from '@tanstack/react-query'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { Card, EmptyState, LoadingState, StatTile } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { formatFcfa } from '@/src/lib/labels'
import { colors, fonts, layout } from '@/src/theme'

export default function CourierEarningsScreen() {
  const walletQuery = useQuery({
    queryKey: ['courier-wallet'],
    queryFn: () => getApiClient().getCourierWallet(),
  })

  const entriesQuery = useQuery({
    queryKey: ['courier-wallet-entries'],
    queryFn: () => getApiClient().getCourierWalletEntries(1, 20),
  })

  if (walletQuery.isLoading) {
    return (
      <CourierShell>
        <LoadingState />
      </CourierShell>
    )
  }

  const wallet = walletQuery.data

  return (
    <CourierShell>
      <View style={styles.headerWrap}>
        <CourierPageHeader title="Gains" subtitle="Portefeuille et historique" />
      </View>

      <View style={styles.summary}>
        <StatTile label="Solde" value={formatFcfa(wallet?.balance ?? 0)} />
        <StatTile label="Aujourd'hui" value={formatFcfa(wallet?.today ?? 0)} />
        <StatTile label="Semaine" value={formatFcfa(wallet?.week ?? 0)} />
        <StatTile label="Mois" value={formatFcfa(wallet?.month ?? 0)} />
      </View>

      <FlatList
        data={entriesQuery.data?.items ?? []}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Mouvements récents</Text>}
        ListEmptyComponent={<EmptyState title="Aucun mouvement" subtitle="Vos gains apparaîtront ici." />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{item.label ?? item.type}</Text>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleString('fr-FR')}</Text>
              </View>
              <Text style={[styles.amount, item.amount >= 0 ? styles.positive : styles.negative]}>
                {item.amount >= 0 ? '+' : ''}{formatFcfa(item.amount)}
              </Text>
            </View>
          </Card>
        )}
      />
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: layout.pageGutter, paddingTop: 8 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: layout.pageGutter },
  list: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 10 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  date: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontFamily: fonts.bold, fontSize: 15 },
  positive: { color: colors.emerald700 },
  negative: { color: colors.danger },
})
