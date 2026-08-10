import { useQuery } from '@tanstack/react-query'
import { formatPrice } from '@laplasse/shared-config'
import type { MenuItemRow } from '@laplasse/api-client'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getApiClient } from '@/src/lib/api'
import { useCartStore } from '@/src/stores/cartStore'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

function MenuItemCard({
  item,
  onAdd,
}: {
  item: MenuItemRow
  onAdd: () => void
}) {
  const hasModifiers = item.modifier_groups.length > 0

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemBody}>
        <Text style={styles.itemName}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
        ) : null}
        <Text style={styles.itemPrice}>{formatPrice(item.price, item.currency)}</Text>
      </View>
      <View style={styles.itemImageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.itemImageFallback]} />
        )}
        <Pressable
          onPress={onAdd}
          style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.85 }]}
          accessibilityLabel={`Ajouter ${item.name}`}
        >
          <Ionicons name="add" size={20} color={colors.brand700} />
        </Pressable>
        {hasModifiers ? (
          <View style={styles.modifierHint}>
            <Text style={styles.modifierHintText}>Options</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export function RestaurationMenuPanel({ merchantSlug }: { merchantSlug: string }) {
  const router = useRouter()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const addMenuItem = useCartStore(s => s.addMenuItem)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)

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

  const handleAdd = async (item: MenuItemRow) => {
    if (item.modifier_groups.length > 0) {
      Alert.alert(
        'Options disponibles',
        'Les personnalisations seront bientôt disponibles dans l’app. Consultez le site pour commander ce plat avec options.',
      )
      return
    }
    if (!isAuthenticated) {
      router.push('/(auth)/login')
      return
    }
    const { error } = await addMenuItem(item.id, 1)
    if (error) Alert.alert('Panier', error)
  }

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
              <MenuItemCard key={item.id} item={item} onAdd={() => void handleAdd(item)} />
            ))}
          </View>
        ))}
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
  itemPrice: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
  },
  itemImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: { width: '100%', height: '100%' },
  itemImageFallback: { backgroundColor: colors.brand50 },
  addBtn: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  modifierHint: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.brand100,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modifierHintText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.brand800,
  },
})
