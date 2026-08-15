import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import type { ProductSuggestion } from '@laplasse/api-client'
import { formatPrice } from '@laplasse/shared-config'
import { HighlightText } from '@/src/components/HighlightText'
import { getApiClient } from '@/src/lib/api'
import { isFoodCategorySlug } from '@/src/lib/merchantVertical'
import { colors, fonts, radii } from '@/src/theme'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const AUTOCOMPLETE_LIMIT = 3
const AUTOCOMPLETE_DEBOUNCE_MS = 280

function uniqueShopsFromProducts(products: ProductSuggestion[]) {
  const map = new Map<string, { name: string; slug: string }>()
  for (const product of products) {
    const slug = product.merchant.slug
    if (!slug || map.has(slug)) continue
    map.set(slug, { name: product.merchant.business_name, slug })
  }
  return Array.from(map.values()).slice(0, AUTOCOMPLETE_LIMIT)
}

interface SearchAutocompleteProps {
  placeholder?: string
  initialQuery?: string
  autoFocus?: boolean
  onSubmit?: (q: string) => void
  /** Style barre recherche home, carte ou plein écran */
  appearance?: 'default' | 'home' | 'map' | 'fullscreen'
  value?: string
  onValueChange?: (v: string) => void
  productsOnly?: boolean
  menusOnly?: boolean
}

export function SearchAutocomplete({
  placeholder = 'Établissements, plats, boutiques, produits…',
  initialQuery = '',
  autoFocus = false,
  onSubmit,
  appearance = 'default',
  value,
  onValueChange,
  productsOnly = false,
  menusOnly = false,
}: SearchAutocompleteProps) {
  const router = useRouter()
  const [internalQuery, setInternalQuery] = useState(initialQuery)
  const query = value ?? internalQuery
  const setQuery = onValueChange ?? setInternalQuery
  const [focused, setFocused] = useState(autoFocus)
  const debounced = useDebouncedValue(query.trim(), AUTOCOMPLETE_DEBOUNCE_MS)
  const isFullscreen = appearance === 'fullscreen'
  const open = focused && (debounced.length >= 1 || query.length === 0 || isFullscreen)

  const trendingQuery = useQuery({
    queryKey: ['trending'],
    queryFn: () => getApiClient().getTrendingSearches(6),
    enabled: open && debounced.length < 2 && !productsOnly && !menusOnly,
    staleTime: 60_000,
  })

  const suggestQuery = useQuery({
    queryKey: ['autocomplete', debounced, productsOnly, menusOnly],
    queryFn: async () => {
      if (productsOnly) {
        const result = await getApiClient().autocompleteProducts(debounced, AUTOCOMPLETE_LIMIT)
        return { merchants: [], products: result.products.slice(0, AUTOCOMPLETE_LIMIT), menus: [] }
      }
      if (menusOnly) {
        const menus = await getApiClient().autocompleteMenus(debounced, AUTOCOMPLETE_LIMIT)
        return { merchants: [], products: [], menus: menus.slice(0, AUTOCOMPLETE_LIMIT) }
      }
      return getApiClient().autocompleteUnified(debounced, AUTOCOMPLETE_LIMIT)
    },
    enabled: open && debounced.length >= 2,
    staleTime: 30_000,
    gcTime: 120_000,
  })

  const shops = useMemo(
    () => uniqueShopsFromProducts(suggestQuery.data?.products ?? []),
    [suggestQuery.data?.products],
  )

  const navigate = useCallback(
    (q: string) => {
      const trimmed = q.trim()
      if (!trimmed) return
      setFocused(false)
      if (onSubmit) {
        onSubmit(trimmed)
      }
      router.push({ pathname: '/(tabs)/search', params: { q: trimmed } })
    },
    [onSubmit, router],
  )

  const loading = suggestQuery.isFetching

  const inputRowStyle = [
    styles.inputRow,
    appearance === 'home' && styles.inputRowHome,
    appearance === 'map' && styles.inputRowMap,
    appearance === 'fullscreen' && styles.inputRowFullscreen,
    focused &&
      (appearance === 'home'
        ? styles.inputRowHomeFocused
        : appearance === 'map'
          ? styles.inputRowMapFocused
          : appearance === 'fullscreen'
            ? styles.inputRowFullscreenFocused
            : styles.inputRowFocused),
  ]

  const panelStyle = [
    styles.panel,
    isFullscreen && styles.panelFullscreen,
  ]

  return (
    <View style={[styles.wrap, isFullscreen && styles.wrapFullscreen]}>
      <View style={inputRowStyle}>
        <Ionicons name="search" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          style={styles.input}
          returnKeyType="search"
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            if (!isFullscreen) setTimeout(() => setFocused(false), 150)
          }}
          onSubmitEditing={() => navigate(query)}
        />
        {loading ? <ActivityIndicator size="small" color={colors.brand500} /> : null}
      </View>

      {open ? (
        <View style={panelStyle}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={isFullscreen ? styles.panelScrollFullscreen : undefined}
          >
            {debounced.length < 2 && !productsOnly && !menusOnly ? (
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
                {(suggestQuery.data?.merchants ?? []).length > 0 && !productsOnly && !menusOnly ? (
                  <>
                    <Text style={styles.sectionLabel}>Établissements</Text>
                    {suggestQuery.data!.merchants.slice(0, AUTOCOMPLETE_LIMIT).map(m => (
                      <Pressable
                        key={m.id}
                        onPress={() => {
                          setFocused(false)
                          router.push(
                            isFoodCategorySlug(m.category_slug ?? '')
                              ? `/restauration/${m.slug}`
                              : `/m/${m.slug}`,
                          )
                        }}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="storefront-outline" size={16} color={colors.textMuted} />
                        <View style={styles.suggestionContent}>
                          <HighlightText
                            html={m._highlight}
                            fallback={m.business_name}
                            style={styles.suggestionText}
                          />
                          <Text style={styles.suggestionMeta}>
                            {[m.category_name, m.district].filter(Boolean).join(' · ')}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {shops.length > 0 && !productsOnly && !menusOnly ? (
                  <>
                    <Text style={styles.sectionLabel}>Boutiques</Text>
                    {shops.map(shop => (
                      <Pressable
                        key={shop.slug}
                        onPress={() => {
                          setFocused(false)
                          router.push(`/m/${shop.slug}/boutique`)
                        }}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="bag-handle-outline" size={16} color={colors.textMuted} />
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionText}>{shop.name}</Text>
                          <Text style={styles.suggestionMeta}>Boutique marketplace</Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {(suggestQuery.data?.menus ?? []).length > 0 && !productsOnly ? (
                  <>
                    <Text style={styles.sectionLabel}>Plats & menus</Text>
                    {suggestQuery.data!.menus.slice(0, AUTOCOMPLETE_LIMIT).map(item => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setFocused(false)
                          router.push(`/restauration/${item.merchant.slug}`)
                        }}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="restaurant-outline" size={16} color="#ea580c" />
                        <View style={styles.suggestionContent}>
                          <HighlightText
                            html={item._highlight}
                            fallback={item.name}
                            style={styles.suggestionText}
                          />
                          <Text style={styles.suggestionMeta}>
                            {formatPrice(item.price, item.currency)} · {item.merchant.business_name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {(suggestQuery.data?.products ?? []).length > 0 && !menusOnly ? (
                  <>
                    <Text style={styles.sectionLabel}>Produits</Text>
                    {suggestQuery.data!.products.slice(0, AUTOCOMPLETE_LIMIT).map(p => (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          setFocused(false)
                          router.push(`/m/${p.merchant.slug}/p/${p.slug}`)
                        }}
                        style={({ pressed }) => [styles.suggestionRow, pressed && styles.pressed]}
                      >
                        <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
                        <View style={styles.suggestionContent}>
                          <HighlightText
                            html={p._highlight}
                            fallback={p.name}
                            style={styles.suggestionText}
                          />
                          <Text style={styles.suggestionMeta}>
                            {formatPrice(p.price, p.currency)} · {p.merchant.business_name}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </>
                ) : null}

                {!loading &&
                (suggestQuery.data?.merchants?.length ?? 0) === 0 &&
                (suggestQuery.data?.products?.length ?? 0) === 0 &&
                (suggestQuery.data?.menus?.length ?? 0) === 0 ? (
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
  wrapFullscreen: { flex: 1, zIndex: 1 },
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
  inputRowMapFocused: { borderColor: colors.brand500 },
  inputRowFullscreen: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderColor: colors.borderStrong,
  },
  inputRowFullscreenFocused: {
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
  panelFullscreen: {
    marginTop: 12,
    flex: 1,
    maxHeight: undefined,
    borderRadius: 20,
  },
  panelScrollFullscreen: { flex: 1 },
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
