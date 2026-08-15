import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  getMarketplaceAddBlockReason,
  showCartBlockedAlert,
} from '@/src/lib/cartKind'
import { findProductCartLine } from '@/src/lib/productCart'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts } from '@/src/theme'

export function ProductCardAddControl({
  productId,
  variantId,
  needsVariant,
  onNeedsVariant,
}: {
  productId: string
  variantId?: string | null
  needsVariant?: boolean
  onNeedsVariant?: () => void
}) {
  const cart = useCartStore(s => s.cart)
  const addItem = useCartStore(s => s.addItem)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const clear = useCartStore(s => s.clear)
  const updatingItemId = useCartStore(s => s.updatingItemId)
  const [adding, setAdding] = useState(false)

  const line = findProductCartLine(cart, productId, variantId)
  const qty = line?.quantity ?? 0
  const busy = adding || (line != null && updatingItemId === line.id)

  function stopCardPress(event?: GestureResponderEvent) {
    event?.stopPropagation?.()
  }

  async function handleAdd(event?: GestureResponderEvent) {
    stopCardPress(event)
    if (needsVariant) {
      onNeedsVariant?.()
      return
    }

    const blocked = getMarketplaceAddBlockReason(cart)
    if (blocked) {
      showCartBlockedAlert(blocked, () => void clear())
      return
    }

    setAdding(true)
    try {
      if (line && qty > 0) {
        await updateQuantity(line.id, qty + 1)
        return
      }
      const result = await addItem(productId, 1, variantId ?? undefined)
      if (result.error) Alert.alert('Panier', result.error)
    } finally {
      setAdding(false)
    }
  }

  async function handleRemove(event?: GestureResponderEvent) {
    stopCardPress(event)
    if (!line) return
    setAdding(true)
    try {
      await updateQuantity(line.id, qty - 1)
    } finally {
      setAdding(false)
    }
  }

  if (needsVariant) {
    return (
      <Pressable
        onPress={event => void handleAdd(event)}
        style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
        hitSlop={8}
        accessibilityLabel="Choisir une variante"
      >
        <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
      </Pressable>
    )
  }

  if (qty > 0) {
    return (
      <View style={styles.stepper}>
        <Pressable
          onPress={event => void handleRemove(event)}
          disabled={busy}
          style={({ pressed }) => [styles.stepperBtn, pressed && styles.pressed]}
          accessibilityLabel="Retirer du panier"
        >
          <Ionicons name="remove" size={14} color={colors.onBackground} />
        </Pressable>
        {busy ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.stepperLoader} />
        ) : (
          <Text style={styles.stepperQty}>{qty}</Text>
        )}
        <Pressable
          onPress={event => void handleAdd(event)}
          disabled={busy}
          style={({ pressed }) => [styles.stepperBtn, styles.stepperBtnPrimary, pressed && styles.pressed]}
          accessibilityLabel="Ajouter au panier"
        >
          <Ionicons name="add" size={14} color={colors.onPrimaryContainer} />
        </Pressable>
      </View>
    )
  }

  return (
    <Pressable
      onPress={event => void handleAdd(event)}
      disabled={busy}
      style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
      hitSlop={8}
      accessibilityLabel="Ajouter au panier"
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.onPrimaryContainer} />
      ) : (
        <Ionicons name="add" size={20} color={colors.onPrimaryContainer} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 88,
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceBright,
  },
  stepperBtnPrimary: {
    backgroundColor: colors.primary,
  },
  stepperQty: {
    minWidth: 20,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.onPrimaryContainer,
  },
  stepperLoader: {
    minWidth: 20,
  },
  pressed: { opacity: 0.85 },
})
