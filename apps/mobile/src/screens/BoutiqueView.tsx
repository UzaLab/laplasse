import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
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
import type { ApiMerchantDetail, ApiShopPublic, MarketplaceCatalogProduct, MarketplaceProduct } from '@laplasse/api-client'
import { MarketplaceProductGridCard } from '@/src/components/MarketplaceProductGridCard'
import { PublicScreenShell } from '@/src/components/PublicScreenShell'
import { LoadingState } from '@/src/components/ui'
import { useDebouncedValue } from '@/src/hooks/useDebouncedValue'
import { getApiClient } from '@/src/lib/api'
import { resolveBoutique } from '@/src/lib/boutiqueResolve'
import { computePriceCeiling, flattenProductCategories } from '@/src/lib/marketplace'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout, layout } from '@/src/theme'

interface BoutiqueDisplayData {
  name: string
  slug: string
  logo?: string | null
  cover_image?: string | null
  phone?: string | null
  whatsapp?: string | null
  location?: { city?: string | null; district?: string | null } | null
  establishment_slug?: string | null
}

function merchantToDisplay(m: ApiMerchantDetail): BoutiqueDisplayData {
  return {
    name: m.business_name,
    slug: m.slug,
    logo: m.logo,
    cover_image: m.cover_image,
    phone: m.phone,
    whatsapp: m.whatsapp,
    location: m.location,
    establishment_slug: m.slug,
  }
}

function shopToDisplay(s: ApiShopPublic): BoutiqueDisplayData {
  return {
    name: s.name,
    slug: s.slug,
    logo: s.logo,
    cover_image: s.cover_image,
    phone: s.phone,
    whatsapp: s.whatsapp,
    location: s.city ? { city: s.city, district: s.district } : null,
    establishment_slug:
      s.merchant_id && s.merchant?.is_active !== false && s.merchant?.slug
        ? s.merchant.slug
        : null,
  }
}

type SortOption = 'recommended' | 'newest' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommandés' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price_asc', label: 'Prix ↑' },
  { value: 'price_desc', label: 'Prix ↓' },
]

function sortProducts(products: MarketplaceProduct[], sort: SortOption): MarketplaceProduct[] {
  const copy = [...products]
  switch (sort) {
    case 'price_asc': return copy.sort((a, b) => a.price - b.price)
    case 'price_desc': return copy.sort((a, b) => b.price - a.price)
    case 'newest': return copy.reverse()
    default: return copy
  }
}

export function BoutiqueView({ slug }: { slug: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim(), 300)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCollection, setSelectedCollection] = useState('')
  const [sort, setSort] = useState<SortOption>('recommended')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [priceFilter, setPriceFilter] = useState(100_000)

  // Scroll-direction FAB visibility
  const scrollY = useRef(0)
  const fabVisible = useRef(true)
  const fabOpacity = useRef(new Animated.Value(1)).current

  const showFab = useCallback(() => {
    if (fabVisible.current) return
    fabVisible.current = true
    Animated.spring(fabOpacity, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }).start()
  }, [fabOpacity])

  const hideFab = useCallback(() => {
    if (!fabVisible.current) return
    fabVisible.current = false
    Animated.spring(fabOpacity, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start()
  }, [fabOpacity])

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const newY = e.nativeEvent.contentOffset.y
    const delta = newY - scrollY.current
    if (newY < 80) showFab()
    else if (delta > 10) hideFab()
    else if (delta < -10) showFab()
    scrollY.current = newY
  }, [showFab, hideFab])

  // Resolve merchant or shop by slug
  const resolveQuery = useQuery({
    queryKey: ['boutique-resolve', slug],
    queryFn: async () => {
      const resolved = await resolveBoutique(slug)
      if (!resolved) throw new Error('not found')
      return resolved
    },
  })

  const shopSlug = resolveQuery.data?.shopSlug ?? slug
  const merchantSlug = resolveQuery.data?.merchant?.slug

  const categoriesQuery = useQuery({
    queryKey: ['shop-categories', shopSlug],
    queryFn: () => getApiClient().getShopProductCategories(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const collectionsQuery = useQuery({
    queryKey: ['shop-collections', shopSlug],
    queryFn: () => getApiClient().getShopCollections(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const trustQuery = useQuery({
    queryKey: ['shop-trust', shopSlug],
    queryFn: () => getApiClient().getShopTrustScore(shopSlug),
    enabled: !!resolveQuery.data,
  })

  const productsQuery = useQuery({
    queryKey: ['shop-products', shopSlug, merchantSlug, debouncedSearch, selectedCategory, selectedCollection],
    queryFn: async () => {
      const api = getApiClient()
      try {
        const products = await api.getShopProducts(shopSlug, {
          q: debouncedSearch || undefined,
          category: selectedCategory || undefined,
          collection: selectedCollection || undefined,
        })
        if (products.length > 0 || !merchantSlug) return products
      } catch {
        // Fall back to merchant products endpoint
      }
      if (merchantSlug) {
        const res = await api.getMerchantProducts(merchantSlug, 100, 0)
        let list = res.data
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase()
          list = list.filter(p => p.name.toLowerCase().includes(q))
        }
        return list
      }
      return []
    },
    enabled: !!resolveQuery.data,
  })

  const merchant: BoutiqueDisplayData | undefined = resolveQuery.data
    ? resolveQuery.data.merchant
      ? merchantToDisplay(resolveQuery.data.merchant)
      : shopToDisplay(resolveQuery.data.shop!)
    : undefined
  const products: MarketplaceProduct[] = productsQuery.data ?? []
  const collections = collectionsQuery.data ?? []

  const priceCeiling = useMemo(
    () => computePriceCeiling(products.map(p => p.price)),
    [products],
  )

  const filtered = useMemo<MarketplaceProduct[]>(() => {
    const list = products.filter(p => p.price <= priceFilter)
    return sortProducts(list, sort)
  }, [products, priceFilter, sort])

  const flatCategories = flattenProductCategories(
    (categoriesQuery.data ?? []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      sort_order: c.sort_order ?? 0,
      children: [],
    })),
  )

  const activeFilterCount = [
    search.trim(),
    selectedCategory,
    selectedCollection,
    priceFilter < priceCeiling ? 'price' : '',
  ].filter(Boolean).length

  const resetFilters = () => {
    setSearch('')
    setSelectedCategory('')
    setSelectedCollection('')
    setPriceFilter(priceCeiling)
  }

  if (resolveQuery.isLoading) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <LoadingState />
      </PublicScreenShell>
    )
  }

  if (resolveQuery.isError || !merchant) {
    return (
      <PublicScreenShell activeRoute="marketplace">
        <View style={styles.notFound}>
          <Ionicons name="storefront-outline" size={48} color={colors.brand200} />
          <Text style={styles.notFoundText}>Boutique introuvable</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>← Retour</Text>
          </Pressable>
        </View>
      </PublicScreenShell>
    )
  }

  const locationLabel = [merchant.location?.district, merchant.location?.city]
    .filter(Boolean)
    .join(', ')
  const contactPhone = merchant.whatsapp ?? merchant.phone
  const trust = trustQuery.data

  return (
    <PublicScreenShell activeRoute="marketplace">
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: layout.bottomNavInset + 80 }]}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* ─── Hero ─── */}
          <View style={styles.hero}>
            {merchant.cover_image ? (
              <Image source={{ uri: merchant.cover_image }} style={styles.cover} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]} />
            )}
            <View style={styles.heroOverlay} />
            <Pressable
              onPress={() => router.back()}
              style={[styles.backBtn, { top: insets.top + 8 }]}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </Pressable>
            <View style={styles.heroContent}>
              <View style={styles.logoWrap}>
                {merchant.logo ? (
                  <Image source={{ uri: merchant.logo }} style={styles.logo} />
                ) : (
                  <View style={[styles.logo, styles.logoFallback]}>
                    <Ionicons name="storefront" size={28} color={colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.heroText}>
                <View style={styles.officialBadge}>
                  <Ionicons name="storefront" size={12} color="#fff" />
                  <Text style={styles.officialBadgeText}>Boutique Officielle</Text>
                </View>
                <Text style={styles.shopName}>{merchant.name}</Text>
                {locationLabel ? (
                  <Text style={styles.location}>
                    {'  '}{locationLabel}
                  </Text>
                ) : null}
                {trust && trust.badge && trust.badge !== 'new' ? (
                  <View style={[
                    styles.trustBadge,
                    trust.badge === 'trusted' ? styles.trustBadgeTrusted : styles.trustBadgeGood,
                  ]}>
                    <Ionicons
                      name={trust.badge === 'trusted' ? 'checkmark-circle' : 'shield-outline'}
                      size={12}
                      color={trust.badge === 'trusted' ? colors.emerald700 : colors.brand700}
                    />
                    <Text style={[
                      styles.trustText,
                      trust.badge === 'trusted' ? styles.trustTextTrusted : styles.trustTextGood,
                    ]}>
                      {trust.label}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* ─── Back to establishment ─── */}
          {merchant.establishment_slug ? (
            <Pressable
              onPress={() => router.push(`/m/${merchant.establishment_slug}`)}
              style={styles.establishmentLink}
            >
              <Ionicons name="arrow-back" size={16} color={colors.textMuted} />
              <Text style={styles.establishmentLinkText}>Voir l&apos;établissement</Text>
            </Pressable>
          ) : null}

          {/* ─── Search ─── */}
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Nom du produit…"
              placeholderTextColor={colors.textLight}
              style={styles.searchInput}
            />
            {search ? (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color={colors.textLight} />
              </Pressable>
            ) : null}
          </View>

          {/* ─── Collection chips ─── */}
          {collections.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsTrack}
            >
              <Pressable
                onPress={() => setSelectedCollection('')}
                style={[styles.chip, !selectedCollection && styles.chipActive]}
              >
                <Text style={[styles.chipText, !selectedCollection && styles.chipTextActive]}>
                  Toutes
                </Text>
              </Pressable>
              {collections.map(col => {
                const active = selectedCollection === col.slug
                return (
                  <Pressable
                    key={col.id}
                    onPress={() => setSelectedCollection(active ? '' : col.slug)}
                    style={[styles.chip, active && styles.chipBrand]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextBrand]}>
                      {col.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : null}

          {/* ─── Sort strip (like PWA) ─── */}
          <View style={styles.sortStrip}>
            <Text style={styles.sortLabel}>
              <Text style={styles.sortCount}>{filtered.length}</Text> produit{filtered.length > 1 ? 's' : ''}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
              {SORT_OPTIONS.map(opt => (
                <Pressable
                  key={opt.value}
                  onPress={() => setSort(opt.value)}
                  style={[styles.sortChip, sort === opt.value && styles.sortChipActive]}
                >
                  <Text style={[styles.sortChipText, sort === opt.value && styles.sortChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* ─── Product grid ─── */}
          {productsQuery.isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.brand500} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="bag-outline" size={40} color={colors.brand200} />
              <Text style={styles.empty}>Aucun produit ne correspond à vos filtres.</Text>
              {activeFilterCount > 0 ? (
                <Pressable onPress={resetFilters} style={styles.resetBtn}>
                  <Text style={styles.resetBtnText}>Réinitialiser les filtres</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.grid}>
              {filtered.map(product => (
                <View key={product.id} style={styles.gridCell}>
                  <MarketplaceProductGridCard
                    product={product as unknown as MarketplaceCatalogProduct}
                    onPress={() => router.push(`/m/${merchantSlug ?? merchant.slug}/p/${product.slug}`)}
                  />
                </View>
              ))}
            </View>
          )}

          {/* ─── Contact block ─── */}
          <View style={styles.contactBlock}>
            <Ionicons name="headset-outline" size={32} color={colors.brand500} />
            <Text style={styles.contactTitle}>Une question ?</Text>
            <Text style={styles.contactBody}>
              Contactez directement la boutique pour toute demande spécifique.
            </Text>
            {contactPhone ? (
              <Pressable
                style={styles.contactBtn}
                onPress={() =>
                  merchant.whatsapp
                    ? openWhatsApp(contactPhone, `Bonjour ${merchant.name},`)
                    : void Linking.openURL(`tel:${contactPhone}`)
                }
              >
                <Text style={styles.contactBtnText}>Contacter le vendeur</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>

        {/* ─── Scroll-aware Filter FAB ─── */}
        <Animated.View
          style={[
            styles.fabWrap,
            {
              bottom: layout.bottomNavInset + 12,
              opacity: fabOpacity,
              transform: [{ translateY: fabOpacity.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
            },
          ]}
          pointerEvents={fabVisible.current ? 'auto' : 'none'}
        >
          <Pressable onPress={() => setFiltersOpen(true)} style={styles.fab}>
            <Ionicons name="options-outline" size={18} color="#fff" />
            <Text style={styles.fabText}>Filtres</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.fabBadge}>
                <Text style={styles.fabBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </Animated.View>

        {/* ─── Filter modal ─── */}
        <Modal
          visible={filtersOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setFiltersOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setFiltersOpen(false)} />
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 8 }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Ionicons name="options-outline" size={18} color={colors.brand500} />
                {'  '}Filtres
              </Text>
              <Pressable onPress={() => setFiltersOpen(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Scrollable body */}
            <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>

              {/* Sort */}
              <Text style={styles.sectionLabel}>Trier par</Text>
              <View style={styles.listBox}>
                {SORT_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSort(opt.value)}
                    style={styles.radioRow}
                  >
                    <View style={[styles.radio, sort === opt.value && styles.radioSelected]} />
                    <Text style={styles.radioLabel}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Categories */}
              {flatCategories.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>Catégories</Text>
                  <ScrollView
                    style={styles.categoryScroll}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator
                  >
                    <Pressable onPress={() => setSelectedCategory('')} style={styles.radioRow}>
                      <View style={[styles.radio, !selectedCategory && styles.radioSelected]} />
                      <Text style={styles.radioLabel}>Toutes</Text>
                    </Pressable>
                    {flatCategories.map(cat => (
                      <Pressable
                        key={cat.slug}
                        onPress={() => setSelectedCategory(cat.slug)}
                        style={[styles.radioRow, { paddingLeft: cat.depth * 12 }]}
                      >
                        <View style={[styles.radio, selectedCategory === cat.slug && styles.radioSelected]} />
                        <Text style={styles.radioLabel}>{cat.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              ) : null}

              {/* Price */}
              <Text style={styles.sectionLabel}>Prix maximum</Text>
              <Text style={styles.priceLabel}>
                Jusqu&apos;à {Math.min(priceFilter, priceCeiling).toLocaleString('fr-FR')} F
              </Text>
              <View style={styles.sliderRow}>
                {[0.25, 0.5, 0.75, 1].map(ratio => {
                  const v = Math.round(priceCeiling * ratio)
                  const active = Math.abs(priceFilter - v) < 100
                  return (
                    <Pressable
                      key={ratio}
                      onPress={() => setPriceFilter(v)}
                      style={[styles.sliderChip, active && styles.sliderChipActive]}
                    >
                      <Text style={[styles.sliderChipText, active && styles.sliderChipTextActive]}>
                        {Math.round(ratio * 100)}%
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              {activeFilterCount > 0 ? (
                <Pressable onPress={resetFilters} style={styles.resetCircle}>
                  <Ionicons name="refresh-outline" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
              <Pressable
                onPress={() => setFiltersOpen(false)}
                style={styles.applyBtn}
              >
                <Text style={styles.applyBtnText}>
                  Voir {filtered.length} produit{filtered.length > 1 ? 's' : ''}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </PublicScreenShell>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: 0 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  notFoundText: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text },
  backLink: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // Hero
  hero: { height: 280, position: 'relative', backgroundColor: colors.slate900 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.slate900 },
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.55)' },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroContent: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'flex-end', gap: 16,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 16,
    backgroundColor: '#fff', padding: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 6,
  },
  logo: { width: '100%', height: '100%', borderRadius: 14 },
  logoFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerLow },
  heroText: { flex: 1 },
  officialBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: colors.brand500,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 6,
  },
  officialBadgeText: {
    fontFamily: fonts.bold, fontSize: 10, color: '#fff',
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  shopName: { fontFamily: fonts.extrabold, fontSize: 22, color: '#fff' },
  location: { fontFamily: fonts.medium, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  trustBadgeTrusted: { backgroundColor: colors.emerald50, borderWidth: 1, borderColor: '#a7f3d0' },
  trustBadgeGood: { backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand200 },
  trustText: { fontFamily: fonts.bold, fontSize: 11 },
  trustTextTrusted: { color: colors.emerald700 },
  trustTextGood: { color: colors.brand700 },

  // Establishment link
  establishmentLink: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  establishmentLinkText: { fontFamily: fonts.bold, fontSize: 14, color: colors.textMuted },

  // Search
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong,
    borderRadius: homeLayout.radiusLg, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.text, padding: 0 },

  // Collections
  collectionsTrack: { paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  chipBrand: { backgroundColor: colors.brand500, borderColor: colors.brand500 },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  chipTextBrand: { color: '#fff' },

  // Sort strip
  sortStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.border, gap: 12, marginBottom: 12,
  },
  sortLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted, flexShrink: 0 },
  sortCount: { fontFamily: fonts.bold, color: colors.text },
  sortChips: { gap: 6 },
  sortChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.background,
  },
  sortChipActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  sortChipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  sortChipTextActive: { color: colors.brand700 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 16 },
  gridCell: { width: '47%' },
  emptyWrap: { alignItems: 'center', padding: 32, gap: 12 },
  empty: { fontFamily: fonts.medium, fontSize: 15, color: colors.textMuted, textAlign: 'center' },
  resetBtn: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand200,
  },
  resetBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // Contact
  contactBlock: {
    margin: 16, marginTop: 24, padding: 20,
    borderRadius: homeLayout.radiusXl,
    backgroundColor: colors.brand50, borderWidth: 1, borderColor: colors.brand100,
    alignItems: 'center', gap: 8,
  },
  contactTitle: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  contactBody: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  contactBtn: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.brand200,
  },
  contactBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },

  // FAB
  fabWrap: { position: 'absolute', left: 24, right: 24 },
  fab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.slate900, paddingVertical: 14, borderRadius: 999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16,
    elevation: 8,
  },
  fabText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
  fabBadge: {
    minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.brand500,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  fabBadgeText: { fontFamily: fonts.bold, fontSize: 11, color: '#fff' },

  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  modalSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    maxHeight: '85%', backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.text },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
  },
  modalBody: { padding: 20, gap: 12 },
  sectionLabel: {
    fontFamily: fonts.bold, fontSize: 11, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8,
  },
  listBox: {
    backgroundColor: colors.surfaceContainerLow, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 8,
  },
  categoryScroll: { maxHeight: 200, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 8 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.borderStrong },
  radioSelected: { borderColor: colors.brand500, backgroundColor: colors.brand500 },
  radioLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.text },
  priceLabel: { fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  sliderRow: { flexDirection: 'row', gap: 8 },
  sliderChip: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderStrong,
    alignItems: 'center', backgroundColor: colors.background,
  },
  sliderChipActive: { backgroundColor: colors.brand50, borderColor: colors.brand500 },
  sliderChipText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.textMuted },
  sliderChipTextActive: { color: colors.brand700 },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderTopWidth: 1, borderTopColor: colors.border, padding: 16,
  },
  resetCircle: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1, borderColor: colors.borderStrong,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  applyBtn: {
    flex: 1, backgroundColor: colors.slate900, borderRadius: 999,
    paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { fontFamily: fonts.extrabold, fontSize: 14, color: '#fff' },
})
