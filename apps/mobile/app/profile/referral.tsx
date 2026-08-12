import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ProfileCard, ProfilePageTitle } from '@/src/components/profile/ProfileUi'
import { ProfileScreenScroll } from '@/src/components/profile/ProfileShell'
import { getApiClient } from '@/src/lib/api'
import { notify } from '@/src/lib/notify'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

export default function ProfileReferralScreen() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)

  const referralQuery = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => getApiClient().getReferralStats(),
  })

  const code = referralQuery.data?.code ?? '...'
  const shareText = `Rejoins LaPlasse avec mon code parrain : ${code}`

  async function copyCode() {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(code)
      } else {
        await Share.share({ message: code })
      }
      setCopied(true)
      notify.success('Code copié')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notify.error('Copie impossible')
    }
  }

  async function shareNative() {
    try {
      await Share.share({ message: shareText })
    } catch {
      // ignore
    }
  }

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <ProfilePageTitle
        title="Parrainage"
        subtitle="Gagnez 30 points pour chaque ami qui rejoint LaPlasse."
      />

      {referralQuery.isLoading ? (
        <ActivityIndicator color={profileTheme.accent} />
      ) : (
        <>
          <View style={styles.hero}>
            <Ionicons name="gift-outline" size={36} color="#fff" />
            <Text style={styles.heroTitle}>Parrainez vos amis</Text>
            <Text style={styles.heroSub}>
              Partagez votre code et cumulez des points fidélité.
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{referralQuery.data?.uses_count ?? 0}</Text>
                <Text style={styles.statLabel}>Parrainés</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {referralQuery.data?.total_points_earned ?? 0}
                </Text>
                <Text style={styles.statLabel}>Points gagnés</Text>
              </View>
            </View>
          </View>

          <ProfileCard>
            <Text style={styles.codeLabel}>Votre code</Text>
            <Text style={styles.codeValue}>{code}</Text>
            <View style={styles.codeActions}>
              <Pressable style={styles.primaryBtn} onPress={() => void copyCode()}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{copied ? 'Copié' : 'Copier'}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => openWhatsApp('', shareText)}
              >
                <Ionicons name="logo-whatsapp" size={18} color={profileTheme.text} />
                <Text style={styles.secondaryBtnText}>WhatsApp</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={() => void shareNative()}>
                <Ionicons name="share-outline" size={18} color={profileTheme.text} />
                <Text style={styles.secondaryBtnText}>Partager</Text>
              </Pressable>
            </View>
          </ProfileCard>

          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          {[
            'Partagez votre code à vos proches',
            'Ils s\'inscrivent sur LaPlasse',
            'Vous gagnez 30 points par parrainage',
          ].map((step, i) => (
            <ProfileCard key={step}>
              <View style={styles.stepRow}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            </ProfileCard>
          ))}

          <Text style={styles.sectionTitle}>Vos filleuls</Text>
          {(referralQuery.data?.referrals ?? []).length === 0 ? (
            <ProfileCard>
              <Text style={styles.empty}>Aucun parrainage pour le moment.</Text>
            </ProfileCard>
          ) : (
            (referralQuery.data?.referrals ?? []).map(ref => (
              <ProfileCard key={ref.id}>
                <Text style={styles.refName}>
                  {ref.invited_user.full_name ?? 'Nouveau membre'}
                </Text>
                <Text style={styles.refDate}>
                  {new Date(ref.invited_user.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </ProfileCard>
            ))
          )}

          <Pressable style={styles.backLink} onPress={() => router.push('/profile' as never)}>
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
    backgroundColor: '#10b981',
    borderRadius: profileTheme.cardRadius,
    padding: 24,
    gap: 8,
  },
  heroTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 22,
    color: '#fff',
  },
  heroSub: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 28,
    color: '#fff',
  },
  statLabel: {
    fontFamily: profileTheme.fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  codeLabel: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 12,
    color: profileTheme.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeValue: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 32,
    color: profileTheme.text,
    letterSpacing: 4,
    textAlign: 'center',
    marginVertical: 8,
  },
  codeActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: profileTheme.navActiveBg,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 999,
  },
  primaryBtnText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: '#fff' },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: profileTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 999,
  },
  secondaryBtnText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.text },
  sectionTitle: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 18,
    color: profileTheme.text,
    marginTop: 8,
  },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: profileTheme.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.accent },
  stepText: { flex: 1, fontFamily: profileTheme.fonts.medium, fontSize: 14, color: profileTheme.text },
  empty: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
  },
  refName: { fontFamily: profileTheme.fonts.bold, fontSize: 15, color: profileTheme.text },
  refDate: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 12,
    color: profileTheme.textLight,
    marginTop: 4,
  },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  backLinkText: { fontFamily: profileTheme.fonts.semibold, fontSize: 14, color: profileTheme.textMuted },
})
