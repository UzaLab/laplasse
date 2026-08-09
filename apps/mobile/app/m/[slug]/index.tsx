import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { FlatList, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { FavoriteButton } from '@/src/components/FavoriteButton'
import { ProductCard } from '@/src/components/ProductCard'
import { LoadingState, PrimaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, layout, spacing } from '@/src/theme'

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function formatHours(hours: Array<{ day: number; open_time: string | null; close_time: string | null; is_closed: boolean }>) {
  return hours
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(h => {
      if (h.is_closed) return `${DAY_LABELS[h.day] ?? h.day} · Fermé`
      return `${DAY_LABELS[h.day] ?? h.day} · ${h.open_time ?? '?'} – ${h.close_time ?? '?'}`
    })
}

export default function MerchantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router = useRouter()

  const merchantQuery = useQuery({
    queryKey: ['merchant', slug],
    queryFn: () => getApiClient().getMerchant(String(slug)),
    enabled: !!slug,
  })

  const productsQuery = useQuery({
    queryKey: ['merchant-products', slug],
    queryFn: () => getApiClient().getMerchantProducts(String(slug)),
    enabled: !!slug,
  })

  if (merchantQuery.isLoading) return <LoadingState />

  const merchant = merchantQuery.data
  if (!merchant) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Boutique introuvable</Text>
      </View>
    )
  }

  const products = productsQuery.data?.data ?? []
  const contactPhone = merchant.whatsapp ?? merchant.phone
  const hoursLines = merchant.hours?.length ? formatHours(merchant.hours) : []

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {merchant.cover_image ? (
            <Image source={{ uri: merchant.cover_image }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverFallback]} />
          )}
          <View style={styles.heroOverlay} />
          <View style={styles.heroActions}>
            <FavoriteButton merchantId={merchant.id} size={24} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{merchant.business_name}</Text>
          <Text style={styles.category}>{merchant.category.name}</Text>

          {merchant.avg_rating != null ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color={colors.brand500} />
              <Text style={styles.rating}>{merchant.avg_rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({merchant.review_count} avis)</Text>
            </View>
          ) : null}

          {merchant.location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              <Text style={styles.infoText}>
                {[merchant.location.address, merchant.location.district, merchant.location.city]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          ) : null}

          {merchant.description ? (
            <Text style={styles.desc}>{merchant.description}</Text>
          ) : null}

          {hoursLines.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Horaires</Text>
              {hoursLines.map(line => (
                <Text key={line} style={styles.hourLine}>{line}</Text>
              ))}
            </View>
          ) : null}

          {merchant.reviews.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Avis récents</Text>
              {merchant.reviews.slice(0, 3).map(review => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <Text style={styles.reviewAuthor}>
                      {review.user.full_name ?? 'Client'}
                    </Text>
                    <Text style={styles.reviewRating}>★ {review.rating}</Text>
                  </View>
                  {review.content ? (
                    <Text style={styles.reviewContent} numberOfLines={3}>{review.content}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Produits</Text>
            {products.length > 0 ? (
              products.map(item => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onPress={() => router.push(`/m/${slug}/p/${item.slug}`)}
                />
              ))
            ) : (
              <Text style={styles.empty}>Aucun produit disponible</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        {contactPhone ? (
          <Pressable
            style={styles.whatsappBtn}
            onPress={() =>
              openWhatsApp(contactPhone, `Bonjour ${merchant.business_name}, je vous contacte via LaPlasse.`)
            }
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </Pressable>
        ) : null}
        {merchant.phone ? (
          <Pressable
            style={styles.callBtn}
            onPress={() => void Linking.openURL(`tel:${merchant.phone}`)}
          >
            <Ionicons name="call-outline" size={20} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Panier" onPress={() => router.push('/cart')} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: layout.bottomNavInset + 80 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFound: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  hero: { position: 'relative', height: 200 },
  cover: { width: '100%', height: '100%' },
  coverFallback: { backgroundColor: colors.border },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  heroActions: { position: 'absolute', top: 12, right: 12 },
  body: { padding: spacing.gutter, marginTop: -20 },
  name: { fontFamily: fonts.extrabold, fontSize: 24, color: colors.text },
  category: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  rating: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  reviewCount: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  infoRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  desc: { fontFamily: fonts.regular, fontSize: 15, color: colors.text, lineHeight: 22, marginTop: 16 },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, marginBottom: 12 },
  hourLine: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginBottom: 4 },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  reviewAuthor: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  reviewRating: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand700 },
  reviewContent: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  empty: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    paddingBottom: layout.bottomNavInset > 64 ? layout.bottomNavInset - 48 : 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  whatsappText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  callBtn: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
})
