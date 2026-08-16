import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { CourierAvatar } from '@/src/components/CourierAvatar'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { Card, PrimaryButton } from '@/src/components/ui'
import { COURIER_STATUS_LABELS, type CourierStatus, vehicleLabel } from '@/src/lib/labels'
import { useAuthStore } from '@/src/stores/authStore'
import { colors, fonts, layout } from '@/src/theme'

export default function CourierProfileScreen() {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const profile = user?.courier_profile
  const status = (profile?.status ?? 'PENDING_REVIEW') as CourierStatus

  return (
    <CourierShell>
      <ScrollView contentContainerStyle={styles.scroll}>
        <CourierPageHeader title="Profil" subtitle={user?.email ?? ''} />

        <Card>
          <View style={styles.profileRow}>
            <CourierAvatar user={user} size={56} />
            <View style={styles.profileCopy}>
              <Text style={styles.name}>{user?.full_name ?? 'Livreur'}</Text>
              <Text style={styles.meta}>{profile?.phone ?? user?.phone ?? '—'}</Text>
            </View>
          </View>
          <Text style={styles.meta}>{profile?.city ?? '—'} · {vehicleLabel(profile?.vehicle ?? 'MOTO')}</Text>
          <Text style={styles.badge}>{COURIER_STATUS_LABELS[status]}</Text>
          <Text style={styles.meta}>
            {profile?.completed_jobs ?? 0} livraisons · {profile?.rating_count ? `${profile.rating_avg?.toFixed(1)} ★` : 'Pas encore noté'}
          </Text>
        </Card>

        <Pressable style={styles.link} onPress={() => router.push('/(courier)/zones')}>
          <Text style={styles.linkText}>Zones de service</Text>
        </Pressable>

        <Pressable style={styles.link} onPress={() => router.push('/(courier)/onboarding')}>
          <Text style={styles.linkText}>Parcours d'onboarding</Text>
        </Pressable>

        <PrimaryButton label="Se déconnecter" variant="slate" onPress={() => void logout().then(() => router.replace('/(auth)/login'))} />
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: layout.pageGutter, paddingBottom: layout.bottomNavInset + 24, gap: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  profileCopy: { flex: 1 },
  name: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, marginTop: 6 },
  badge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: colors.emerald50,
    color: colors.emerald700,
    fontFamily: fonts.semibold,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: 'hidden',
  },
  link: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  linkText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
})
