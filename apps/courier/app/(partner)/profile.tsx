import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { AppShell } from '@/src/components/AppShell'
import { Card, PrimaryButton } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout } from '@/src/theme'

export default function PartnerProfileScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const partner = user?.logistics_partner
  const logout = useAuthStore(s => s.logout)

  return (
    <AppShell title="Entreprise" subtitle={partner?.slug ?? ''}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={styles.name}>{partner?.legal_name ?? 'Partenaire'}</Text>
          {partner?.trade_name ? <Text style={styles.meta}>{partner.trade_name}</Text> : null}
          <Text style={styles.meta}>{partner?.city ?? '—'} · {partner?.phone ?? '—'}</Text>
          <Text style={styles.meta}>
            {partner?._count?.couriers ?? 0} livreurs · {partner?._count?.contracts ?? 0} contrats
          </Text>
          <Text style={styles.badge}>{partner?.verification ?? '—'}</Text>
        </Card>

        <PrimaryButton label="Se déconnecter" variant="slate" onPress={() => void logout().then(() => router.replace('/(auth)/login'))} />
      </ScrollView>
    </AppShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  name: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 6 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#e0f2fe',
    color: colors.partnerAccent,
    fontFamily: fonts.semibold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
})
