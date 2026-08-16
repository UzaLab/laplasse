import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { getApiClient } from '@/src/lib/api'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

function StarPicker({
  value,
  onChange,
}: {
  value: number
  onChange: (rating: number) => void
}) {
  return (
    <View style={styles.starPicker}>
      {[1, 2, 3, 4, 5].map(n => (
        <Pressable
          key={n}
          onPress={() => onChange(n)}
          hitSlop={6}
          accessibilityLabel={`${n} étoiles`}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={22}
            color={n <= value ? colors.brand500 : colors.textLight}
          />
        </Pressable>
      ))}
    </View>
  )
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: rating }).map((_, i) => (
        <Ionicons key={i} name="star" size={size} color={colors.brand500} />
      ))}
    </View>
  )
}

export function ProductReviewsSection({
  productSlug,
  shopSlug,
}: {
  productSlug: string
  shopSlug?: string
}) {
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', productSlug, shopSlug, isAuthenticated],
    queryFn: () => getApiClient().getProductReviews(productSlug, shopSlug),
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      getApiClient().createProductReview(
        productSlug,
        { rating, comment: comment.trim() || undefined },
        shopSlug,
      ),
    onSuccess: () => {
      setComment('')
      setRating(5)
      void queryClient.invalidateQueries({ queryKey: ['product-reviews', productSlug, shopSlug] })
      void queryClient.invalidateQueries({ queryKey: ['product-reviews-meta', productSlug, shopSlug] })
      Alert.alert('Merci !', 'Votre avis a été publié.')
    },
    onError: (error: Error) => {
      Alert.alert('Avis', error.message || 'Impossible de publier l\'avis')
    },
  })

  if (reviewsQuery.isLoading) {
    return <ActivityIndicator color={colors.brand500} style={styles.loader} />
  }

  const average = reviewsQuery.data?.average_rating ?? null
  const reviews = reviewsQuery.data?.reviews ?? []
  const viewer = reviewsQuery.data?.viewer

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Avis clients</Text>

      {average != null ? (
        <View style={styles.summaryLine}>
          <Ionicons name="star" size={16} color={colors.brand500} />
          <Text style={styles.summaryText}>
            <Text style={styles.summaryBold}>{average}</Text>
            {' / 5 — '}
            {reviews.length} avis
          </Text>
        </View>
      ) : null}

      {isAuthenticated && viewer?.can_review ? (
        <View style={styles.formCard}>
          <Text style={styles.formLabel}>Votre note</Text>
          <StarPicker value={rating} onChange={setRating} />
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Partagez votre expérience (optionnel)"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            style={styles.textarea}
            textAlignVertical="top"
          />
          <Pressable
            onPress={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            style={({ pressed }) => [
              styles.submitBtn,
              (pressed || submitMutation.isPending) && styles.submitBtnPressed,
            ]}
          >
            <Text style={styles.submitBtnText}>
              {submitMutation.isPending ? 'Envoi…' : 'Publier mon avis'}
            </Text>
          </Pressable>
        </View>
      ) : null}

      {isAuthenticated && viewer && !viewer.can_review ? (
        <Text style={styles.hint}>
          {viewer.already_reviewed
            ? 'Vous avez déjà laissé un avis pour ce produit.'
            : 'Seuls les clients ayant commandé ce produit peuvent laisser un avis.'}
        </Text>
      ) : null}

      {!isAuthenticated ? (
        <Text style={styles.hint}>
          Connectez-vous pour laisser un avis après avoir commandé ce produit.
        </Text>
      ) : null}

      {reviews.length === 0 ? (
        <Text style={styles.empty}>Aucun avis pour le moment.</Text>
      ) : (
        <View style={styles.list}>
          {reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewer}>{review.user.name}</Text>
                <StarRow rating={review.rating} />
              </View>
              {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
  loader: { paddingVertical: 24 },
  title: {
    fontFamily: fonts.extrabold,
    fontSize: 20,
    color: colors.text,
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  summaryBold: {
    fontFamily: fonts.bold,
    color: colors.text,
  },
  formCard: {
    padding: 16,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  formLabel: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
  },
  starPicker: {
    flexDirection: 'row',
    gap: 4,
  },
  starRow: { flexDirection: 'row', gap: 2 },
  textarea: {
    minHeight: 88,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.field,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
  },
  submitBtn: {
    alignSelf: 'flex-start',
    backgroundColor: colors.slate900,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.field,
  },
  submitBtnPressed: { opacity: 0.85 },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  list: { gap: 12 },
  reviewCard: {
    padding: 16,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewer: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  comment: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
})
