import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import { formatPrice } from '@laplasse/shared-config'
import { FieldInput, PrimaryButton, Screen, Subtitle, Title } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors } from '@/src/theme'

export default function CheckoutScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const cart = useCartStore(s => s.cart)
  const clear = useCartStore(s => s.clear)
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [address, setAddress] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit() {
    if (!phone.trim()) {
      Alert.alert('Commande', 'Le téléphone est obligatoire')
      return
    }
    setLoading(true)
    try {
      const result = await getApiClient().checkout({
        customer_phone: phone.trim(),
        delivery_type: address.trim() ? 'DELIVERY' : 'PICKUP',
        delivery_address: address.trim() || undefined,
        customer_note: note.trim() || undefined,
      })
      await clear()
      Alert.alert(
        'Commande confirmée',
        `${result.instructions}\nRéf. ${result.reference}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/orders') }],
      )
    } catch (err) {
      Alert.alert('Commande', err instanceof Error ? err.message : 'Échec du checkout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Screen>
      <Title>Commande</Title>
      <Subtitle>
        {cart ? `Total estimé · ${formatPrice(cart.subtotal, cart.currency)}` : 'Panier'}
      </Subtitle>
      <FieldInput placeholder="Téléphone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <FieldInput placeholder="Adresse de livraison (optionnel)" value={address} onChangeText={setAddress} />
      <FieldInput placeholder="Note pour le commerçant" value={note} onChangeText={setNote} multiline />
      <Text style={styles.hint}>P0 : paiement à la livraison / confirmation commerçant selon la boutique.</Text>
      <PrimaryButton label="Confirmer la commande" onPress={() => void onSubmit()} loading={loading} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: 12, lineHeight: 18 },
})
