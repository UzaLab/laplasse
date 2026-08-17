import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { PrimaryButton } from '@/src/components/ui'
import { type CourierStatus } from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout } from '@/src/theme'

export default function CourierOnboardingScreen() {
  const router = useRouter()
  const profile = useAuthStore(s => s.user?.courier_profile)
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus

  const steps = [
    { done: true, title: 'Candidature envoyée', body: 'Votre profil livreur a été créé avec succès.' },
    {
      done: status === 'ACTIVE',
      title: 'Validation ops',
      body: status === 'ACTIVE'
        ? 'Votre compte est actif — vous pouvez passer en ligne.'
        : 'Notre équipe vérifie votre dossier (identité, véhicule).',
    },
    { done: false, title: 'Zones de service', body: 'Sélectionnez les communes où vous acceptez des courses.' },
    { done: false, title: 'Première mission', body: 'Recevez et acceptez votre première livraison.' },
  ]

  return (
    <CourierShell showBack>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CourierPageHeader
          title="Prochaines étapes"
          subtitle="Suivez votre parcours pour commencer à livrer avec LaPlasse."
        />

        {steps.map((step, i) => (
          <View key={step.title} style={styles.stepCard}>
            <Text style={styles.stepIndex}>{i + 1}.</Text>
            <View style={styles.stepCopy}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepBody}>{step.body}</Text>
            </View>
          </View>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Carte Google Maps</Text>
          <Text style={styles.infoBody}>
            Le suivi GPS et le choix des zones utilisent Google Maps. OpenStreetMap reste disponible en secours si la carte ne charge pas.
          </Text>
        </View>

        <PrimaryButton label="Accéder au tableau de bord" onPress={() => router.replace('/(courier)')} />
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 12 },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  stepIndex: { fontFamily: fonts.bold, fontSize: 16, color: colors.emerald600 },
  stepCopy: { flex: 1, gap: 4 },
  stepTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  stepBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  infoCard: {
    backgroundColor: colors.slate900,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    marginTop: 8,
  },
  infoTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#fff' },
  infoBody: { fontFamily: fonts.regular, fontSize: 14, color: '#94a3b8', lineHeight: 20 },
})
