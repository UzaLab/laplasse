import { useState } from 'react'
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import type {
  MarketplaceBoutique,
  ProductCategoryNode,
  ProductCondition,
  ProductOrigin,
} from '@laplasse/api-client'
import {
  flattenProductCategories,
  PRODUCT_CONDITION_LABELS,
  PRODUCT_ORIGIN_LABELS,
} from '@/src/lib/marketplace'
import { ScrollArea } from '@/src/components/ScrollArea'
import { colors, fonts, homeLayout } from '@/src/theme'

export type MarketplaceSort = 'newest' | 'price_asc' | 'price_desc'

export interface MarketplaceFilterState {
  sort: MarketplaceSort
  selectedCategory: string
  selectedCondition: ProductCondition | ''
  selectedOrigin: ProductOrigin | ''
  selectedMerchants: string[]
  priceFilter: number
}

const SORT_OPTIONS: { value: MarketplaceSort; label: string }[] = [
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
]

function RadioRow({
  label,
  selected,
  onPress,
  indent = 0,
}: {
  label: string
  selected: boolean
  onPress: () => void
  indent?: number
}) {
  return (
    <Pressable onPress={onPress} style={[styles.radioRow, { paddingLeft: indent }]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  )
}

function CheckRow({
  label,
  checked,
  onPress,
}: {
  label: string
  checked: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <View style={[styles.check, checked && styles.checkSelected]}>
        {checked ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  )
}

export function MarketplaceFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
  categories,
  merchants,
  priceCeiling,
  showSort = true,
  onReset,
  resultCount,
}: {
  open: boolean
  onClose: () => void
  filters: MarketplaceFilterState
  onChange: (filters: MarketplaceFilterState) => void
  categories: ProductCategoryNode[]
  merchants: MarketplaceBoutique[]
  priceCeiling: number
  showSort?: boolean
  onReset: () => void
  resultCount: number
}) {
  const insets = useSafeAreaInsets()
  const flatCategories = flattenProductCategories(categories)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [merchantQuery, setMerchantQuery] = useState('')
  const sheetHeight = Dimensions.get('window').height * 0.85

  const filteredCategories = categoryQuery.trim()
    ? flatCategories.filter(c => c.name.toLowerCase().includes(categoryQuery.trim().toLowerCase()))
    : flatCategories

  const filteredMerchants = merchantQuery.trim()
    ? merchants.filter(m => m.business_name.toLowerCase().includes(merchantQuery.trim().toLowerCase()))
    : merchants

  const toggleMerchant = (slug: string) => {
    const has = filters.selectedMerchants.includes(slug)
    onChange({
      ...filters,
      selectedMerchants: has
        ? filters.selectedMerchants.filter(s => s !== slug)
        : [...filters.selectedMerchants, slug],
    })
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { height: sheetHeight, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filtres</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollBody}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {showSort ? (
            <>
              <Text style={styles.sectionLabel}>Tri</Text>
              <View style={styles.pillRow}>
                {SORT_OPTIONS.map(opt => {
                  const active = filters.sort === opt.value
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => onChange({ ...filters, sort: opt.value })}
                      style={[styles.pill, active && styles.pillActive]}
                    >
                      <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          ) : null}

          {flatCategories.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Catégories</Text>
              <TextInput
                value={categoryQuery}
                onChangeText={setCategoryQuery}
                placeholder="Rechercher une catégorie…"
                placeholderTextColor={colors.textLight}
                style={styles.searchInput}
              />
              <ScrollArea>
                <RadioRow
                  label="Toutes les catégories"
                  selected={!filters.selectedCategory}
                  onPress={() => onChange({ ...filters, selectedCategory: '' })}
                />
                {filteredCategories.length === 0 ? (
                  <Text style={styles.emptyList}>Aucun résultat</Text>
                ) : (
                  filteredCategories.map(cat => (
                    <RadioRow
                      key={cat.slug}
                      label={cat.name}
                      selected={filters.selectedCategory === cat.slug}
                      onPress={() => onChange({ ...filters, selectedCategory: cat.slug })}
                      indent={cat.depth * 12}
                    />
                  ))
                )}
              </ScrollArea>
            </>
          ) : null}

          {merchants.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>Boutiques</Text>
              <TextInput
                value={merchantQuery}
                onChangeText={setMerchantQuery}
                placeholder="Rechercher une boutique…"
                placeholderTextColor={colors.textLight}
                style={styles.searchInput}
              />
              <ScrollArea>
                {filteredMerchants.length === 0 ? (
                  <Text style={styles.emptyList}>Aucun résultat</Text>
                ) : (
                  filteredMerchants.map(m => (
                    <CheckRow
                      key={m.id}
                      label={m.business_name}
                      checked={filters.selectedMerchants.includes(m.slug)}
                      onPress={() => toggleMerchant(m.slug)}
                    />
                  ))
                )}
              </ScrollArea>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>État du produit</Text>
          <RadioRow
            label="Tous les états"
            selected={!filters.selectedCondition}
            onPress={() => onChange({ ...filters, selectedCondition: '' })}
          />
          {(Object.keys(PRODUCT_CONDITION_LABELS) as ProductCondition[]).map(key => (
            <RadioRow
              key={key}
              label={PRODUCT_CONDITION_LABELS[key]}
              selected={filters.selectedCondition === key}
              onPress={() => onChange({ ...filters, selectedCondition: key })}
            />
          ))}

          <Text style={styles.sectionLabel}>Origine</Text>
          <RadioRow
            label="Toutes origines"
            selected={!filters.selectedOrigin}
            onPress={() => onChange({ ...filters, selectedOrigin: '' })}
          />
          {(Object.keys(PRODUCT_ORIGIN_LABELS) as ProductOrigin[]).map(key => (
            <RadioRow
              key={key}
              label={PRODUCT_ORIGIN_LABELS[key]}
              selected={filters.selectedOrigin === key}
              onPress={() => onChange({ ...filters, selectedOrigin: key })}
            />
          ))}

          <Text style={styles.sectionLabel}>Prix maximum</Text>
          <Text style={styles.priceValue}>
            {filters.priceFilter >= priceCeiling
              ? 'Tout'
              : `Jusqu'à ${filters.priceFilter.toLocaleString('fr-FR')} F`}
          </Text>
          <View style={styles.sliderRow}>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
              const value = Math.round(priceCeiling * ratio)
              const active = filters.priceFilter === value || (ratio === 1 && filters.priceFilter >= priceCeiling)
              return (
                <Pressable
                  key={ratio}
                  onPress={() => onChange({ ...filters, priceFilter: ratio === 1 ? priceCeiling : value })}
                  style={[styles.sliderChip, active && styles.sliderChipActive]}
                >
                  <Text style={[styles.sliderChipText, active && styles.sliderChipTextActive]}>
                    {ratio === 0 ? '0' : ratio === 1 ? 'Max' : `${Math.round(ratio * 100)}%`}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable onPress={onReset} style={styles.resetBtn}>
            <Ionicons name="refresh" size={20} color={colors.textMuted} />
          </Pressable>
          <Pressable onPress={onClose} style={styles.applyBtn}>
            <Text style={styles.applyText}>
              Voir {resultCount} produit{resultCount > 1 ? 's' : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: homeLayout.radiusXl,
    borderTopRightRadius: homeLayout.radiusXl,
    flexDirection: 'column',
  },
  scrollBody: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 18,
    color: colors.text,
  },
  content: {
    padding: 20,
    gap: 8,
    paddingBottom: 32,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 4,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.slate900,
    borderColor: colors.slate900,
  },
  pillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  pillTextActive: { color: '#fff' },
  searchInput: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.brand500, backgroundColor: colors.brand500 },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { borderColor: colors.brand500, backgroundColor: colors.brand500 },
  radioLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, flex: 1 },
  priceValue: { fontFamily: fonts.bold, fontSize: 14, color: colors.text, marginBottom: 8 },
  sliderRow: { flexDirection: 'row', gap: 8 },
  sliderChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  sliderChipActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  sliderChipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  sliderChipTextActive: { color: colors.brand700 },
  emptyList: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtn: {
    flex: 1,
    backgroundColor: colors.slate900,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
})
