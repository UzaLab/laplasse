import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ProfileBadge, ProfileCard, ProfilePageTitle } from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { getApiClient } from '@/src/lib/api'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

const TIER_CONFIG: Record<string, { label: string; colors: [string, string] }> = {
  EXPLORER: { label: 'Explorateur', colors: ['#94a3b8', '#475569'] },
  LOCAL: { label: 'Local', colors: ['#34d399', '#0d9488'] },
  INSIDER: { label: 'Insider', colors: ['#fbbf24', '#ea580c'] },
  AMBASSADOR: { label: 'Ambassadeur', colors: ['#8b5cf6', '#6d28d9'] },
}

const REASON_LABELS: Record<string, string> = {
  review: 'Avis déposé',
  favorite: 'Établissement mis en favori',
  share: 'Partage',
  signup_merchant: 'Inscription marchand',
  referral_invite: 'Parrainage',
  daily_visit: 'Visite quotidienne',
}

export default function ProfileLoyaltyScreen() {
  const router = useRouter()

  const loyaltyQuery = useQuery({
    queryKey: ['loyalty-account'],
    queryFn: () => getApiClient().getLoyaltyAccount(),
  })

  const data = loyaltyQuery.data
  const tier = data?.account.tier ?? 'EXPLORER'
  const cfg = TIER_CONFIG[tier] ?? TIER_CONFIG.EXPLORER
  const points = data?.account.points ?? 0
  const pointsToNext = data?.pointsToNext
  const tiers = data?.tiers ?? []
  const activeIndex = tiers.findIndex(t => t.active)
  const nextTier = tiers[activeIndex + 1]
  const currentMin = tiers[activeIndex]?.min ?? 0
  const progress = nextTier
    ? Math.min(100, ((points - currentMin) / (nextTier.min - currentMin)) * 100)
    : 100

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Mes points"
        subtitle="Gagnez des points et débloquez des statuts exclusifs."
      />

      {loyaltyQuery.isLoading ? (
        <ActivityIndicator color={profileTheme.accent} />
      ) : (
        <>
          <View style={[styles.hero, { backgroundColor: cfg.colors[1] }]}>
            <View style={[styles.heroGlow, { backgroundColor: cfg.colors[0] }]} />
            <ProfileBadge label="LaPlasse Club" tone="neutral" />
            <Text style={styles.heroTier}>{cfg.label}</Text>
            <Text style={styles.heroPoints}>{points.toLocaleString('fr-FR')}</Text>
            <Text style={styles.heroPtsLabel}>points disponibles</Text>
            {pointsToNext != null && nextTier ? (
              <Text style={styles.heroNext}>
                {pointsToNext} pts avant {nextTier.label}
              </Text>
            ) : null}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Niveaux</Text>
          {tiers.map(t => (
            <ProfileCard key={t.key}>
              <View style={styles.tierRow}>
                <Text style={[styles.tierName, t.active && styles.tierNameActive]}>
                  {t.label}
                </Text>
                <Text style={styles.tierMin}>{t.min} pts</Text>
                {t.active ? (
                  <Ionicons name="checkmark-circle" size={18} color={profileTheme.success} />
                ) : null}
              </View>
            </ProfileCard>
          ))}

          <Text style={styles.sectionTitle}>Historique</Text>
          {(data?.transactions ?? []).length === 0 ? (
            <ProfileCard>
              <Text style={styles.empty}>Aucune transaction pour le moment.</Text>
            </ProfileCard>
          ) : (
            (data?.transactions ?? []).map(tx => (
              <ProfileCard key={tx.id}>
                <View style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <Text style={styles.txReason}>
                      {REASON_LABELS[tx.reason] ?? tx.reason}
                    </Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <Text style={[styles.txPoints, tx.points >= 0 ? styles.txPlus : styles.txMinus]}>
                    {tx.points >= 0 ? '+' : ''}{tx.points} pts
                  </Text>
                </View>
              </ProfileCard>
            ))
          )}

          <Pressable
            style={styles.backLink}
            onPress={() => router.push('/profile' as never)}
          >
            <Ionicons name="arrow-back" size={16} color={profileTheme.textMuted} />
            <Text style={styles.backLinkText}>Retour au profil</Text>
          </Pressable>
        </>
      )}
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: profileTheme.cardRadius,
    padding: 24,
    overflow: 'hidden',
    gap: 6,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
  },
  heroTier: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
  },
  heroPoints: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 40,
    color: '#fff',
  },
  heroPtsLabel: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  heroNext: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 18,
    color: profileTheme.text,
    marginTop: 8,
  },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tierName: { flex: 1, fontFamily: profileTheme.fonts.semibold, fontSize: 15, color: profileTheme.textMuted },
  tierNameActive: { color: profileTheme.text, fontFamily: profileTheme.fonts.bold },
  tierMin: { fontFamily: profileTheme.fonts.medium, fontSize: 13, color: profileTheme.textLight },
  empty: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
  },
  txRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txLeft: { flex: 1 },
  txReason: { fontFamily: profileTheme.fonts.semibold, fontSize: 14, color: profileTheme.text },
  txDate: { fontFamily: profileTheme.fonts.regular, fontSize: 12, color: profileTheme.textLight, marginTop: 2 },
  txPoints: { fontFamily: profileTheme.fonts.bold, fontSize: 15 },
  txPlus: { color: profileTheme.success },
  txMinus: { color: profileTheme.danger },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { fontFamily: profileTheme.fonts.semibold, fontSize: 14, color: profileTheme.textMuted },
})
