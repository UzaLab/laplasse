'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Scissors, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { merchantApiFetch } from '@/lib/merchantApi'
import { MerchantShell } from '@/features/merchant/components/MerchantShell'
import { getHighestPlan, PLAN_LIMITS } from '@/lib/planLimits'

export default function MerchantStaffPage() {
  const router = useRouter()
  const { isAuthenticated, activeMerchantId, user } = useAuthStore()
  const [staff, setStaff] = useState<Array<{ id: string; name: string; role: string | null }>>([])
  const [services, setServices] = useState<Array<{ id: string; name: string; duration_min: number }>>([])
  const [loading, setLoading] = useState(true)
  const [staffName, setStaffName] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [serviceDuration, setServiceDuration] = useState('60')

  const plan = getHighestPlan(user?.merchants ?? [])
  const canStaff = PLAN_LIMITS[plan]?.staffManagement ?? false

  const load = async () => {
    setLoading(true)
    const [sRes, svcRes] = await Promise.all([
      canStaff ? merchantApiFetch('/merchants/me/staff', activeMerchantId) : Promise.resolve(null),
      merchantApiFetch('/merchants/me/services', activeMerchantId),
    ])
    if (sRes?.ok) setStaff(await sRes.json())
    if (svcRes.ok) setServices(await svcRes.json())
    setLoading(false)
  }

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login?redirect=/merchant/staff'); return }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeMerchantId])

  const addStaff = async () => {
    await merchantApiFetch('/merchants/me/staff', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: staffName }),
    })
    setStaffName('')
    load()
  }

  const addService = async () => {
    await merchantApiFetch('/merchants/me/services', activeMerchantId, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: serviceName, duration_min: Number(serviceDuration) }),
    })
    setServiceName('')
    load()
  }

  return (
    <MerchantShell>
      <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2 mb-6">
        <Scissors size={22} className="text-amber-500" /> Prestations & équipe
      </h1>

      <section className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Scissors size={16} /> Prestations (salons, spas)</h2>
        <div className="flex gap-2 mb-4">
          <input placeholder="Nom prestation" value={serviceName} onChange={e => setServiceName(e.target.value)}
            className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <input type="number" min={15} value={serviceDuration} onChange={e => setServiceDuration(e.target.value)}
            className="w-20 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
          <button onClick={addService} disabled={!serviceName} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
            <Plus size={14} />
          </button>
        </div>
        {services.map(s => (
          <p key={s.id} className="text-sm text-slate-600 py-1">{s.name} — {s.duration_min} min</p>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Users size={16} /> Équipe</h2>
        {!canStaff ? (
          <p className="text-sm text-slate-500">Plan Growth+ requis pour gérer l&apos;équipe.</p>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <input placeholder="Nom" value={staffName} onChange={e => setStaffName(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" />
              <button onClick={addStaff} disabled={!staffName} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">
                <Plus size={14} />
              </button>
            </div>
            {loading ? <Loader2 className="animate-spin" size={18} /> : staff.map(s => (
              <p key={s.id} className="text-sm text-slate-600 py-1">{s.name}{s.role ? ` (${s.role})` : ''}</p>
            ))}
          </>
        )}
      </section>
    </MerchantShell>
  )
}
