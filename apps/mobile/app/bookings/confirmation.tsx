import { useLocalSearchParams, useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { PublicTopBar } from '@/src/components/PublicTopBar'
import { PrimaryButton } from '@/src/components/ui'
import { colors, fonts, layout, spacing } from '@/src/theme'

export default function BookingConfirmationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { status, merchantName } = useLocalSearchParams<{
    bookingId?: string
    status?: string
    merchantName?: string
  }>()

  const paid = status === 'success'
  const pendingPayment = status === 'pending'

  return (
    <PublicScreenShell activeRoute="profile">
      <PublicTopBar />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: layout.bottomNavHeight + insets.bottom + 24 },
        ]}
      >
        <View style={[styles.iconWrap, paid ? styles.iconSuccess : styles.iconPending]}>
          <Ionicons
            name={paid ? 'checkmark-circle' : pendingPayment ? 'time-outline' : 'calendar-outline'}
            size={48}
            color={paid ? colors.emerald700 : colors.brand600}
          />
        </View>

        <Text style={styles.title}>
          {paid
            ? 'Réservation confirmée'
            : pendingPayment
              ? 'Réservation enregistrée'
              : 'Demande envoyée'}
        </Text>

        <Text style={styles.body}>
          {merchantName
            ? `${merchantName} confirmera votre rendez-vous sous peu.`
            : 'L\'établissement confirmera votre rendez-vous sous peu.'}
        </Text>

        {pendingPayment ? (
          <Text style={styles.hint}>
            L&apos;acompte n&apos;a pas encore été payé. Vous pourrez finaliser le paiement depuis votre profil.
          </Text>
        ) : paid ? (
          <Text style={styles.hint}>Votre acompte a été enregistré avec succès.</Text>
        ) : (
          <Text style={styles.hint}>Confirmation par l&apos;établissement — sans débit immédiat.</Text>
        )}

        <PrimaryButton label="Retour à l'accueil" onPress={() => router.replace('/(tabs)')} />
        <PrimaryButton
          label="Voir mon profil"
          onPress={() => router.replace('/(tabs)/profile')}
        />
      </ScrollView>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.gutter, gap: 16, alignItems: 'center' },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  iconSuccess: { backgroundColor: colors.emerald50 },
  iconPending: { backgroundColor: colors.brand50 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
})
