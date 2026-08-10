import { Pressable, ScrollView, StyleSheet, Text } from 'react-native'
import type { ProductCategoryNode } from '@laplasse/api-client'
import { colors, fonts } from '@/src/theme'

export function MarketplaceCategoryCarousel({
  categories,
  selectedSlug,
  onSelect,
  allLabel = 'Toutes',
}: {
  categories: ProductCategoryNode[]
  selectedSlug: string
  onSelect: (slug: string) => void
  allLabel?: string
}) {
  if (categories.length === 0) return null

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.track}
    >
      <Pressable
        onPress={() => onSelect('')}
        style={[styles.chip, !selectedSlug && styles.chipActive]}
      >
        <Text style={[styles.chipText, !selectedSlug && styles.chipTextActive]}>{allLabel}</Text>
      </Pressable>
      {categories.map(cat => {
        const active = selectedSlug === cat.slug
        return (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(active ? '' : cat.slug)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  track: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.slate900,
    borderColor: colors.slate900,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
})
