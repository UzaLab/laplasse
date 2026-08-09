'use client'

import { Copy, Link2, Share2 } from 'lucide-react'
import { notify } from '@/lib/notify'

interface LogisticsFleetInviteCardProps {
  partnerName: string
  url: string
}

export function LogisticsFleetInviteCard({ partnerName, url }: LogisticsFleetInviteCardProps) {
  const copyInvite = async () => {
    await navigator.clipboard.writeText(url)
    notify.success('Lien d\'invitation copié')
  }

  const shareInvite = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Rejoindre ${partnerName} sur LaPlasse`,
          text: `Inscrivez-vous comme livreur pour ${partnerName} :`,
          url,
        })
        return
      } catch {
        /* annulé ou indisponible */
      }
    }
    await copyInvite()
  }

  return (
    <section className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-5 border-b border-slate-50 flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Link2 size={20} strokeWidth={2.25} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-indigo-600 mb-1">
            Recrutement flotte
          </p>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Invitation livreurs
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Partagez ce lien pour que les livreurs rejoignent{' '}
            <span className="font-semibold text-slate-700">{partnerName}</span>{' '}
            sur LaPlasse.
          </p>
        </div>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-3">
        <label htmlFor="fleet-invite-url" className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
          Lien d&apos;invitation
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="fleet-invite-url"
            readOnly
            value={url}
            className="flex-1 min-w-0 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600 bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void copyInvite()}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
            >
              <Copy size={16} />
              Copier
            </button>
            <button
              type="button"
              onClick={() => void shareInvite()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              aria-label="Partager le lien"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Les livreurs s&apos;inscrivent via ce lien et sont automatiquement rattachés à votre flotte.
        </p>
      </div>
    </section>
  )
}
