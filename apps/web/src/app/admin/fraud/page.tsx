'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, Loader2, Check } from 'lucide-react'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { authApiFetch } from '@/lib/authFetch'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'

export default function AdminFraudPage() {
  const { ready } = useAdminSession()
  const [signals, setSignals] = useState<Array<{
    id: string
    signal_type: string
    severity: string
    entity_type: string
    created_at: string
  }>>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    authApiFetch('/admin/fraud')
      .then(r => r.ok ? r.json() : [])
      .then(setSignals)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready])

  const resolve = async (id: string) => {
    await authApiFetch(`/admin/fraud/${id}/resolve`, { method: 'PATCH' })
    load()
  }

  return (
    <AdminPageContainer>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldAlert size={22} className="text-red-500" /> Signaux fraude
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Alertes automatiques détectées sur la plateforme.
        </p>
      </div>

      {loading ? (
        <Loader2 className="animate-spin text-violet-600" />
      ) : signals.length === 0 ? (
        <p className="text-slate-500">Aucun signal actif.</p>
      ) : (
        <div className="space-y-2">
          {signals.map(s => (
            <div
              key={s.id}
              className="bg-white border border-red-100 rounded-2xl p-4 flex justify-between items-center gap-4"
            >
              <div>
                <p className="font-bold text-red-700">{s.signal_type}</p>
                <p className="text-xs text-slate-400">
                  {s.entity_type} · {s.severity} · {new Date(s.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => resolve(s.id)}
                className="p-2 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Marquer comme résolu"
              >
                <Check size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminPageContainer>
  )
}
