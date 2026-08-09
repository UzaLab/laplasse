import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts } from '@/src/theme'

export default function PaymentScreen() {
  const router = useRouter()
  const { paymentId, orderId } = useLocalSearchParams<{ paymentId: string; orderId: string }>()
  const [loading, setLoading] = useState(false)

  async function confirm(method: 'success' | 'failure') {
    if (!paymentId) return
    setLoading(true)
    try {
      const result = await getApiClient().confirmOrderPayment(String(paymentId), method)
      if (result.status === 'SUCCESS') {
        Alert.alert('Paiement confirmé', result.message, [
          {
            text: 'Voir la commande',
            onPress: () =>
              router.replace((orderId ? `/orders/${orderId}` : '/(tabs)/orders') as never),
          },
        ])
      } else {
        Alert.alert('Paiement refusé', result.message)
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Paiement impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <View style={styles.iconWrap}>
        <Ionicons name="phone-portrait-outline" size={40} color={colors.brand600} />
      </View>
      <Title>Paiement Mobile Money</Title>
      <Subtitle>
        Simulez le paiement Wave / Orange Money / MTN. En production, vous serez redirigé vers votre opérateur.
      </Subtitle>

      <View style={styles.methods}>
        {['Wave', 'Orange Money', 'MTN MoMo'].map(label => (
          <View key={label} style={styles.methodRow}>
            <Ionicons name="wallet-outline" size={20} color={colors.textMuted} />
            <Text style={styles.methodText}>{label}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton
        label="Confirmer le paiement"
        onPress={() => void confirm('success')}
        loading={loading}
      />
      <Text style={styles.hint}>
        Préprod : le simulateur confirme instantanément le paiement côté API.
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.brand100,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  methods: { marginVertical: 20, gap: 10 },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 12, textAlign: 'center' },
})
