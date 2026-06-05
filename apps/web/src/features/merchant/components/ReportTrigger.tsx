'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { ComplaintModal } from './ComplaintModal'

interface ReportTriggerProps {
  merchantId: string
  merchantName: string
}

export function ReportTrigger({ merchantId, merchantName }: ReportTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
      >
        <Flag size={12} /> Signaler cette fiche
      </button>
      {open && (
        <ComplaintModal merchantId={merchantId} merchantName={merchantName} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
