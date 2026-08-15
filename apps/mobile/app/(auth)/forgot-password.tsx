import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { AuthScreenLayout } from '@/src/screens/auth/AuthScreenLayout'
import { authStyles } from '@/src/screens/auth/authShared'
import { PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { colors, fonts } from '@/src/theme'

export default function ForgotPasswordScreen() {
  const router = useRouter()

  return (
    <AuthScreenLayout bottomInset={24}>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={authStyles.screenTitle}>Mot de passe oublié</Text>
      <Text style={authStyles.screenSubtitle}>
        La réinitialisation par e-mail n&apos;est pas encore disponible dans l&apos;app.
      </Text>

      <View style={styles.card}>
        <Ionicons name="chatbubble-ellipses-outline" size={28} color={colors.brand600} />
        <Text style={styles.cardTitle}>Connexion par SMS</Text>
        <Text style={styles.cardBody}>
          Si votre compte est lié à un numéro de téléphone, utilisez le code OTP pour vous
          connecter sans mot de passe.
        </Text>
        <PrimaryButton
          label="Connexion par SMS"
          onPress={() => router.replace('/(auth)/login?method=otp')}
        />
      </View>

      <View style={styles.card}>
        <Ionicons name="key-outline" size={28} color={colors.textMuted} />
        <Text style={styles.cardTitle}>Déjà connecté ?</Text>
        <Text style={styles.cardBody}>
          Modifiez votre mot de passe depuis Profil → Paramètres → Sécurité.
        </Text>
        <SecondaryButton
          label="Aller aux paramètres"
          onPress={() => router.push('/profile/settings')}
        />
      </View>
    </AuthScreenLayout>
  )
}

const styles = StyleSheet.create({
  back: { marginBottom: 8, alignSelf: 'flex-start' },
  card: {
    marginTop: 20,
    padding: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 10,
  },
  cardTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
    marginBottom: 4,
  },
})
