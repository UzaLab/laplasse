'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert, Loader2, Check } from 'lucide-react'
import { authApiFetch } from '@/lib/authFetch'
import { useAuthStore } from '@/stores/authStore'

export default function AdminFraudPage() {
  const router = useRouter()
  const { user } = useAuthStore()
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
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      router.push('/')
      return
    }
    load()
  }, [user, router])

  const resolve = async (id: string) => {
    await authApiFetch(`/admin/fraud/${id}/resolve`, { method: 'PATCH' })
    load()
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold flex items-center gap-2 mb-6">
        <ShieldAlert size={22} className="text-red-500" /> Signaux fraude
      </h1>
      {loading ? <Loader2 className="animate-spin" /> : signals.length === 0 ? (
        <p className="text-slate-500">Aucun signal actif.</p>
      ) : (
        <div className="space-y-2">
          {signals.map(s => (
            <div key={s.id} className="bg-white border border-red-100 rounded-xl p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-red-700">{s.signal_type}</p>
                <p className="text-xs text-slate-400">{s.entity_type} · {s.severity} · {new Date(s.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <button onClick={() => resolve(s.id)} className="text-emerald-600"><Check size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
