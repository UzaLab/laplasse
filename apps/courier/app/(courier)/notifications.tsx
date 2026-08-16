import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { colors, fonts, layout } from '@/src/theme'

export default function CourierNotificationsScreen() {
  return (
    <CourierShell showBack>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CourierPageHeader title="Notifications" subtitle="Alertes et mises à jour" />
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucune notification</Text>
          <Text style={styles.emptyBody}>
            Les alertes de missions, validations KYC et messages ops apparaîtront ici.
          </Text>
        </View>
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 8,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
})
