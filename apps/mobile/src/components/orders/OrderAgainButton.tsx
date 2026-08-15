import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { Order, OrderStatus } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts } from '@/src/theme'

export function OrderAgainButton({
  order,
  effectiveStatus,
  variant = 'detail',
}: {
  order: Order
  effectiveStatus: OrderStatus
  variant?: 'detail' | 'pill'
}) {
  const router = useRouter()
  const loadCart = useCartStore(s => s.loadCart)
  const [loading, setLoading] = useState(false)

  if (effectiveStatus !== 'COMPLETED') return null
  if (order.status === 'PENDING') return null

  const handleReorder = async () => {
    setLoading(true)
    try {
      const result = await getApiClient().reorderFromOrder(order.id)
      await loadCart()
      if (result.skipped.length) {
        notify.warning(
          'Panier mis à jour',
          `${result.added_count} article${result.added_count > 1 ? 's' : ''} ajouté${result.added_count > 1 ? 's' : ''}. ${result.skipped.length} indisponible${result.skipped.length > 1 ? 's' : ''}.`,
        )
      } else {
        notify.success('Articles ajoutés au panier')
      }
      const isFood = result.cart.kind === 'food'
      router.push(isFood ? '/commande' : '/cart')
    } catch (e) {
      notify.error(e instanceof Error ? e.message : 'Impossible de recommander')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'pill') {
    return (
      <Pressable
        onPress={() => void handleReorder()}
        disabled={loading}
        style={[styles.pill, loading && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.brand800} />
        ) : (
          <Text style={styles.pillText}>Recommander</Text>
        )}
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={() => void handleReorder()}
      disabled={loading}
      style={[styles.detailBtn, loading && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <>
          <Ionicons name="refresh-outline" size={16} color={colors.text} />
          <Text style={styles.detailText}>Commander à nouveau</Text>
        </>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.brand200,
    backgroundColor: colors.brand50,
  },
  pillText: { fontFamily: fonts.bold, fontSize: 12, color: colors.brand800 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  detailText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  disabled: { opacity: 0.6 },
})
