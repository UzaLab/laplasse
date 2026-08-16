import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PrimaryButton } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts } from '@/src/theme'

export default function PartnerOnboardingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const partner = useAuthStore(s => s.user?.logistics_partner)
  const step = partner?.onboarding_step ?? 1

  return (
    <View style={[styles.root, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Compte partenaire créé</Text>
      <Text style={styles.step}>Étape {step}/4</Text>
      <Text style={styles.body}>
        Finalisez la configuration de votre flotte et de vos zones depuis le portail web si nécessaire.
        Vous pouvez déjà consulter le dispatch et la flotte depuis l'app.
      </Text>
      <PrimaryButton label="Accéder au tableau de bord" variant="partner" onPress={() => router.replace('/(partner)')} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, justifyContent: 'center', gap: 12 },
  title: { fontFamily: fonts.extrabold, fontSize: 28, color: colors.text },
  step: { fontFamily: fonts.bold, fontSize: 16, color: colors.partnerAccent },
  body: { fontFamily: fonts.regular, fontSize: 16, color: colors.textMuted, lineHeight: 24, marginBottom: 8 },
})
