'use client'

import { Toaster } from 'sonner'

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'font-medium shadow-lg border border-slate-200',
          title: 'font-bold text-sm',
          description: 'text-sm text-slate-600',
        },
      }}
    />
  )
}
