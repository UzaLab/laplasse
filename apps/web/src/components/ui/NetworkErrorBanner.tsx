'use client'

import { RefreshCw, WifiOff } from 'lucide-react'

interface Props {
  message: string
  onRetry: () => void
  loading?: boolean
  className?: string
}

export function NetworkErrorBanner({ message, onRetry, loading = false, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <WifiOff size={18} className="text-amber-600 shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm font-medium text-amber-950">{message}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 shrink-0 px-4 py-2 rounded-xl text-sm font-bold bg-amber-900 text-white hover:bg-amber-800 disabled:opacity-60 transition-colors"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        Réessayer
      </button>
    </div>
  )
}
