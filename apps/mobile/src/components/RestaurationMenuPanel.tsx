import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '@laplasse/shared-config'
import type { MenuItemRow } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { MenuItemModifierSheet } from '@/src/components/MenuItemModifierSheet'
import { AppImage } from '@/src/components/ui/AppImage'
import { getApiClient } from '@/src/lib/api'
import {
  findSimpleMenuCartLine,
  getMenuItemModifierQty,
  getSimpleMenuItemQty,
} from '@/src/lib/menuCart'
import { getFoodAddBlockReason, showCartBlockedAlert } from '@/src/lib/cartKind'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { useCartStore } from '@/src/stores/cartStore'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

function MenuItemCard({
  item,
  quantity,
  modifierQty,
  adding,
  onAdd,
  onRemove,
  onCustomize,
}: {
  item: MenuItemRow
  quantity: number
  modifierQty: number
  adding: boolean
  onAdd: () => void
  onRemove: () => void
  onCustomize: () => void
}) {
  const hasModifiers = item.modifier_groups.length > 0

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemBody}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>{formatPrice(item.price, item.currency)}</Text>
          {hasModifiers && modifierQty > 0 ? (
            <Text style={styles.inCartHint}>{modifierQty} au panier</Text>
          ) : null}
          {!hasModifiers && quantity > 0 ? (
            <Text style={styles.inCartHint}>{quantity} au panier</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.itemImageWrap}>
        <AppImage uri={item.image_url} style={styles.itemImage} fallbackLetter={item.name.slice(0, 1)} />
        <View style={styles.addControls}>
          {hasModifiers ? (
            <Pressable
              onPress={onCustomize}
              style={({ pressed }) => [
                styles.addBtn,
                styles.addBtnPrimary,
                modifierQty > 0 && styles.addBtnInCart,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityLabel={`Personnaliser ${item.name}`}
            >
              {adding ? (
                <ActivityIndicator size="small" color={modifierQty > 0 ? colors.brand700 : '#fff'} />
              ) : modifierQty > 0 ? (
                <Ionicons name="checkmark" size={16} color={colors.brand700} />
              ) : (
                <Ionicons name="options-outline" size={14} color="#fff" />
              )}
            </Pressable>
          ) : quantity > 0 ? (
            <View style={styles.stepper}>
              <Pressable
                onPress={onRemove}
                disabled={adding}
                style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.85 }]}
                accessibilityLabel={`Retirer ${item.name}`}
              >
                <Ionicons name="remove" size={14} color={colors.text} />
              </Pressable>
              {adding ? (
                <ActivityIndicator size="small" color={colors.brand600} style={styles.stepperLoader} />
              ) : (
                <Text style={styles.stepperQty}>{quantity}</Text>
              )}
              <Pressable
                onPress={onAdd}
                disabled={adding}
                style={({ pressed }) => [
                  styles.stepperBtn,
                  styles.stepperBtnPrimary,
                  pressed && { opacity: 0.9 },
                ]}
                accessibilityLabel={`Ajouter ${item.name}`}
              >
                <Ionicons name="add" size={14} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={onAdd}
              disabled={adding}
              style={({ pressed }) => [
                styles.addBtn,
                styles.addBtnPrimary,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityLabel={`Ajouter ${item.name}`}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="add" size={16} color="#fff" />
              )}
            </Pressable>
          )}
        </View>
      </View>
    </View>
  )
}

export function RestaurationMenuPanel({ merchantSlug }: { merchantSlug: string }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const cart = useCartStore(s => s.cart)
  const loadCart = useCartStore(s => s.loadCart)
  const addMenuItem = useCartStore(s => s.addMenuItem)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const clear = useCartStore(s => s.clear)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [sheetItem, setSheetItem] = useState<MenuItemRow | null>(null)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const [sheetSubmitting, setSheetSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) void loadCart()
  }, [isAuthenticated, loadCart])

  const menuQuery = useQuery({
    queryKey: ['merchant-menu', merchantSlug],
    queryFn: () => getApiClient().getMerchantMenu(merchantSlug),
  })

  const sections = useMemo(() => {
    const menu = menuQuery.data
    if (!menu) return []
    const list = menu.sections.filter(s => s.items.length > 0)
    if (menu.uncategorized.length > 0) {
      list.push({
        id: '__other__',
        name: 'Autres',
        sort_order: 999,
        items: menu.uncategorized,
      })
    }
    return list
  }, [menuQuery.data])

  const requireAuth = useCallback(() => {
    notify.info('Connexion requise', 'Connectez-vous pour ajouter des plats au panier.')
    router.push('/(auth)/login')
    return false
  }, [router])

  const ensureCanAddFood = useCallback(() => {
    const blocked = getFoodAddBlockReason(cart)
    if (!blocked) return true
    showCartBlockedAlert(blocked, () => void clear())
    return false
  }, [cart, clear])

  const handleAddSimple = useCallback(
    async (item: MenuItemRow) => {
      if (!isAuthenticated) {
        requireAuth()
        return
      }
      if (!ensureCanAddFood()) return
      setBusyItemId(item.id)
      try {
        const line = findSimpleMenuCartLine(cart, item.id)
        if (line && line.quantity > 0) {
          await updateQuantity(line.id, line.quantity + 1)
        } else {
          const { error } = await addMenuItem(item.id, 1)
          if (error) {
            notify.error('Panier', error)
            return
          }
        }
      } finally {
        setBusyItemId(null)
      }
    },
    [isAuthenticated, cart, addMenuItem, updateQuantity, requireAuth, ensureCanAddFood],
  )

  const handleRemoveSimple = useCallback(
    async (item: MenuItemRow) => {
      const line = findSimpleMenuCartLine(cart, item.id)
      if (!line) return
      setBusyItemId(item.id)
      try {
        await updateQuantity(line.id, line.quantity - 1)
      } finally {
        setBusyItemId(null)
      }
    },
    [cart, updateQuantity],
  )

  const handleConfirmModifiers = useCallback(
    async (quantity: number, optionIds: string[]) => {
      if (!sheetItem) return
      if (!isAuthenticated) {
        requireAuth()
        return
      }
      if (!ensureCanAddFood()) return
      setSheetSubmitting(true)
      try {
        const { error } = await addMenuItem(sheetItem.id, quantity, optionIds)
        if (error) {
          notify.error('Panier', error)
          return
        }
        setSheetItem(null)
      } finally {
        setSheetSubmitting(false)
      }
    },
    [sheetItem, isAuthenticated, addMenuItem, requireAuth, ensureCanAddFood],
  )

  if (menuQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand600} />
      </View>
    )
  }

  if (!menuQuery.data || sections.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Menu indisponible pour le moment.</Text>
      </View>
    )
  }

  const currentSection = activeSectionId ?? sections[0]?.id ?? null

  return (
    <View style={styles.root}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {sections.map(section => {
          const active = section.id === currentSection
          return (
            <Pressable
              key={section.id}
              onPress={() => setActiveSectionId(section.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{section.name}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {sections
        .filter(s => s.id === currentSection)
        .map(section => (
          <View key={section.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <View style={styles.sectionLine} />
            </View>
            {section.items.map(item => (
              <MenuItemCard
                key={item.id}
                item={item}
                quantity={getSimpleMenuItemQty(cart, item.id)}
                modifierQty={getMenuItemModifierQty(cart, item.id)}
                adding={busyItemId === item.id}
                onAdd={() => void handleAddSimple(item)}
                onRemove={() => void handleRemoveSimple(item)}
                onCustomize={() => {
                  if (!isAuthenticated) {
                    requireAuth()
                    return
                  }
                  setSheetItem(item)
                }}
              />
            ))}
          </View>
        ))}

      <MenuItemModifierSheet
        item={sheetItem}
        open={sheetItem != null}
        onClose={() => setSheetItem(null)}
        onConfirm={handleConfirmModifiers}
        submitting={sheetSubmitting}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  loading: { paddingVertical: 40, alignItems: 'center' },
  empty: { paddingVertical: 32, alignItems: 'center' },
  emptyText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabs: {
    gap: 8,
    paddingBottom: 4,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.brand600,
    borderColor: colors.brand600,
  },
  tabText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.textMuted,
  },
  tabTextActive: { color: '#fff' },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.brand700,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderStrong,
  },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: 14,
  },
  itemBody: { flex: 1, justifyContent: 'space-between' },
  itemName: {
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    marginBottom: 4,
  },
  itemDesc: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
  },
  inCartHint: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.emerald700,
  },
  itemImageWrap: {
    width: 88,
    height: 88,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.surfaceContainer,
  },
  itemImage: { width: '100%', height: '100%' },
  addControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnPrimary: {
    backgroundColor: colors.brand600,
  },
  addBtnInCart: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.brand500,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
  },
  stepperBtnPrimary: {
    backgroundColor: colors.brand600,
  },
  stepperQty: {
    minWidth: 18,
    textAlign: 'center',
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text,
  },
  stepperLoader: {
    minWidth: 18,
  },
})
