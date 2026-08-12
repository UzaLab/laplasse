import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useState } from 'react'
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
import { notify } from '@/src/lib/notify'
import { profileTheme } from '@/src/lib/profileTheme'
import { layout } from '@/src/theme'

type Filter = 'all' | 'unread'

export default function ProfileNotificationsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<Filter>('all')
  const [page, setPage] = useState(1)

  const notificationsQuery = useQuery({
    queryKey: ['notifications', filter, page],
    queryFn: () =>
      getApiClient().getNotifications({
        page,
        limit: 20,
        unreadOnly: filter === 'unread',
      }),
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => getApiClient().markNotificationRead(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllMutation = useMutation({
    mutationFn: () => getApiClient().markAllNotificationsRead(),
    onSuccess: () => {
      notify.success('Toutes les notifications sont lues')
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const items = notificationsQuery.data?.items ?? []
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0

  return (
    <ProfileScreenScroll bottomInset={layout.bottomNavInset + 24}>
      <View style={styles.headerRow}>
        <ProfilePageTitle
          title="Notifications"
          subtitle="Alertes commandes, réservations et activité."
        />
        {unreadCount > 0 ? (
          <Pressable
            style={styles.markAllBtn}
            onPress={() => markAllMutation.mutate()}
          >
            <Text style={styles.markAllText}>Tout lire</Text>
          </Pressable>
        ) : null}
      </View>

      <ProfileFilterTabs
        tabs={[
          { id: 'all' as const, label: 'Toutes' },
          { id: 'unread' as const, label: `Non lues (${unreadCount})` },
        ]}
        active={filter}
        onChange={next => {
          setFilter(next)
          setPage(1)
        }}
      />

      {notificationsQuery.isLoading ? (
        <ActivityIndicator color={profileTheme.accent} style={{ marginTop: 24 }} />
      ) : items.length === 0 ? (
        <ProfileCard>
          <Text style={styles.empty}>Aucune notification.</Text>
        </ProfileCard>
      ) : (
        items.map(notif => (
          <Pressable
            key={notif.id}
            onPress={() => {
              if (!notif.read) markReadMutation.mutate(notif.id)
              const href = notif.data?.href
              if (typeof href === 'string' && href.startsWith('/')) {
                router.push(href as never)
              }
            }}
          >
            <ProfileCard>
              <View style={styles.notifTop}>
                <Text style={[styles.notifTitle, !notif.read && styles.notifUnread]}>
                  {notif.title}
                </Text>
                {!notif.read ? <ProfileBadge label="Nouveau" tone="amber" /> : null}
              </View>
              <Text style={styles.notifBody}>{notif.body}</Text>
              <Text style={styles.notifDate}>
                {new Date(notif.created_at).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </ProfileCard>
          </Pressable>
        ))
      )}

      {(notificationsQuery.data?.totalPages ?? 1) > 1 ? (
        <View style={styles.pagination}>
          <Pressable
            disabled={page <= 1}
            onPress={() => setPage(p => p - 1)}
            style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Précédent</Text>
          </Pressable>
          <Text style={styles.pageInfo}>
            {page} / {notificationsQuery.data?.totalPages ?? 1}
          </Text>
          <Pressable
            disabled={page >= (notificationsQuery.data?.totalPages ?? 1)}
            onPress={() => setPage(p => p + 1)}
            style={[styles.pageBtn, page >= (notificationsQuery.data?.totalPages ?? 1) && styles.pageBtnDisabled]}
          >
            <Text style={styles.pageBtnText}>Suivant</Text>
          </Pressable>
        </View>
      ) : null}
    </ProfileScreenScroll>
  )
}

const styles = StyleSheet.create({
  headerRow: { gap: 8 },
  markAllBtn: { alignSelf: 'flex-start' },
  markAllText: {
    fontFamily: profileTheme.fonts.bold,
    fontSize: 13,
    color: profileTheme.accent,
  },
  empty: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    textAlign: 'center',
  },
  notifTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  notifTitle: {
    flex: 1,
    fontFamily: profileTheme.fonts.bold,
    fontSize: 15,
    color: profileTheme.text,
  },
  notifUnread: { color: profileTheme.navActiveBg },
  notifBody: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 14,
    color: profileTheme.textMuted,
    lineHeight: 20,
    marginTop: 6,
  },
  notifDate: {
    fontFamily: profileTheme.fonts.regular,
    fontSize: 12,
    color: profileTheme.textLight,
    marginTop: 8,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: profileTheme.surface,
    borderWidth: 1,
    borderColor: profileTheme.border,
  },
  pageBtnDisabled: { opacity: 0.45 },
  pageBtnText: { fontFamily: profileTheme.fonts.bold, fontSize: 13, color: profileTheme.text },
  pageInfo: { fontFamily: profileTheme.fonts.medium, fontSize: 13, color: profileTheme.textMuted },
})
