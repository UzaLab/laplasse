'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, Database, Globe, Search } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { authApiFetch } from '@/lib/authFetch'
import { notify } from '@/lib/notify'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

type OpAction = 'sync-search' | 'seed-marketplace' | 'seed-multipays'

const OPS: Array<{
  id: OpAction
  title: string
  description: string
  icon: typeof Search
  superAdminOnly?: boolean
}> = [
  {
    id: 'sync-search',
    title: 'Réindexer la recherche',
    description: 'Synchronise les établissements et produits vers Meilisearch.',
    icon: Search,
  },
  {
    id: 'seed-marketplace',
    title: 'Seed marketplace',
    description: 'Réinitialise les données demo marketplace (dev/staging).',
    icon: Database,
    superAdminOnly: true,
  },
  {
    id: 'seed-multipays',
    title: 'Seed multi-pays',
    description: 'Injecte les référentiels geo multi-pays de démo.',
    icon: Globe,
    superAdminOnly: true,
  },
]

export default function AdminSystemPage() {
  const { user } = useAdminSession()
  const [running, setRunning] = useState<OpAction | null>(null)

  const runOp = async (action: OpAction) => {
    setRunning(action)
    try {
      const res = await authApiFetch(`/admin/${action}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string }
        notify.error(err.message ?? 'Opération échouée')
        return
      }
      notify.success('Opération terminée avec succès')
    } catch {
      notify.error('Erreur réseau')
    } finally {
      setRunning(null)
    }
  }

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  return (
    <AdminPageContainer>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Système & ops
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Outils de maintenance plateforme. Les seeds sont réservés au super admin.
        </p>
      </div>

      <div className="grid gap-4">
        {OPS.map(op => {
          if (op.superAdminOnly && !isSuperAdmin) return null
          const Icon = op.icon
          const busy = running === op.id

          return (
            <div
              key={op.id}
              className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{op.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{op.description}</p>
              </div>
              <button
                type="button"
                disabled={busy || running !== null}
                onClick={() => runOp(op.id)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-colors shrink-0"
              >
                {busy ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Exécuter
              </button>
            </div>
          )
        })}
      </div>

      {!isSuperAdmin && (
        <p className="text-xs text-slate-400">
          Connecté en {user?.role} — certaines opérations sensibles nécessitent SUPER_ADMIN.
        </p>
      )}
    </AdminPageContainer>
  )
}
