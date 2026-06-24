'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileText, Loader2, Filter } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { adminFetch } from '@/lib/adminApi'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

const AUDIT_ACTIONS = ['', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'PAYMENT', 'MODERATION'] as const

interface AuditLogRow {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  created_at: string
  user?: { email: string; full_name: string | null; role: string }
}

export default function AdminAuditPage() {
  const { ready } = useAdminSession()
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (action) params.set('action', action)
    if (entityType.trim()) params.set('entity_type', entityType.trim())
    if (q.trim()) params.set('q', q.trim())
    const data = await adminFetch<AuditLogRow[]>(`/admin/audit?${params}`)
    setLogs(data ?? [])
    setLoading(false)
  }, [action, entityType, q])

  useEffect(() => {
    if (!ready) return
    const t = setTimeout(() => { void load() }, 250)
    return () => clearTimeout(t)
  }, [ready, load])

  return (
    <AdminPageContainer>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText size={22} className="text-violet-600" /> Journal d&apos;audit
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Historique des actions administratives sur la plateforme.
        </p>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <Filter size={16} />
          <span className="text-xs font-bold uppercase">Filtres</span>
        </div>
        <select
          value={action}
          onChange={e => setAction(e.target.value)}
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
        >
          {AUDIT_ACTIONS.map(a => (
            <option key={a || 'all'} value={a}>
              {a || 'Toutes les actions'}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={entityType}
          onChange={e => setEntityType(e.target.value)}
          placeholder="Type entité (Merchant, Shop…)"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
        />
        <input
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Email, ID…"
          className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm"
        />
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : logs.length === 0 ? (
        <p className="text-slate-500">Aucune entrée pour ces filtres.</p>
      ) : (
        <div className="space-y-2">
          {logs.map(l => (
            <div key={l.id} className="bg-white border border-slate-100 rounded-2xl p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-slate-900">{l.action}</span>
                <span className="text-slate-400">·</span>
                <span className="text-violet-600 font-semibold">{l.entity_type}</span>
                {l.entity_id && (
                  <span className="text-slate-400 font-mono text-xs">#{l.entity_id.slice(0, 10)}</span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {l.user?.full_name ?? l.user?.email ?? 'système'}
                {l.user?.role ? ` (${l.user.role})` : ''}
                {' · '}
                {new Date(l.created_at).toLocaleString('fr-FR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </AdminPageContainer>
  )
}
