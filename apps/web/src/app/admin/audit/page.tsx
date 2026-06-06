'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Loader2 } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/authStore'

export default function AdminAuditPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [logs, setLogs] = useState<Array<{
    id: string
    action: string
    entity_type: string
    entity_id: string | null
    created_at: string
    user?: { email: string; full_name: string | null }
  }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/')
      return
    }
    authApiFetch('/admin/audit')
      .then(r => r.ok ? r.json() : [])
      .then(setLogs)
      .finally(() => setLoading(false))
  }, [user, router])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-6">
        <FileText size={22} /> Journal d&apos;audit
      </h1>
      {loading ? <Loader2 className="animate-spin" /> : (
        <div className="space-y-2">
          {logs.map(l => (
            <div key={l.id} className="bg-white border border-slate-100 rounded-xl p-4 text-sm">
              <span className="font-bold">{l.action}</span> · {l.entity_type}
              {l.entity_id && <span className="text-slate-400"> #{l.entity_id.slice(0, 8)}</span>}
              <p className="text-xs text-slate-400 mt-1">
                {l.user?.email ?? 'système'} — {new Date(l.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
