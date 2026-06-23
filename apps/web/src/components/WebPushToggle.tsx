'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2, Smartphone } from 'lucide-react'
import { isWebPushSupported, subscribeToWebPush, unsubscribeFromWebPush } from '@/lib/webPush'
import { notify } from '@/lib/notify'
import { cn } from '@/lib/utils'

interface Props {
  compact?: boolean
  variant?: 'default' | 'featured'
  description?: string
}

export function WebPushToggle({ compact, variant = 'default', description }: Props) {
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default')
  const supported = isWebPushSupported()

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    } else {
      setPermission('unsupported')
    }
  }, [])

  const enabled = supported && permission === 'granted'

  if (!supported) {
    return (
      <p className="text-sm text-slate-500">
        Les notifications push ne sont pas supportées sur ce navigateur.
      </p>
    )
  }

  const handleEnable = async () => {
    setLoading(true)
    const result = await subscribeToWebPush()
    setLoading(false)
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
    if (result.ok) {
      notify.success('Notifications push activées')
      return
    }
    if (result.reason === 'denied') {
      notify.error('Autorisation refusée dans le navigateur')
    } else if (result.reason === 'no_vapid') {
      notify.error('Push non configuré côté serveur (VAPID)')
    } else {
      notify.error('Impossible d\'activer les notifications push')
    }
  }

  const handleDisable = async () => {
    setLoading(true)
    await unsubscribeFromWebPush()
    setLoading(false)
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission)
    }
    notify.success('Notifications push désactivées')
  }

  if (compact) {
    return (
      <button
        type="button"
        disabled={loading}
        onClick={enabled ? handleDisable : handleEnable}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : enabled ? <BellRing size={16} /> : <Bell size={16} />}
        {enabled ? 'Push actif' : 'Activer le push'}
      </button>
    )
  }

  if (variant === 'featured') {
    return (
      <div className={cn(
        'relative overflow-hidden rounded-[28px] border',
        enabled ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white' : 'border-slate-100 bg-white',
      )}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ring-1',
              enabled ? 'bg-emerald-100 ring-emerald-200/80' : 'bg-slate-100 ring-slate-200/80',
            )}>
              {enabled
                ? <BellRing size={26} className="text-emerald-600" />
                : <Smartphone size={26} className="text-slate-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-extrabold text-slate-900 text-lg">Notifications push (PWA)</p>
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                  enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500',
                )}>
                  {enabled ? 'Activé' : permission === 'denied' ? 'Bloqué' : 'Désactivé'}
                </span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                {description ?? (
                  <>
                    Recevez les mises à jour de livraison, le statut de vos commandes et les rappels de réservation
                    en temps réel — même lorsque l&apos;onglet est fermé.
                  </>
                )}
              </p>
              {permission === 'denied' && (
                <p className="text-xs text-red-600 font-medium mt-2">
                  Autorisation refusée. Réactivez les notifications dans les paramètres de votre navigateur.
                </p>
              )}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={loading || permission === 'denied'}
              onClick={enabled ? handleDisable : handleEnable}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50',
                enabled
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-slate-900 text-white hover:bg-slate-800',
              )}
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {!loading && (enabled ? <BellOff size={18} /> : <BellRing size={18} />)}
              {enabled ? 'Désactiver le push' : 'Activer les notifications push'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
          {enabled ? <BellRing size={20} className="text-brand-600" /> : <Bell size={20} className="text-brand-600" />}
        </div>
        <div>
          <p className="font-bold text-slate-900">Notifications push (PWA)</p>
          <p className="text-sm text-slate-500 mt-0.5">
            {description ?? 'Recevez les mises à jour de livraison et commandes en temps réel, même hors de l\'app.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={enabled ? handleDisable : handleEnable}
        className="w-full py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {enabled ? 'Désactiver les notifications push' : 'Activer les notifications push'}
      </button>
    </div>
  )
}
