import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import {
  ProfileBadge,
  ProfileCard,
  ProfileFilterTabs,
  ProfilePageTitle,
} from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { getApiClient } from '@/src/lib/api'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

type Filter = 'all' | 'APPROVED' | 'PENDING' | 'REJECTED'

const STATUS_LABELS: Record<string, string> = {
  APPROVED: 'Publié',
  PENDING: 'En attente',
  REJECTED: 'Rejeté',
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger'> = {
  APPROVED: 'success',
  PENDING: 'warning',
  REJECTED: 'danger',
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons
          key={n}
          name={n <= rating ? 'star' : 'star-outline'}
          size={14}
          color={n <= rating ? profileTheme.navIconActive : profileTheme.border}
        />
      ))}
    </View>
  )
}

export default function ProfileReviewsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')

  const reviewsQuery = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => getApiClient().getMyReviews(),
  })

  const filtered = useMemo(() => {
    const all = reviewsQuery.data ?? []
    if (filter === 'all') return all
    return all.filter(r => r.status === filter)
  }, [reviewsQuery.data, filter])

  const stats = useMemo(() => {
    const all = reviewsQuery.data ?? []
    const approved = all.filter(r => r.status === 'APPROVED')
    const avg =
      approved.length > 0
        ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
        : null
    return {
      total: all.length,
      approved: approved.length,
      pending: all.filter(r => r.status === 'PENDING').length,
      avg,
    }
  }, [reviewsQuery.data])

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Mes avis"
        subtitle="Retrouvez les avis que vous avez laissés sur LaPlasse."
      />

      <Pressable
        onPress={() => router.push('/profile/reviews/write' as never)}
        style={styles.writeBtn}
      >
        <Text style={styles.writeBtnText}>+ Nouvel avis (depuis une fiche établissement)</Text>
      </Pressable>

      <View style={styles.statsGrid}>
        {[
          { label: 'Total', value: stats.total },
          { label: 'Publiés', value: stats.approved },
          { label: 'En attente', value: stats.pending },
          { label: 'Note moy.', value: stats.avg != null ? stats.avg.toFixed(1) : '—' },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <ProfileCard>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </ProfileCard>
          </View>
        ))}
      </View>

      <ProfileFilterTabs
        tabs={[
          { id: 'all' as const, label: 'Tous' },
          { id: 'APPROVED' as const, label: 'Publiés' },
          { id: 'PENDING' as const, label: 'En attente' },
          { id: 'REJECTED' as const, label: 'Rejetés' },
        ]}
        active={filter}
        onChange={setFilter}
      />

      {reviewsQuery.isLoading ? (
        <ActivityIndicator color={profileTheme.accent} style={{ marginTop: 24 }} />
      ) : filtered.length === 0 ? (
        <ProfileCard>
          <Text style={styles.empty}>Aucun avis pour ce filtre.</Text>
        </ProfileCard>
      ) : (
        filtered.map(review => (
          <Pressable
            key={review.id}
            onPress={() => router.push(`/m/${review.merchant.slug}` as never)}
          >
            <ProfileCard>
              <View style={styles.reviewTop}>
                <View style={styles.reviewLeft}>
                  <Text style={styles.merchant}>{review.merchant.business_name}</Text>
                  <StarRow rating={review.rating} />
                </View>
                <ProfileBadge
                  label={STATUS_LABELS[review.status] ?? review.status}
                  tone={STATUS_TONE[review.status] ?? 'neutral'}
                />
              </View>
              {review.title ? <Text style={styles.title}>{review.title}</Text> : null}
              {review.content ? (
                <Text style={styles.content} numberOfLines={3}>{review.content}</Text>
              ) : null}
              <Text style={styles.date}>
                {new Date(review.created_at).toLocaleDateString('fr-FR')}
              </Text>
            </ProfileCard>
          </Pressable>
        ))
      )}
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  writeBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: profileTheme.accentLight,
    borderWidth: 1,
    borderColor: profileTheme.accent,
  },
  writeBtnText: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 13,
    color: profileTheme.accent,
  },
  statCard: { width: '47%', flexGrow: 1 },
  statValue: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 22,
    color: profileTheme.text,
  },
  statLabel: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 12,
    color: profileTheme.textMuted,
  },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  empty: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  reviewLeft: { flex: 1 },
  merchant: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.text },
  title: { fontFamily: profileTheme.fonts.bold, fontSize: 14, color: profileTheme.text, marginTop: 8 },
  content: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    lineHeight: 20,
    marginTop: 4,
  },
  date: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 12,
    color: profileTheme.textLight,
    marginTop: 8,
  },
})
