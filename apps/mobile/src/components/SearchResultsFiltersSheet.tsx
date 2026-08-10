import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, homeLayout } from '@/src/theme'

export interface SearchResultsFilters {
  categories: string[]
  sort: 'trust_score' | 'created_at'
}

const SORT_OPTIONS: { value: SearchResultsFilters['sort']; label: string }[] = [
  { value: 'trust_score', label: 'Mieux noté' },
  { value: 'created_at', label: 'Plus récents' },
]

export function SearchResultsFiltersSheet({
  open,
  onClose,
  filters,
  onChange,
}: {
  open: boolean
  onClose: () => void
  filters: SearchResultsFilters
  onChange: (filters: SearchResultsFilters) => void
}) {
  const insets = useSafeAreaInsets()
  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: () => getApiClient().getCategories(),
    enabled: open,
  })

  const toggleCategory = (slug: string) => {
    const has = filters.categories.includes(slug)
    onChange({
      ...filters,
      categories: has
        ? filters.categories.filter(c => c !== slug)
        : [...filters.categories, slug],
    })
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filtres</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>
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

          <Text style={styles.sectionLabel}>Catégories</Text>
          <View style={styles.pillRow}>
            {(categoriesQuery.data ?? []).map(cat => {
              const active = filters.categories.includes(cat.slug)
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.slug)}
                  style={[styles.pill, active && styles.pillActive]}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{cat.name}</Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Pressable
            onPress={() => onChange({ categories: [], sort: 'trust_score' })}
            style={styles.resetBtn}
          >
            <Text style={styles.resetText}>Réinitialiser</Text>
          </Pressable>
          <Pressable onPress={onClose} style={styles.applyBtn}>
            <Text style={styles.applyText}>Appliquer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: homeLayout.gutter,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.text,
  },
  content: {
    padding: homeLayout.gutter,
    gap: 12,
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
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
  pillText: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.textMuted,
  },
  pillTextActive: { color: '#fff' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: homeLayout.gutter,
    paddingTop: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  resetText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.textMuted,
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.brand600,
  },
  applyText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
})
