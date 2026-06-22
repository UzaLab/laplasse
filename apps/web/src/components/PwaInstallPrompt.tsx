'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { useT } from '@/providers/LocaleProvider'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PwaInstallPrompt() {
  const t = useT()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('lp_pwa_install_dismissed') === '1') {
      setDismissed(true)
      return
    }
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    setVisible(false)
    setDeferred(null)
    if (choice.outcome === 'dismissed') {
      localStorage.setItem('lp_pwa_install_dismissed', '1')
      setDismissed(true)
    }
  }

  const close = () => {
    setVisible(false)
    localStorage.setItem('lp_pwa_install_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed || !visible || !deferred) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 inset-x-4 z-[60] max-w-md mx-auto pointer-events-auto">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-white/10">
        <div className="w-10 h-10 rounded-xl bg-brand-500 text-slate-900 flex items-center justify-center shrink-0">
          <Download size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{t('pwa.installTitle')}</p>
          <p className="text-xs text-slate-300 mt-0.5">{t('pwa.installBody')}</p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={() => void install()}
              className="px-3 py-1.5 rounded-lg bg-brand-500 text-slate-900 text-xs font-bold"
            >
              {t('pwa.install')}
            </button>
            <button
              type="button"
              onClick={close}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold"
            >
              {t('pwa.later')}
            </button>
          </div>
        </div>
        <button type="button" onClick={close} className="text-slate-400 hover:text-white shrink-0" aria-label="Fermer">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
