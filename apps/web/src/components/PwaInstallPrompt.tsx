'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { useT } from '@/providers/LocaleProvider'
import { isIosSafari, isStandalonePwa } from '@/lib/pwa'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'lp_pwa_install_dismissed'

export function PwaInstallPrompt() {
  const t = useT()
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(DISMISS_KEY) === '1') {
      setDismissed(true)
      return
    }
    if (isStandalonePwa()) return

    if (isIosSafari()) {
      const timer = window.setTimeout(() => {
        setShowIos(true)
        setVisible(true)
      }, 3000)
      return () => window.clearTimeout(timer)
    }

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const choice = await deferred.userChoice
    setVisible(false)
    setDeferred(null)
    if (choice.outcome === 'dismissed') dismiss()
  }

  if (dismissed || !visible) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 inset-x-4 z-[60] max-w-md mx-auto pointer-events-auto safe-area-bottom">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 border border-white/10">
        <div className="w-10 h-10 rounded-xl bg-brand-500 text-slate-900 flex items-center justify-center shrink-0">
          {showIos ? <Share size={18} /> : <Download size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">{t('pwa.installTitle')}</p>
          <p className="text-xs text-slate-300 mt-0.5">
            {showIos ? t('pwa.iosBody') : t('pwa.installBody')}
          </p>
          {!showIos && (
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
                onClick={dismiss}
                className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold"
              >
                {t('pwa.later')}
              </button>
            </div>
          )}
          {showIos && (
            <button
              type="button"
              onClick={dismiss}
              className="mt-3 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold"
            >
              {t('pwa.later')}
            </button>
          )}
        </div>
        <button type="button" onClick={dismiss} className="text-slate-400 hover:text-white shrink-0" aria-label={t('common.close')}>
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
