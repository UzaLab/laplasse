import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { profileTheme } from '@/src/lib/profileTheme'

export function ProfileCard({
  children,
  dark,
}: {
  children: React.ReactNode
  dark?: boolean
}) {
  return (
    <View style={[styles.card, dark && styles.cardDark]}>
      {children}
    </View>
  )
}

export function ProfileFilterTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabsTrack}
    >
      {tabs.map(tab => {
        const isActive = tab.id === active
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

export function ProfilePageTitle({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <View style={styles.titleBlock}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  )
}

export function ProfileBadge({
  label,
  tone = 'neutral',
}: {
  label: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'amber'
}) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: profileTheme.surface,
    borderRadius: profileTheme.cardRadius,
    borderWidth: 1,
    borderColor: profileTheme.border,
    padding: 20,
    gap: 12,
  },
  cardDark: {
    backgroundColor: profileTheme.navActiveBg,
    borderColor: profileTheme.navActiveBg,
  },
  tabsTrack: { flexDirection: 'row', gap: 8, paddingBottom: 4 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: profileTheme.border,
    backgroundColor: profileTheme.surface,
  },
  tabActive: {
    backgroundColor: profileTheme.navActiveBg,
    borderColor: profileTheme.navActiveBg,
  },
  tabText: {
    fontFamily: profileTheme.fonts.semibold,
    fontSize: 13,
    color: profileTheme.textMuted,
  },
  tabTextActive: {
    color: '#fff',
  },
  titleBlock: { gap: 6, marginBottom: 4 },
  title: {
    fontFamily: profileTheme.fonts.extrabold,
    fontSize: 24,
    color: profileTheme.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    lineHeight: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badge_neutral: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  badge_success: { backgroundColor: profileTheme.successBg, borderColor: '#a7f3d0' },
  badge_warning: { backgroundColor: profileTheme.accentLight, borderColor: '#fde68a' },
  badge_danger: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  badge_amber: { backgroundColor: profileTheme.accentLight, borderColor: '#fde68a' },
  badgeText: { fontFamily: profileTheme.fonts.bold, fontSize: 11 },
  badgeText_neutral: { color: '#475569' },
  badgeText_success: { color: profileTheme.success },
  badgeText_warning: { color: '#92400e' },
  badgeText_danger: { color: '#991b1b' },
  badgeText_amber: { color: '#92400e' },
})
