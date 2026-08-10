import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, radii } from '@/src/theme'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

interface SearchAutocompleteProps {
  placeholder?: string
  initialQuery?: string
  autoFocus?: boolean
  onSubmit?: (q: string) => void
  /** Style barre recherche home ou carte */
  appearance?: 'default' | 'home' | 'map'
  /** Mode contrôlé */
  value?: string
  onValueChange?: (v: string) => void
  /** Suggestions produits uniquement (marketplace) */
  productsOnly?: boolean
}

export function SearchAutocomplete({
  placeholder = 'Établissements, produits, services…',
  initialQuery = '',
  autoFocus = false,
  onSubmit,
  appearance = 'default',
  value,
  onValueChange,
  productsOnly = false,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [internalQuery, setInternalQuery] = useState(initialQuery)
  const query = value ?? internalQuery
  const setQuery = onValueChange ?? setInternalQuery
  const [focused, setFocused] = useState(false)
  const debounced = useDebouncedValue(query.trim(), 180)
  const open = focused && (debounced.length >= 1 || query.length === 0)

  const trendingQuery = useQuery({
    queryKey: ['trending'],
    queryFn: () => getApiClient().getTrendingSearches(6),
    enabled: open && debounced.length < 2 && !productsOnly,
    staleTime: 60_000,
  })

  const suggestQuery = useQuery({
    queryKey: ['autocomplete', debounced, productsOnly],
    queryFn: () =>
      productsOnly
        ? getApiClient().autocompleteProducts(debounced, 8).then(r => ({
            merchants: [],
            products: r.products,
          }))
        : getApiClient().autocompleteUnified(debounced, 8),
    enabled: open && debounced.length >= 2,
  })

  const navigate = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      setFocused(false)
      if (onSubmit) {
        onSubmit(trimmed)
      } else {
        router.push({ pathname: '/(tabs)/search', params: { q: trimmed } })
      }
    },
    [onSubmit, router],
  )

  const loading = suggestQuery.isFetching

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.inputRow,
          appearance === 'home' && styles.inputRowHome,
          appearance === 'map' && styles.inputRowMap,
          focused &&
            (appearance === 'home'
              ? styles.inputRowHomeFocused
              : appearance === 'map'
                ? styles.inputRowMapFocused
                : styles.inputRowFocused),
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={appearance === 'default' ? colors.textMuted : colors.textMuted}
        />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          style={styles.input}
          returnKeyType="search"
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onSubmitEditing={() => navigate(query)}
        />
        {loading ? <ActivityIndicator size="small" color={colors.brand500} /> : null}
      </View>

      {open ? (
        <View style={styles.panel}>
          <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
            {debounced.length < 2 && !productsOnly ? (
              <>
                <Text style={styles.sectionLabel}>Tendances</Text>
                {trendingQuery.isLoading ? (
                  <ActivityIndicator color={colors.brand500} style={styles.loader} />
                ) : (
                  (trendingQuery.data ?? []).map(item => (
                    <Pressable
                      key={item.query}
                      onPress={() => navigate(item.query)}
                      style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                    >
                      <Ionicons name="trending-up" size={16} color={colors.brand600} />
                      <Text style={styles.suggestionText}>{item.query}</Text>
                    </Pressable>
                  ))
                )}
              </>
            ) : (
              <>
                {(suggestQuery.data?.merchants ?? []).length > 0 && !productsOnly ? (
                  <>
                    <Text style={styles.sectionLabel}>Établissements</Text>
                    {suggestQuery.data!.merchants.map(m => (
                      <Pressable
                        key={m.id}
                        onPress={() => router.push(`/m/${m.slug}`)}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionText}>{m.business_name}</Text>
                          <Text style={styles.suggestionMeta}>{m.category_name}</Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {(suggestQuery.data?.products ?? []).length > 0 ? (
                  <>
                    <Text style={styles.sectionLabel}>Produits</Text>
                    {suggestQuery.data!.products.map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => router.push(`/m/${p.merchant.slug}/p/${p.slug}`)}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="bag-outline" size={16} color={colors.textMuted} />
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionText}>{p.name}</Text>
                          <Text style={styles.suggestionMeta}>
                            {formatPrice(p.price, p.currency)} · {p.merchant.business_name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {!loading &&
                (suggestQuery.data?.merchants.length ?? 0) === 0 &&
                (suggestQuery.data?.products.length ?? 0) === 0 ? (
                  <Pressable
                    onPress={() => navigate(debounced)}
                    style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                  >
                    <Ionicons name="search" size={16} color={colors.brand600} />
                    <Text style={styles.suggestionText}>Rechercher « {debounced} »</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', zIndex: 10 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.field,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputRowFocused: {
    borderColor: colors.brand500,
    shadowColor: colors.brand500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  inputRowHome: {
    backgroundColor: colors.surfaceBright,
    borderColor: colors.outlineVariant,
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputRowHomeFocused: {
    borderColor: colors.brand500,
    shadowColor: colors.brand500,
    shadowOpacity: 0.12,
  },
  inputRowMap: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputRowMapFocused: {
    borderColor: colors.brand500,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.text,
    padding: 0,
  },
  panel: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: radii.field,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 320,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionContent: { flex: 1 },
  suggestionText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.text,
  },
  suggestionMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  pressed: { backgroundColor: colors.brand50 },
  loader: { padding: 16 },
})
