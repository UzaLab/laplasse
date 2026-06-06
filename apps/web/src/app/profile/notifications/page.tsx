'use client'

import Link from 'next/link'
import { Bell, ArrowLeft, Loader2, CheckCheck } from 'lucide-react'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authApiFetch } from '@/lib/authFetch'
import { ProfileShell } from '@/features/profile/components/ProfileShell'
import { NotificationIcon } from '@/lib/icons'

interface Notif {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  created_at: string
}

export default function NotificationsPage() {
  const { ready: authReady, hydrated, isAuthenticated } = useRequireAuth('/profile/notifications')
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery<Notif[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await authApiFetch('/notifications')
      if (!res.ok) return []
      return res.json()
    },
    enabled: authReady,
  })

  const markAllRead = useMutation({
    mutationFn: async () => {
      await authApiFetch('/notifications/read-all', { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await authApiFetch(`/notifications/${id}/read`, { method: 'PATCH' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <ProfileShell>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={15} /> Retour
        </Link>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <CheckCheck size={14} /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Bell size={22} className="text-slate-700" /> Notifications
          {unreadCount > 0 && (
            <span className="bg-amber-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </h1>
      </div>

      <div className="max-w-2xl">
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-slate-300" /></div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-slate-100 p-10 text-center">
          <Bell size={36} className="mx-auto mb-3 text-slate-200" />
          <p className="font-semibold text-slate-500">Aucune notification</p>
          <p className="text-sm text-slate-400 mt-1">Nous vous tiendrons informé ici.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-50">
            {notifications.map(n => (
              <button
                key={n.id}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left transition-colors hover:bg-slate-50 ${!n.read ? 'bg-amber-50/50' : ''}`}
                onClick={() => !n.read && markRead.mutate(n.id)}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <NotificationIcon type={n.type} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.read && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </ProfileShell>
  )
}
