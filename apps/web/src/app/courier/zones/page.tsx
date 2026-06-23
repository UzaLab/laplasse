'use client'

import { Loader2 } from 'lucide-react'
import { CourierShell } from '@/features/courier/components/CourierShell'
import { CourierZonesEditor } from '@/features/courier/components/CourierZonesEditor'
import { useCourierSession } from '@/features/courier/hooks/useCourierSession'

export default function CourierZonesPage() {
  const { ready, profile } = useCourierSession()

  if (!ready || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={28} />
      </div>
    )
  }

  return (
    <CourierShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Zones de service</h1>
          <p className="text-slate-500 mt-1">
            Choisissez où vous acceptez des livraisons — données alignées sur le référentiel geo LaPlasse.
          </p>
        </div>
        <CourierZonesEditor profileCity={profile.city} profileCountry={profile.country} />
      </div>
    </CourierShell>
  )
}
