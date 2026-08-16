import { Ionicons } from '@expo/vector-icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { CourierShell } from '@/src/components/CourierShell'
import { GlassCard } from '@/src/components/GlassCard'
import { LoadingState } from '@/src/components/ui'
import { useCourierLocationSync } from '@/src/hooks/useCourierLocationSync'
import { getApiClient } from '@/src/lib/api'
import { JOB_STATUS_LABELS } from '@/src/lib/jobLabels'
import {
  COURIER_STATUS_LABELS,
  type CourierStatus,
  vehicleLabel,
} from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout, maquette, radii, shadows } from '@/src/theme'

function DashboardStatCard({
  icon,
  label,
  value,
  accent,
  showDot,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  value: string
  accent?: boolean
  showDot?: boolean
}) {
  return (
    <GlassCard style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <Ionicons name={icon} size={20} color={colors.textMuted} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statValueRow}>
        {showDot ? <View style={styles.statusDot} /> : null}
        <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      </View>
    </GlassCard>
  )
}

export default function CourierDashboardScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const refreshUser = useAuthStore(s => s.refreshUser)
  const profile = user?.courier_profile
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus
  const canGoOnline = status === 'ACTIVE'
  const isOnline = profile?.is_online ?? false

  const { error: locationError, syncing } = useCourierLocationSync(canGoOnline && isOnline)

  const activeJobQuery = useQuery({
    queryKey: ['courier-active-job'],
    queryFn: () => getApiClient().getCourierActiveJob(),
    enabled: !!profile,
    refetchInterval: 20_000,
  })

  const toggleMutation = useMutation({
    mutationFn: (next: boolean) => getApiClient().setCourierOnline(next),
    onSuccess: async () => {
      await refreshUser()
      void queryClient.invalidateQueries({ queryKey: ['courier-active-job'] })
    },
  })

  if (!profile) return <CourierShell><LoadingState /></CourierShell>

  const firstName = user?.full_name?.split(' ')[0]
  const activeJob = activeJobQuery.data
  const ratingValue = profile.rating_count
    ? `${profile.rating_avg?.toFixed(1)} / 5`
    : '—'

  return (
    <CourierShell>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header — maquette */}
        <View style={styles.greeting}>
          <Text style={styles.eyebrow}>Espace Coursier</Text>
          <Text style={styles.greetingTitle}>
            Bonjour{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text style={styles.greetingSub}>Prêt pour votre prochaine mission ?</Text>
        </View>

        {/* Disponibilité — maquette layout + toggle capture/PWA */}
        <GlassCard style={styles.availabilityCard}>
          <View style={styles.availabilityTop}>
            <View style={styles.gpsIconWrap}>
              <Ionicons name="navigate" size={24} color={colors.onTertiaryContainer} />
            </View>
            <View style={styles.availabilityCopy}>
              {status === 'ACTIVE' ? (
                <View style={styles.maquetteBadge}>
                  <Text style={styles.maquetteBadgeText}>Actif</Text>
                </View>
              ) : null}
              <Text style={styles.availabilityTitle}>Disponibilité</Text>
              <Text style={styles.availabilityHint}>
                {canGoOnline
                  ? (isOnline
                    ? 'Synchronisation GPS active. Vous êtes visible pour recevoir des courses dans votre zone.'
                    : 'Passez en ligne pour recevoir des missions dans votre zone.')
                  : 'Votre profil doit être validé par l\'équipe ops.'}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.onlineToggle,
              isOnline ? styles.onlineToggleOn : styles.onlineToggleOff,
              (!canGoOnline || toggleMutation.isPending) && styles.onlineToggleDisabled,
            ]}
          >
            <Pressable
              disabled={!canGoOnline || toggleMutation.isPending}
              onPress={() => toggleMutation.mutate(!isOnline)}
              style={styles.onlineToggleMain}
            >
              {toggleMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isOnline ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.onlineToggleText}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
                </>
              )}
            </Pressable>
            <Switch
              value={isOnline}
              onValueChange={value => {
                if (canGoOnline && !toggleMutation.isPending) toggleMutation.mutate(value)
              }}
              disabled={!canGoOnline || toggleMutation.isPending}
              trackColor={{ false: '#475569', true: 'rgba(255,255,255,0.4)' }}
              thumbColor="#fff"
              ios_backgroundColor="#334155"
              accessibilityLabel={isOnline ? 'Passer hors ligne' : 'Passer en ligne'}
            />
          </View>

          {toggleMutation.error ? (
            <Text style={styles.error}>{(toggleMutation.error as Error).message}</Text>
          ) : null}

          {isOnline && canGoOnline ? (
            <View style={styles.gpsRow}>
              {syncing ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons name="location-outline" size={18} color={colors.textMuted} />
              )}
              <Text style={styles.gpsText}>
                {locationError
                  ? locationError
                  : profile.current_latitude != null
                    ? `Position GPS synchronisée (${profile.current_latitude.toFixed(4)}, ${profile.current_longitude?.toFixed(4)})`
                    : 'Synchronisation GPS en cours…'}
              </Text>
            </View>
          ) : null}
        </GlassCard>

        {/* Stats bento 2×2 — maquette */}
        <View style={styles.statsGrid}>
          <DashboardStatCard
            icon="shield-checkmark-outline"
            label="Statut"
            value={COURIER_STATUS_LABELS[status]}
            showDot={status === 'ACTIVE'}
          />
          <DashboardStatCard icon="location-outline" label="Ville" value={profile.city} />
          <DashboardStatCard
            icon="bicycle-outline"
            label="Véhicule"
            value={vehicleLabel(profile.vehicle)}
          />
          <DashboardStatCard
            icon="star-outline"
            label="Note globale"
            value={ratingValue}
            accent={!!profile.rating_count}
          />
        </View>

        {status === 'PENDING_REVIEW' ? (
          <Pressable style={styles.pendingCard} onPress={() => router.push('/(courier)/onboarding')}>
            <Text style={styles.pendingTitle}>Candidature en cours de validation</Text>
            <Text style={styles.pendingBody}>
              Notre équipe vérifie votre dossier. Vous serez notifié dès activation.
            </Text>
            <Text style={styles.pendingLink}>Voir les prochaines étapes →</Text>
          </Pressable>
        ) : null}

        {/* Missions — style capture/PWA conservé */}
        <View style={styles.missionsCard}>
          <Text style={styles.missionsTitle}>Missions</Text>
          {activeJob ? (
            <>
              <Text style={styles.missionsBody}>
                Course en cours — {activeJob.order.shop_name} ({JOB_STATUS_LABELS[activeJob.status]})
              </Text>
              <Pressable
                style={styles.missionsBtn}
                onPress={() => router.push('/(courier)/missions')}
              >
                <Text style={styles.missionsBtnText}>Gérer la mission</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.missionsBody}>
                {isOnline
                  ? 'Consultez les missions disponibles dans votre zone.'
                  : 'Passez en ligne pour recevoir des courses.'}
              </Text>
              <Pressable
                style={styles.missionsBtn}
                onPress={() => router.push('/(courier)/missions')}
              >
                <Text style={styles.missionsBtnText}>Voir les missions</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.pageGutter,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 30,
  },
  greeting: { gap: 6 },
  eyebrow: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  greetingTitle: { fontFamily: fonts.bold, fontSize: 22, color: colors.text, lineHeight: 28 },
  greetingSub: { fontFamily: fonts.regular, fontSize: 16, color: colors.onSurfaceVariant, lineHeight: 24, marginTop: 2 },
  availabilityCard: { padding: 24, gap: 16, borderRadius: radii.glassLg },
  availabilityTop: { flexDirection: 'row', gap: 16 },
  gpsIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.tertiaryFixedMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityCopy: { flex: 1, gap: 6 },
  maquetteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tertiaryFixedMuted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 2,
  },
  maquetteBadgeText: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.onTertiaryContainer,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  availabilityTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text, lineHeight: 24 },
  availabilityHint: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.button,
    paddingLeft: 20,
    paddingRight: 14,
    paddingVertical: 10,
    width: '100%',
  },
  onlineToggleMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  onlineToggleOn: { backgroundColor: colors.onTertiaryContainer },
  onlineToggleOff: { backgroundColor: colors.slate900 },
  onlineToggleDisabled: { opacity: 0.5 },
  onlineToggleText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 18 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, flex: 1, lineHeight: 20 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: maquette.gridGutter,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    gap: 8,
    borderRadius: radii.glass,
  },
  statCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statLabel: {
    fontFamily: fonts.semibold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'capitalize',
  },
  statValueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiaryFixedDim,
  },
  statValue: { fontFamily: fonts.semibold, fontSize: 18, color: colors.text, lineHeight: 24 },
  statValueAccent: { color: colors.secondaryContainer },
  pendingCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 16,
    gap: 6,
    marginTop: -16,
  },
  pendingTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#92400e' },
  pendingBody: { fontFamily: fonts.regular, fontSize: 14, color: '#b45309', lineHeight: 20 },
  pendingLink: { fontFamily: fonts.bold, fontSize: 14, color: '#b45309', marginTop: 4 },
  missionsCard: {
    backgroundColor: colors.slate900,
    borderRadius: 28,
    padding: 24,
    gap: 8,
    ...shadows.card,
  },
  missionsTitle: { fontFamily: fonts.extrabold, fontSize: 20, color: '#fff' },
  missionsBody: { fontFamily: fonts.regular, fontSize: 14, color: '#94a3b8', lineHeight: 20 },
  missionsBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.emerald500,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  missionsBtnText: { fontFamily: fonts.bold, fontSize: 14, color: colors.slate900 },
})
